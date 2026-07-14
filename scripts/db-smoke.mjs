import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { databaseSchema, withClient, withTransaction } from "./postgres-utils.mjs";

const id = randomUUID();
const eventId = `evt_${id}`;
const slug = `smoke-${id.slice(0, 8)}`;
const organizerWallet = "GBRPYHILQKWXPH7F6TRXA3J2ZWW63CMUDSJ2Y5X6MX4F2YQN6LQG3YYW";
const requiredUniqueIndexes = {
  anchor_payouts: ["idx_anchor_payouts_stellar_transaction_id"],
  check_ins: ["idx_check_ins_tx_hash_unique"],
  events: [
    "idx_events_core_event_id_unique",
    "idx_events_publish_tx_hash_unique",
  ],
  passes: ["idx_passes_mint_tx_hash_unique"],
  stellar_events: ["stellar_events_pkey", "stellar_events_paging_token_key"],
};

async function tableIndexNames(client, tableName) {
  const { rows } = await client.query(
    `
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = $1 AND tablename = $2
    `,
    [databaseSchema(), tableName],
  );

  return new Set(rows.map((row) => row.indexname));
}

async function assertUniqueLiveProofIndexes(client) {
  for (const [tableName, indexNames] of Object.entries(requiredUniqueIndexes)) {
    const actualIndexNames = await tableIndexNames(client, tableName);

    for (const indexName of indexNames) {
      assert(
        actualIndexNames.has(indexName),
        `${tableName} is missing unique live proof index ${indexName}`,
      );
    }
  }

  const registry = await client.query(
    `
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = $1 AND table_name = 'live_proof_hashes'
    `,
    [databaseSchema()],
  );
  assert.equal(registry.rowCount, 1, "live_proof_hashes registry is missing");

  const indexerTables = await client.query(
    `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = $1
      AND table_name IN ('indexer_state', 'stellar_events')
    `,
    [databaseSchema()],
  );
  assert.equal(indexerTables.rowCount, 2, "indexer tables are missing");

  const anchorCashoutProofColumn = await client.query(
    `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = $1
      AND table_name = 'anchor_payouts'
      AND column_name = 'stellar_transaction_id'
    `,
    [databaseSchema()],
  );
  assert.equal(
    anchorCashoutProofColumn.rowCount,
    1,
    "anchor_payouts.stellar_transaction_id is missing",
  );
}

await withClient(async (client) => {
  const result = await withTransaction(client, async () => {
    await assertUniqueLiveProofIndexes(client);

    await client.query(
      `
      INSERT INTO users (id, wallet_address)
      VALUES ($1, $2)
      `,
      [`usr_${id}`, organizerWallet],
    );

    await client.query(
      `
      INSERT INTO events (
        id, slug, title, event_type, short_description, start_date_time,
        end_date_time, timezone, location_type, location_text, price_usdc,
        is_free, capacity, organizer_wallet
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
      [
        eventId,
        slug,
        "Smoke Test Meetup",
        "workshop",
        "Temporary event used to verify CRUD constraints.",
        "2026-06-08T10:00:00.000Z",
        "2026-06-08T12:00:00.000Z",
        "Asia/Jakarta",
        "physical",
        "Jakarta",
        "10",
        false,
        50,
        organizerWallet,
      ],
    );

    const collaborators = [
      [`col_${id}_1`, eventId, "Organizer", "Host", organizerWallet, 70],
      [
        `col_${id}_2`,
        eventId,
        "Workshop Lead",
        "Speaker",
        "GDZVKOY2J54JIEE5Y4MG4KMX55SPOMT57DMOJ2MMCR34STICD6PZKJ25",
        30,
      ],
    ];

    for (const collaborator of collaborators) {
      await client.query(
        `
        INSERT INTO collaborators (
          id, event_id, display_name, role, wallet_address, split_percentage
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        collaborator,
      );
    }

    await client.query(
      `
      INSERT INTO resources (id, event_id, title, description, type, url, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        `res_${id}`,
        eventId,
        "Workshop Deck",
        "Temporary gated resource.",
        "link",
        "https://example.com/deck",
        1,
      ],
    );

    const event = (
      await client.query("SELECT id, slug, status FROM events WHERE id = $1", [
        eventId,
      ])
    ).rows[0];
    const splitTotal = Number(
      (
        await client.query(
          "SELECT COALESCE(SUM(split_percentage), 0)::float8 AS total FROM collaborators WHERE event_id = $1",
          [eventId],
        )
      ).rows[0].total,
    );
    const resourceCount = Number(
      (
        await client.query(
          "SELECT COUNT(*)::int AS count FROM resources WHERE event_id = $1",
          [eventId],
        )
      ).rows[0].count,
    );

    await client.query("DELETE FROM events WHERE id = $1", [eventId]);
    await client.query("DELETE FROM users WHERE id = $1", [`usr_${id}`]);

    const cleanedUp =
      Number(
        (
          await client.query(
            "SELECT COUNT(*)::int AS count FROM events WHERE id = $1",
            [eventId],
          )
        ).rows[0].count,
      ) === 0;

    return {
      event,
      splitTotal,
      resourceCount,
      cleanedUp,
      checks: [
        "unique-live-proof-indexes",
        "live-proof-hash-registry",
        "indexer-tables",
        "anchor-cashout-proof-column",
        "anchor-cashout-proof-index",
        "event-crud",
        "collaborator-split-total",
        "resource-crud",
        "cascade-cleanup",
      ],
    };
  });

  console.log(JSON.stringify(result, null, 2));
});
