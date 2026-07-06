import type { EventRecord, EvidenceKind, EvidenceRecord } from "@/lib/db/models";
import { query, queryOne } from "@/lib/db/client";
import { stellarExpertTransactionUrl } from "@/lib/stellar/explorer";

type EvidenceRow = {
  id: string;
  kind: EvidenceKind;
  event_id: string | null;
  event_slug: string | null;
  event_title: string | null;
  actor_wallet: string | null;
  amount_usdc: string | null;
  asset: "USDC" | null;
  ledger: number | null;
  source_label: string;
  status: string;
  token_id: string | null;
  tx_hash: string | null;
  occurred_at: string;
};

type EventLookupRow = {
  id: string;
  slug: string;
  title: string;
  event_type: string;
  short_description: string;
  cover_image_url: string | null;
  start_date_time: string;
  end_date_time: string;
  timezone: string;
  location_type: EventRecord["locationType"];
  location_text: string | null;
  meeting_url: string | null;
  price_usdc: string;
  is_free: boolean;
  capacity: number;
  status: EventRecord["status"];
  organizer_wallet: string;
  metadata_hash: string | null;
  core_event_id: string | null;
  publish_tx_hash: string | null;
  created_at: string;
  updated_at: string;
};

export type EvidenceQuery = {
  eventId?: string | null;
  kind?: EvidenceKind | "all" | null;
  limit?: number;
};

function toEventRecord(row: EventLookupRow): EventRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    eventType: row.event_type,
    shortDescription: row.short_description,
    coverImageUrl: row.cover_image_url,
    startDateTime: row.start_date_time,
    endDateTime: row.end_date_time,
    timezone: row.timezone,
    locationType: row.location_type,
    locationText: row.location_text,
    meetingUrl: row.meeting_url,
    priceUsdc: row.price_usdc,
    isFree: row.is_free,
    capacity: row.capacity,
    status: row.status,
    organizerWallet: row.organizer_wallet,
    metadataHash: row.metadata_hash,
    coreEventId: row.core_event_id,
    publishTxHash: row.publish_tx_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toEvidenceRecord(row: EvidenceRow): EvidenceRecord {
  return {
    id: row.id,
    kind: row.kind,
    eventId: row.event_id,
    eventSlug: row.event_slug,
    eventTitle: row.event_title,
    actorWallet: row.actor_wallet,
    amountUsdc: row.amount_usdc,
    asset: row.asset,
    explorerUrl: stellarExpertTransactionUrl(row.tx_hash),
    ledger: row.ledger === null ? null : Number(row.ledger),
    sourceLabel: row.source_label,
    status: row.status,
    tokenId: row.token_id,
    txHash: row.tx_hash,
    occurredAt: row.occurred_at,
  };
}

export async function getEvidenceEvent(identifier: string) {
  const row = await queryOne<EventLookupRow>(
    "SELECT * FROM events WHERE id = $1 OR slug = $1 LIMIT 1",
    [identifier],
  );

  return row ? toEventRecord(row) : null;
}

export async function listEvidence({
  eventId = null,
  kind = "all",
  limit = 100,
}: EvidenceQuery = {}) {
  const boundedLimit = Math.max(1, Math.min(Math.trunc(limit), 250));
  const rows = await query<EvidenceRow>(
    `
    WITH proof_rows AS (
      SELECT
        'publish:' || e.id AS id,
        'publish'::text AS kind,
        e.id AS event_id,
        e.slug AS event_slug,
        e.title AS event_title,
        e.organizer_wallet AS actor_wallet,
        NULL::text AS amount_usdc,
        NULL::text AS asset,
        NULL::int AS ledger,
        'Event publish'::text AS source_label,
        e.status::text AS status,
        NULL::text AS token_id,
        e.publish_tx_hash AS tx_hash,
        e.updated_at AS occurred_at
      FROM events e
      WHERE e.publish_tx_hash IS NOT NULL

      UNION ALL

      SELECT
        'purchase:' || p.id AS id,
        CASE WHEN CAST(p.amount_usdc AS numeric) = 0
          THEN 'free_claim'
          ELSE 'paid_checkout'
        END::text AS kind,
        e.id AS event_id,
        e.slug AS event_slug,
        e.title AS event_title,
        p.buyer_wallet AS actor_wallet,
        p.amount_usdc AS amount_usdc,
        'USDC'::text AS asset,
        NULL::int AS ledger,
        CASE WHEN CAST(p.amount_usdc AS numeric) = 0
          THEN 'Free claim'
          ELSE 'Paid checkout'
        END::text AS source_label,
        p.status::text AS status,
        p.token_id AS token_id,
        p.tx_hash AS tx_hash,
        p.created_at AS occurred_at
      FROM purchases p
      JOIN events e ON e.id = p.event_id
      WHERE p.tx_hash IS NOT NULL

      UNION ALL

      SELECT
        'check_in:' || c.id AS id,
        'check_in'::text AS kind,
        e.id AS event_id,
        e.slug AS event_slug,
        e.title AS event_title,
        c.checked_in_by_wallet AS actor_wallet,
        NULL::text AS amount_usdc,
        NULL::text AS asset,
        NULL::int AS ledger,
        'Organizer check-in'::text AS source_label,
        'succeeded'::text AS status,
        c.token_id AS token_id,
        c.tx_hash AS tx_hash,
        c.created_at AS occurred_at
      FROM check_ins c
      JOIN events e ON e.id = c.event_id
      WHERE c.tx_hash IS NOT NULL

      UNION ALL

      SELECT
        'withdrawal:' || w.id AS id,
        'withdrawal'::text AS kind,
        e.id AS event_id,
        e.slug AS event_slug,
        e.title AS event_title,
        w.collaborator_wallet AS actor_wallet,
        w.amount_usdc AS amount_usdc,
        'USDC'::text AS asset,
        NULL::int AS ledger,
        'Collaborator withdrawal'::text AS source_label,
        'succeeded'::text AS status,
        NULL::text AS token_id,
        w.tx_hash AS tx_hash,
        w.created_at AS occurred_at
      FROM withdrawals w
      JOIN events e ON e.id = w.event_id

      UNION ALL

      SELECT
        'anchor_payout:' || a.id AS id,
        'anchor_payout'::text AS kind,
        e.id AS event_id,
        e.slug AS event_slug,
        e.title AS event_title,
        a.collaborator_wallet AS actor_wallet,
        a.amount_usdc AS amount_usdc,
        'USDC'::text AS asset,
        NULL::int AS ledger,
        CASE WHEN a.provider = 'moneygram'
          THEN 'MoneyGram anchor payout'
          ELSE 'Mock anchor payout'
        END::text AS source_label,
        a.status::text AS status,
        NULL::text AS token_id,
        w.tx_hash AS tx_hash,
        a.updated_at AS occurred_at
      FROM anchor_payouts a
      JOIN events e ON e.id = a.event_id
      LEFT JOIN withdrawals w ON w.id = a.withdrawal_id

      UNION ALL

      SELECT
        'indexed:' || s.event_key AS id,
        'indexed_event'::text AS kind,
        e.id AS event_id,
        e.slug AS event_slug,
        e.title AS event_title,
        NULL::text AS actor_wallet,
        NULL::text AS amount_usdc,
        NULL::text AS asset,
        s.ledger AS ledger,
        COALESCE(s.topic_key, 'Indexed contract event')::text AS source_label,
        CASE WHEN s.successful THEN 'indexed' ELSE 'failed' END::text AS status,
        NULL::text AS token_id,
        s.tx_hash AS tx_hash,
        s.observed_at AS occurred_at
      FROM stellar_events s
      LEFT JOIN events e ON e.id = s.app_event_id
      WHERE s.tx_hash IS NULL
        OR NOT EXISTS (
          SELECT 1 FROM live_proof_hashes l WHERE l.tx_hash = s.tx_hash
        )
    )
    SELECT *
    FROM proof_rows
    WHERE ($1::text IS NULL OR event_id = $1)
      AND ($2::text = 'all' OR kind = $2)
    ORDER BY occurred_at DESC, id DESC
    LIMIT $3
    `,
    [eventId, kind ?? "all", boundedLimit],
  );

  return rows.map(toEvidenceRecord);
}
