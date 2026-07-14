import { withClient, withTransaction } from "./postgres-utils.mjs";
import { createFutureEventWindow } from "./demo-event-schedule.mjs";

const demoEventId = "evt_apac_stellar_builder_meetup";
const freeEventId = "evt_stellar_open_office_hours";
const organizerWallet = "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const speakerWallet = "GC33PRL24QY6EUIHOJT6ITM34QHBJOIFXO4UBL3AS2RECIDIPFAF6YDH";
const partnerWallet = "GBUSN4MX7AE3RKAR4DEJEELBAQ4CZ3Q6PZ4QEU7RW3SQ7OX6ZFSIDGER";
const builderMeetupSchedule = createFutureEventWindow({
  durationHours: 3,
  offsetDays: 7,
});
const officeHoursSchedule = createFutureEventWindow({
  durationHours: 1.5,
  offsetDays: 14,
  startHourUtc: 9,
});

await withClient(async (client) => {
  await withTransaction(client, async () => {
    const users = [
      ["usr_demo_organizer", organizerWallet],
      ["usr_demo_speaker", speakerWallet],
      ["usr_demo_partner", partnerWallet],
    ];

    for (const [id, wallet] of users) {
      await client.query(
        `
        INSERT INTO users (id, wallet_address)
        VALUES ($1, $2)
        ON CONFLICT (wallet_address) DO NOTHING
        `,
        [id, wallet],
      );
    }

    const events = [
      [
        demoEventId,
        "apac-stellar-builder-meetup",
        "APAC Stellar Builder Meetup",
        "Paid Web3 Meetup + Mini Workshop",
        "A builder meetup with USDC split escrow, non-transferable NFT passes, gated resources, and check-in proof.",
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1600&q=80",
        builderMeetupSchedule.startDateTime,
        builderMeetupSchedule.endDateTime,
        "Asia/Jakarta",
        "hybrid",
        "Jakarta + livestream",
        "https://example.com/livestream",
        "5",
        false,
        80,
        "published",
        organizerWallet,
        "sha256:demo-metadata-hash",
        "testnet:demo-publish-stub",
      ],
      [
        freeEventId,
        "stellar-open-office-hours",
        "Stellar Open Office Hours",
        "Free Web3 Builder Session",
        "A free community session for builders to discuss Stellar payments, Soroban contracts, and event access ideas.",
        "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80",
        officeHoursSchedule.startDateTime,
        officeHoursSchedule.endDateTime,
        "Asia/Jakarta",
        "virtual",
        "Livestream",
        "https://example.com/office-hours",
        "0",
        true,
        50,
        "published",
        organizerWallet,
        "sha256:free-demo-metadata-hash",
        "testnet:free-demo-publish-stub",
      ],
    ];

    for (const event of events) {
      await client.query(
        `
        INSERT INTO events (
          id, slug, title, event_type, short_description, cover_image_url,
          start_date_time, end_date_time, timezone, location_type, location_text,
          meeting_url, price_usdc, is_free, capacity, status, organizer_wallet,
          metadata_hash, publish_tx_hash
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
        ON CONFLICT (id) DO UPDATE SET
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
        event,
      );
    }

    for (const eventId of [demoEventId, freeEventId]) {
      await client.query("DELETE FROM collaborators WHERE event_id = $1", [eventId]);
      await client.query("DELETE FROM resources WHERE event_id = $1", [eventId]);
    }

    const collaborators = [
      ["col_demo_organizer", demoEventId, "Jakarta Stellar Guild", "Organizer", organizerWallet, 70],
      ["col_demo_speaker", demoEventId, "Soroban Mentor", "Speaker", speakerWallet, 20],
      ["col_demo_partner", demoEventId, "SEA Builders", "Community Partner", partnerWallet, 10],
      ["col_free_organizer", freeEventId, "Jakarta Stellar Guild", "Organizer", organizerWallet, 100],
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

    const resources = [
      [
        "res_demo_deck",
        demoEventId,
        "Workshop Deck",
        "Slides unlocked after pass mint.",
        "link",
        "https://example.com/deck",
        1,
      ],
      [
        "res_demo_repo",
        demoEventId,
        "Soroban Starter Repo",
        "Private repository for the mini workshop.",
        "link",
        "https://example.com/repo",
        2,
      ],
      [
        "res_demo_notes",
        demoEventId,
        "Private Builder Notes",
        "Text notes available to pass holders.",
        "text",
        null,
        3,
      ],
      [
        "res_free_recap",
        freeEventId,
        "Office Hours Recap",
        "Notes and links shared during the free builder session.",
        "text",
        null,
        1,
      ],
    ];

    for (const resource of resources) {
      await client.query(
        `
        INSERT INTO resources (id, event_id, title, description, type, url, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        resource,
      );
    }
  });

  const publishedCount = Number(
    (
      await client.query(
        "SELECT COUNT(*)::int AS count FROM events WHERE status = 'published'",
      )
    ).rows[0].count,
  );

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
});
