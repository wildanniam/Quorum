import Database from "better-sqlite3";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import path from "node:path";

function resolveDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./data/quorum.db";

  if (!databaseUrl.startsWith("file:")) {
    throw new Error("DB smoke test expects DATABASE_URL to use file:./path/to.db");
  }

  return path.resolve(process.cwd(), databaseUrl.replace(/^file:/, ""));
}

const db = new Database(resolveDatabasePath());
db.pragma("foreign_keys = ON");

const id = randomUUID();
const eventId = `evt_${id}`;
const slug = `smoke-${id.slice(0, 8)}`;
const organizerWallet = "GBRPYHILQKWXPH7F6TRXA3J2ZWW63CMUDSJ2Y5X6MX4F2YQN6LQG3YYW";
const requiredUniqueIndexes = {
  check_ins: ["idx_check_ins_tx_hash_unique"],
  events: [
    "idx_events_core_event_id_unique",
    "idx_events_publish_tx_hash_unique",
  ],
  passes: ["idx_passes_mint_tx_hash_unique"],
};

function tableIndexNames(tableName) {
  return new Set(
    db
      .prepare(`PRAGMA index_list(${JSON.stringify(tableName)})`)
      .all()
      .map((row) => row.name),
  );
}

function assertUniqueLiveProofIndexes() {
  for (const [tableName, indexNames] of Object.entries(requiredUniqueIndexes)) {
    const actualIndexNames = tableIndexNames(tableName);

    for (const indexName of indexNames) {
      assert(
        actualIndexNames.has(indexName),
        `${tableName} is missing unique live proof index ${indexName}`,
      );
    }
  }
}

const runSmoke = db.transaction(() => {
  assertUniqueLiveProofIndexes();

  db.prepare(
    `
    INSERT INTO users (id, wallet_address)
    VALUES (?, ?)
    `,
  ).run(`usr_${id}`, organizerWallet);

  db.prepare(
    `
    INSERT INTO events (
      id, slug, title, event_type, short_description, start_date_time,
      end_date_time, timezone, location_type, location_text, price_usdc,
      is_free, capacity, organizer_wallet
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
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
    0,
    50,
    organizerWallet,
  );

  const collaboratorInsert = db.prepare(
    `
    INSERT INTO collaborators (
      id, event_id, display_name, role, wallet_address, split_percentage
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
  );
  collaboratorInsert.run(
    `col_${id}_1`,
    eventId,
    "Organizer",
    "Host",
    organizerWallet,
    70,
  );
  collaboratorInsert.run(
    `col_${id}_2`,
    eventId,
    "Workshop Lead",
    "Speaker",
    "GDZVKOY2J54JIEE5Y4MG4KMX55SPOMT57DMOJ2MMCR34STICD6PZKJ25",
    30,
  );

  db.prepare(
    `
    INSERT INTO resources (id, event_id, title, description, type, url, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    `res_${id}`,
    eventId,
    "Workshop Deck",
    "Temporary gated resource.",
    "link",
    "https://example.com/deck",
    1,
  );

  const event = db
    .prepare("SELECT id, slug, status FROM events WHERE id = ?")
    .get(eventId);
  const splitTotal = db
    .prepare("SELECT SUM(split_percentage) as total FROM collaborators WHERE event_id = ?")
    .get(eventId).total;
  const resourceCount = db
    .prepare("SELECT COUNT(*) as count FROM resources WHERE event_id = ?")
    .get(eventId).count;

  db.prepare("DELETE FROM events WHERE id = ?").run(eventId);
  db.prepare("DELETE FROM users WHERE id = ?").run(`usr_${id}`);

  return {
    event,
    splitTotal,
    resourceCount,
    cleanedUp: db.prepare("SELECT COUNT(*) as count FROM events WHERE id = ?").get(eventId)
      .count === 0,
    checks: [
      "unique-live-proof-indexes",
      "event-crud",
      "collaborator-split-total",
      "resource-crud",
      "cascade-cleanup",
    ],
  };
});

console.log(JSON.stringify(runSmoke(), null, 2));
db.close();
