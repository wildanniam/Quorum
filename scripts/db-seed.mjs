import Database from "better-sqlite3";
import path from "node:path";

function resolveDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./data/quorum.db";

  if (!databaseUrl.startsWith("file:")) {
    throw new Error("DB seed expects DATABASE_URL to use file:./path/to.db");
  }

  return path.resolve(process.cwd(), databaseUrl.replace(/^file:/, ""));
}

const db = new Database(resolveDatabasePath());
db.pragma("foreign_keys = ON");

const demoEventId = "evt_apac_stellar_builder_meetup";
const freeEventId = "evt_stellar_open_office_hours";
const organizerWallet = "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const speakerWallet = "GC33PRL24QY6EUIHOJT6ITM34QHBJOIFXO4UBL3AS2RECIDIPFAF6YDH";
const partnerWallet = "GBUSN4MX7AE3RKAR4DEJEELBAQ4CZ3Q6PZ4QEU7RW3SQ7OX6ZFSIDGER";

const seed = db.transaction(() => {
  const userInsert = db.prepare(
    "INSERT OR IGNORE INTO users (id, wallet_address) VALUES (?, ?)",
  );
  userInsert.run("usr_demo_organizer", organizerWallet);
  userInsert.run("usr_demo_speaker", speakerWallet);
  userInsert.run("usr_demo_partner", partnerWallet);

  const eventUpsert = db.prepare(
    `
    INSERT INTO events (
      id, slug, title, event_type, short_description, cover_image_url,
      start_date_time, end_date_time, timezone, location_type, location_text,
      meeting_url, price_usdc, is_free, capacity, status, organizer_wallet,
      metadata_hash, publish_tx_hash
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      title = excluded.title,
      event_type = excluded.event_type,
      short_description = excluded.short_description,
      cover_image_url = excluded.cover_image_url,
      start_date_time = excluded.start_date_time,
      end_date_time = excluded.end_date_time,
      timezone = excluded.timezone,
      location_type = excluded.location_type,
      location_text = excluded.location_text,
      meeting_url = excluded.meeting_url,
      price_usdc = excluded.price_usdc,
      is_free = excluded.is_free,
      capacity = excluded.capacity,
      status = excluded.status,
      organizer_wallet = excluded.organizer_wallet,
      metadata_hash = excluded.metadata_hash,
      publish_tx_hash = excluded.publish_tx_hash
    `,
  );

  eventUpsert.run(
    demoEventId,
    "apac-stellar-builder-meetup",
    "APAC Stellar Builder Meetup",
    "Paid Web3 Meetup + Mini Workshop",
    "A builder meetup with USDC split escrow, non-transferable NFT passes, gated resources, and check-in proof.",
    "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1600&q=80",
    "2026-06-21T11:30:00.000Z",
    "2026-06-21T14:30:00.000Z",
    "Asia/Jakarta",
    "hybrid",
    "Jakarta + livestream",
    "https://example.com/livestream",
    "5",
    0,
    80,
    "published",
    organizerWallet,
    "sha256:demo-metadata-hash",
    "testnet:demo-publish-stub",
  );

  eventUpsert.run(
    freeEventId,
    "stellar-open-office-hours",
    "Stellar Open Office Hours",
    "Free Web3 Builder Session",
    "A free community session for builders to discuss Stellar payments, Soroban contracts, and event access ideas.",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80",
    "2026-06-28T09:00:00.000Z",
    "2026-06-28T10:30:00.000Z",
    "Asia/Jakarta",
    "virtual",
    "Livestream",
    "https://example.com/office-hours",
    "0",
    1,
    50,
    "published",
    organizerWallet,
    "sha256:free-demo-metadata-hash",
    "testnet:free-demo-publish-stub",
  );

  db.prepare("DELETE FROM collaborators WHERE event_id = ?").run(demoEventId);
  db.prepare("DELETE FROM resources WHERE event_id = ?").run(demoEventId);
  db.prepare("DELETE FROM collaborators WHERE event_id = ?").run(freeEventId);
  db.prepare("DELETE FROM resources WHERE event_id = ?").run(freeEventId);

  const collaboratorInsert = db.prepare(
    `
    INSERT INTO collaborators (
      id, event_id, display_name, role, wallet_address, split_percentage
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
  );
  collaboratorInsert.run(
    "col_demo_organizer",
    demoEventId,
    "Jakarta Stellar Guild",
    "Organizer",
    organizerWallet,
    70,
  );
  collaboratorInsert.run(
    "col_demo_speaker",
    demoEventId,
    "Soroban Mentor",
    "Speaker",
    speakerWallet,
    20,
  );
  collaboratorInsert.run(
    "col_demo_partner",
    demoEventId,
    "SEA Builders",
    "Community Partner",
    partnerWallet,
    10,
  );
  collaboratorInsert.run(
    "col_free_organizer",
    freeEventId,
    "Jakarta Stellar Guild",
    "Organizer",
    organizerWallet,
    100,
  );

  const resourceInsert = db.prepare(
    `
    INSERT INTO resources (id, event_id, title, description, type, url, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  );
  resourceInsert.run(
    "res_demo_deck",
    demoEventId,
    "Workshop Deck",
    "Slides unlocked after pass mint.",
    "link",
    "https://example.com/deck",
    1,
  );
  resourceInsert.run(
    "res_demo_repo",
    demoEventId,
    "Soroban Starter Repo",
    "Private repository for the mini workshop.",
    "link",
    "https://example.com/repo",
    2,
  );
  resourceInsert.run(
    "res_demo_notes",
    demoEventId,
    "Private Builder Notes",
    "Text notes available to pass holders.",
    "text",
    null,
    3,
  );
  resourceInsert.run(
    "res_free_recap",
    freeEventId,
    "Office Hours Recap",
    "Notes and links shared during the free builder session.",
    "text",
    null,
    1,
  );
});

seed();

const publishedCount = db
  .prepare("SELECT COUNT(*) as count FROM events WHERE status = 'published'")
  .get().count;

console.log(
  JSON.stringify(
    {
      seededEventId: demoEventId,
      seededFreeEventId: freeEventId,
      publishedCount,
    },
    null,
    2,
  ),
);

db.close();
