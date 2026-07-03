import { StrKey } from "@stellar/stellar-sdk";
import { createHash } from "node:crypto";
import { createId } from "@/lib/db/ids";
import {
  execute,
  query,
  queryOne,
  withTransaction,
  type DatabaseClient,
} from "@/lib/db/client";
import type {
  CheckInRecord,
  CollaboratorRecord,
  EventRecord,
  LocationType,
  PassRecord,
  PassSource,
  PurchaseRecord,
  ResourceRecord,
  ResourceType,
  UserRecord,
  WithdrawalRecord,
} from "@/lib/db/models";

type UserRow = {
  id: string;
  wallet_address: string;
  created_at: string;
  last_seen_at: string;
};

type EventRow = {
  id: string;
  slug: string;
  title: string;
  event_type: string;
  short_description: string;
  cover_image_url: string | null;
  start_date_time: string;
  end_date_time: string;
  timezone: string;
  location_type: LocationType;
  location_text: string | null;
  meeting_url: string | null;
  price_usdc: string;
  is_free: boolean;
  capacity: number;
  status: "draft" | "published";
  organizer_wallet: string;
  metadata_hash: string | null;
  core_event_id: string | null;
  publish_tx_hash: string | null;
  created_at: string;
  updated_at: string;
};

type CollaboratorRow = {
  id: string;
  event_id: string;
  display_name: string;
  role: string;
  wallet_address: string;
  split_percentage: number;
  created_at: string;
};

type ResourceRow = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string | null;
  sort_order: number;
  created_at: string;
};

type PassRow = {
  id: string;
  event_id: string;
  owner_wallet: string;
  token_id: string | null;
  metadata_uri: string | null;
  metadata_hash: string | null;
  mint_tx_hash: string | null;
  source: PassSource;
  checked_in: boolean;
  created_at: string;
};

type PurchaseRow = {
  id: string;
  event_id: string;
  buyer_wallet: string;
  amount_usdc: string;
  token_id: string | null;
  tx_hash: string | null;
  status: "pending" | "succeeded" | "failed";
  created_at: string;
};

type CheckInRow = {
  id: string;
  event_id: string;
  token_id: string;
  owner_wallet: string;
  checked_in_by_wallet: string;
  tx_hash: string | null;
  created_at: string;
};

type WithdrawalRow = {
  id: string;
  event_id: string;
  collaborator_wallet: string;
  amount_usdc: string;
  tx_hash: string;
  created_at: string;
};

export type CreateDraftEventInput = {
  slug: string;
  title: string;
  eventType: string;
  shortDescription: string;
  coverImageUrl?: string | null;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  locationType: LocationType;
  locationText?: string | null;
  meetingUrl?: string | null;
  priceUsdc: string;
  isFree: boolean;
  capacity: number;
  organizerWallet: string;
};

export type UpsertCollaboratorInput = {
  displayName: string;
  role: string;
  walletAddress: string;
  splitPercentage: number;
};

export type CreateResourceInput = {
  title: string;
  description?: string | null;
  type: ResourceType;
  url?: string | null;
  sortOrder: number;
};

export type EventDashboardMetrics = {
  checkedInCount: number;
  capacityRemaining: number;
  passCount: number;
  revenueUsdc: number;
};

export type CollaboratorEventRecord = {
  collaborator: CollaboratorRecord;
  event: EventRecord;
  earnedUsdc: number;
  withdrawnUsdc: number;
};

export type RecordLivePublishInput = {
  coreEventId: string;
  eventId: string;
  metadataHash: string;
  organizerWallet: string;
  publishTxHash: string;
};

export type RecordLivePassInput = {
  eventId: string;
  metadataHash: string;
  metadataUri: string;
  ownerWallet: string;
  tokenId: string;
  txHash: string;
};

export type RecordLiveCheckInInput = {
  checkedInByWallet: string;
  eventId: string;
  tokenId: string;
  txHash: string;
};

export type RecordLiveWithdrawalInput = {
  amountUsdc: string;
  collaboratorWallet: string;
  eventId: string;
  txHash: string;
};

function assertWalletAddress(walletAddress: string) {
  if (!StrKey.isValidEd25519PublicKey(walletAddress)) {
    throw new Error(`Invalid Stellar wallet address: ${walletAddress}`);
  }
}

function assertLiveTransactionHash(txHash: string) {
  if (!/^[a-f0-9]{64}$/i.test(txHash)) {
    throw new Error("Live transaction hash must be a 64-character hex string.");
  }
}

async function assertLiveProofHashUnused(txHash: string, db?: DatabaseClient) {
  const normalizedTxHash = txHash.toLowerCase();
  const existing = await queryOne<{ tx_hash: string }>(
    `
    SELECT tx_hash FROM live_proof_hashes WHERE tx_hash = $1
    UNION ALL SELECT publish_tx_hash FROM events WHERE publish_tx_hash = $1
    UNION ALL SELECT mint_tx_hash FROM passes WHERE mint_tx_hash = $1
    UNION ALL SELECT tx_hash FROM purchases WHERE tx_hash = $1
    UNION ALL SELECT tx_hash FROM check_ins WHERE tx_hash = $1
    UNION ALL SELECT tx_hash FROM withdrawals WHERE tx_hash = $1
    LIMIT 1
    `,
    [normalizedTxHash],
    db,
  );

  if (existing) {
    throw new Error("Live transaction hash is already recorded.");
  }
}

async function reserveLiveProofHash({
  db,
  sourceId,
  sourceTable,
  txHash,
}: {
  db: DatabaseClient;
  sourceId: string;
  sourceTable: "events" | "passes" | "check_ins" | "withdrawals";
  txHash: string;
}) {
  await execute(
    `
    INSERT INTO live_proof_hashes (tx_hash, source_table, source_id)
    VALUES ($1, $2, $3)
    `,
    [txHash.toLowerCase(), sourceTable, sourceId],
    db,
  );
}

function assertContractEventId(coreEventId: string) {
  if (!/^[a-f0-9]{64}$/i.test(coreEventId)) {
    throw new Error("Core event ID must be a 32-byte hex string.");
  }
}

function normalizeHashForStorage(value: string, label: string) {
  const normalized = value.trim().replace(/^sha256:/i, "");

  if (!/^[a-f0-9]{64}$/i.test(normalized)) {
    throw new Error(`${label} must be a 32-byte hex string.`);
  }

  return `sha256:${normalized.toLowerCase()}`;
}

function assertTokenId(tokenId: string) {
  if (!/^\d+$/.test(tokenId)) {
    throw new Error("Live token ID must be a non-negative integer string.");
  }
}

function assertUsdcAmount(amountUsdc: string) {
  if (!/^\d+(\.\d{1,7})?$/.test(amountUsdc) || Number(amountUsdc) <= 0) {
    throw new Error("USDC amount must be a positive decimal with up to 7 decimals.");
  }
}

function formatUsdcAmount(value: number) {
  return value.toFixed(7).replace(/\.?0+$/, "") || "0";
}

function toTimestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    createdAt: toTimestamp(row.created_at),
    lastSeenAt: toTimestamp(row.last_seen_at),
  };
}

function toEventRecord(row: EventRow): EventRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    eventType: row.event_type,
    shortDescription: row.short_description,
    coverImageUrl: row.cover_image_url,
    startDateTime: toTimestamp(row.start_date_time),
    endDateTime: toTimestamp(row.end_date_time),
    timezone: row.timezone,
    locationType: row.location_type,
    locationText: row.location_text,
    meetingUrl: row.meeting_url,
    priceUsdc: row.price_usdc,
    isFree: row.is_free,
    capacity: Number(row.capacity),
    status: row.status,
    organizerWallet: row.organizer_wallet,
    metadataHash: row.metadata_hash,
    coreEventId: row.core_event_id,
    publishTxHash: row.publish_tx_hash,
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  };
}

function toCollaboratorRecord(row: CollaboratorRow): CollaboratorRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    displayName: row.display_name,
    role: row.role,
    walletAddress: row.wallet_address,
    splitPercentage: Number(row.split_percentage),
    createdAt: toTimestamp(row.created_at),
  };
}

function toResourceRecord(row: ResourceRow): ResourceRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    description: row.description,
    type: row.type,
    url: row.url,
    sortOrder: Number(row.sort_order),
    createdAt: toTimestamp(row.created_at),
  };
}

function toPassRecord(row: PassRow): PassRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    ownerWallet: row.owner_wallet,
    tokenId: row.token_id,
    metadataUri: row.metadata_uri,
    metadataHash: row.metadata_hash,
    mintTxHash: row.mint_tx_hash,
    source: row.source,
    checkedIn: row.checked_in,
    createdAt: toTimestamp(row.created_at),
  };
}

function toPurchaseRecord(row: PurchaseRow): PurchaseRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    buyerWallet: row.buyer_wallet,
    amountUsdc: row.amount_usdc,
    tokenId: row.token_id,
    txHash: row.tx_hash,
    status: row.status,
    createdAt: toTimestamp(row.created_at),
  };
}

function toCheckInRecord(row: CheckInRow): CheckInRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    tokenId: row.token_id,
    ownerWallet: row.owner_wallet,
    checkedInByWallet: row.checked_in_by_wallet,
    txHash: row.tx_hash,
    createdAt: toTimestamp(row.created_at),
  };
}

function toWithdrawalRecord(row: WithdrawalRow): WithdrawalRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    collaboratorWallet: row.collaborator_wallet,
    amountUsdc: row.amount_usdc,
    txHash: row.tx_hash,
    createdAt: toTimestamp(row.created_at),
  };
}

async function getEventByIdFromDb(id: string, db?: DatabaseClient, lock = false) {
  const row = await queryOne<EventRow>(
    `SELECT * FROM events WHERE id = $1${lock ? " FOR UPDATE" : ""}`,
    [id],
    db,
  );

  if (!row) {
    throw new Error(`Event not found: ${id}`);
  }

  return row;
}

async function listCollaboratorsFromDb(eventId: string, db?: DatabaseClient) {
  return (
    await query<CollaboratorRow>(
      "SELECT * FROM collaborators WHERE event_id = $1 ORDER BY created_at ASC",
      [eventId],
      db,
    )
  ).map(toCollaboratorRecord);
}

async function listResourcesFromDb(eventId: string, db?: DatabaseClient) {
  return (
    await query<ResourceRow>(
      `
      SELECT * FROM resources
      WHERE event_id = $1
      ORDER BY sort_order ASC, created_at ASC
      `,
      [eventId],
      db,
    )
  ).map(toResourceRecord);
}

async function getCollaboratorSplitTotalFromDb(eventId: string, db?: DatabaseClient) {
  const row = await queryOne<{ total: number }>(
    `
    SELECT COALESCE(SUM(split_percentage), 0)::float8 AS total
    FROM collaborators
    WHERE event_id = $1
    `,
    [eventId],
    db,
  );

  return Number(row?.total ?? 0);
}

async function countPassesForEventFromDb(eventId: string, db?: DatabaseClient) {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM passes WHERE event_id = $1",
    [eventId],
    db,
  );

  return Number(row?.count ?? 0);
}

async function getEventRevenueUsdcFromDb(eventId: string, db?: DatabaseClient) {
  const row = await queryOne<{ total: number }>(
    `
    SELECT COALESCE(SUM(CAST(amount_usdc AS double precision)), 0)::float8 AS total
    FROM purchases
    WHERE event_id = $1 AND status = 'succeeded'
    `,
    [eventId],
    db,
  );

  return Number(row?.total ?? 0);
}

async function getWithdrawnTotalUsdcFromDb(
  eventId: string,
  walletAddress: string,
  db?: DatabaseClient,
) {
  assertWalletAddress(walletAddress);

  const row = await queryOne<{ total: number }>(
    `
    SELECT COALESCE(SUM(CAST(amount_usdc AS double precision)), 0)::float8 AS total
    FROM withdrawals
    WHERE event_id = $1 AND collaborator_wallet = $2
    `,
    [eventId, walletAddress],
    db,
  );

  return Number(row?.total ?? 0);
}

async function createDraftEventWithDb(
  input: CreateDraftEventInput,
  db: DatabaseClient,
) {
  assertWalletAddress(input.organizerWallet);

  const id = createId("evt");
  const row = await queryOne<EventRow>(
    `
    INSERT INTO events (
      id, slug, title, event_type, short_description, cover_image_url,
      start_date_time, end_date_time, timezone, location_type, location_text,
      meeting_url, price_usdc, is_free, capacity, organizer_wallet
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14, $15, $16
    )
    RETURNING *
    `,
    [
      id,
      input.slug,
      input.title,
      input.eventType,
      input.shortDescription,
      input.coverImageUrl ?? null,
      input.startDateTime,
      input.endDateTime,
      input.timezone,
      input.locationType,
      input.locationText ?? null,
      input.meetingUrl ?? null,
      input.isFree ? "0" : input.priceUsdc,
      input.isFree,
      input.capacity,
      input.organizerWallet,
    ],
    db,
  );

  return toEventRecord(row as EventRow);
}

async function addCollaboratorWithDb(
  eventId: string,
  input: UpsertCollaboratorInput,
  db: DatabaseClient,
) {
  assertWalletAddress(input.walletAddress);

  const id = createId("col");
  const row = await queryOne<CollaboratorRow>(
    `
    INSERT INTO collaborators (
      id, event_id, display_name, role, wallet_address, split_percentage
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      id,
      eventId,
      input.displayName,
      input.role,
      input.walletAddress,
      input.splitPercentage,
    ],
    db,
  );

  return toCollaboratorRecord(row as CollaboratorRow);
}

async function addResourceWithDb(
  eventId: string,
  input: CreateResourceInput,
  db: DatabaseClient,
) {
  const id = createId("res");
  const row = await queryOne<ResourceRow>(
    `
    INSERT INTO resources (id, event_id, title, description, type, url, sort_order)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
    `,
    [
      id,
      eventId,
      input.title,
      input.description ?? null,
      input.type,
      input.url ?? null,
      input.sortOrder,
    ],
    db,
  );

  return toResourceRecord(row as ResourceRow);
}

export async function upsertUser(walletAddress: string) {
  assertWalletAddress(walletAddress);

  const row = await queryOne<UserRow>(
    `
    INSERT INTO users (id, wallet_address)
    VALUES ($1, $2)
    ON CONFLICT (wallet_address) DO UPDATE
      SET last_seen_at = now()
    RETURNING *
    `,
    [createId("usr"), walletAddress],
  );

  return toUserRecord(row as UserRow);
}

export async function createDraftEvent(input: CreateDraftEventInput) {
  return withTransaction((db) => createDraftEventWithDb(input, db));
}

export async function createDraftEventWithSetup(
  input: CreateDraftEventInput,
  collaborators: UpsertCollaboratorInput[],
  resources: CreateResourceInput[],
) {
  return withTransaction(async (db) => {
    const event = await createDraftEventWithDb(input, db);

    for (const collaborator of collaborators) {
      await addCollaboratorWithDb(event.id, collaborator, db);
    }

    for (const resource of resources) {
      await addResourceWithDb(event.id, resource, db);
    }

    return {
      event,
      collaborators: await listCollaboratorsFromDb(event.id, db),
      resources: await listResourcesFromDb(event.id, db),
    };
  });
}

export async function updateDraftEventWithSetup({
  eventId,
  organizerWallet,
  input,
  collaborators,
  resources,
}: {
  eventId: string;
  organizerWallet: string;
  input: Omit<CreateDraftEventInput, "slug" | "organizerWallet">;
  collaborators: UpsertCollaboratorInput[];
  resources: CreateResourceInput[];
}) {
  assertWalletAddress(organizerWallet);

  return withTransaction(async (db) => {
    const existing = await queryOne<EventRow>(
      `
      SELECT * FROM events
      WHERE id = $1 AND organizer_wallet = $2
      FOR UPDATE
      `,
      [eventId, organizerWallet],
      db,
    );

    if (!existing) {
      throw new Error("Draft event not found for connected organizer.");
    }

    if (existing.status !== "draft") {
      throw new Error("Published events cannot be edited in the MVP.");
    }

    await execute(
      `
      UPDATE events
      SET
        title = $1,
        event_type = $2,
        short_description = $3,
        cover_image_url = $4,
        start_date_time = $5,
        end_date_time = $6,
        timezone = $7,
        location_type = $8,
        location_text = $9,
        meeting_url = $10,
        price_usdc = $11,
        is_free = $12,
        capacity = $13
      WHERE id = $14
      `,
      [
        input.title,
        input.eventType,
        input.shortDescription,
        input.coverImageUrl ?? null,
        input.startDateTime,
        input.endDateTime,
        input.timezone,
        input.locationType,
        input.locationText ?? null,
        input.meetingUrl ?? null,
        input.isFree ? "0" : input.priceUsdc,
        input.isFree,
        input.capacity,
        eventId,
      ],
      db,
    );

    await execute("DELETE FROM collaborators WHERE event_id = $1", [eventId], db);
    await execute("DELETE FROM resources WHERE event_id = $1", [eventId], db);

    for (const collaborator of collaborators) {
      await addCollaboratorWithDb(eventId, collaborator, db);
    }

    for (const resource of resources) {
      await addResourceWithDb(eventId, resource, db);
    }

    return {
      event: toEventRecord(await getEventByIdFromDb(eventId, db)),
      collaborators: await listCollaboratorsFromDb(eventId, db),
      resources: await listResourcesFromDb(eventId, db),
    };
  });
}

export async function publishDraftEventStub(eventId: string, organizerWallet: string) {
  assertWalletAddress(organizerWallet);

  return withTransaction(async (db) => {
    const event = await queryOne<EventRow>(
      `
      SELECT * FROM events
      WHERE id = $1 AND organizer_wallet = $2
      FOR UPDATE
      `,
      [eventId, organizerWallet],
      db,
    );

    if (!event) {
      throw new Error("Draft event not found for connected organizer.");
    }

    if (event.status !== "draft") {
      throw new Error("Only draft events can be published.");
    }

    const splitTotal = await getCollaboratorSplitTotalFromDb(eventId, db);
    const resourceCount = (await listResourcesFromDb(eventId, db)).length;

    if (Math.abs(splitTotal - 100) > 0.001) {
      throw new Error("Collaborator split total must equal 100% before publish.");
    }

    if (resourceCount < 1) {
      throw new Error("Add at least one gated resource before publish.");
    }

    const metadataHash = createHash("sha256")
      .update(`${eventId}:${event.updated_at}:${splitTotal}:${resourceCount}`)
      .digest("hex");
    const publishTxHash = `stub:publish:${Date.now()}`;

    await execute(
      `
      UPDATE events
      SET status = 'published', metadata_hash = $1, publish_tx_hash = $2
      WHERE id = $3
      `,
      [`sha256:${metadataHash}`, publishTxHash, eventId],
      db,
    );

    return {
      event: toEventRecord(await getEventByIdFromDb(eventId, db)),
      collaborators: await listCollaboratorsFromDb(eventId, db),
      resources: await listResourcesFromDb(eventId, db),
    };
  });
}

export async function recordLivePublishedEvent(input: RecordLivePublishInput) {
  assertWalletAddress(input.organizerWallet);
  assertContractEventId(input.coreEventId);
  assertLiveTransactionHash(input.publishTxHash);

  return withTransaction(async (db) => {
    await assertLiveProofHashUnused(input.publishTxHash, db);

    const event = await queryOne<EventRow>(
      `
      SELECT * FROM events
      WHERE id = $1 AND organizer_wallet = $2
      FOR UPDATE
      `,
      [input.eventId, input.organizerWallet],
      db,
    );

    if (!event) {
      throw new Error("Draft event not found for connected organizer.");
    }

    if (event.status !== "draft") {
      throw new Error("Only draft events can be recorded as live published.");
    }

    const splitTotal = await getCollaboratorSplitTotalFromDb(input.eventId, db);
    const resourceCount = (await listResourcesFromDb(input.eventId, db)).length;

    if (Math.abs(splitTotal - 100) > 0.001) {
      throw new Error("Collaborator split total must equal 100% before publish.");
    }

    if (resourceCount < 1) {
      throw new Error("Add at least one gated resource before publish.");
    }

    await execute(
      `
      UPDATE events
      SET status = 'published',
          metadata_hash = $1,
          core_event_id = $2,
          publish_tx_hash = $3
      WHERE id = $4
      `,
      [
        normalizeHashForStorage(input.metadataHash, "Event metadata hash"),
        input.coreEventId.toLowerCase(),
        input.publishTxHash.toLowerCase(),
        input.eventId,
      ],
      db,
    );
    await reserveLiveProofHash({
      db,
      sourceId: input.eventId,
      sourceTable: "events",
      txHash: input.publishTxHash,
    });

    return {
      event: toEventRecord(await getEventByIdFromDb(input.eventId, db)),
      collaborators: await listCollaboratorsFromDb(input.eventId, db),
      resources: await listResourcesFromDb(input.eventId, db),
    };
  });
}

export async function getEventById(id: string) {
  return toEventRecord(await getEventByIdFromDb(id));
}

export async function getEventBySlug(slug: string) {
  const row = await queryOne<EventRow>(
    "SELECT * FROM events WHERE slug = $1",
    [slug],
  );

  return row ? toEventRecord(row) : null;
}

export async function listPublishedEvents() {
  return (
    await query<EventRow>(
      "SELECT * FROM events WHERE status = 'published' ORDER BY start_date_time ASC",
    )
  ).map(toEventRecord);
}

export async function listOrganizerEvents(organizerWallet: string) {
  assertWalletAddress(organizerWallet);

  return (
    await query<EventRow>(
      `
      SELECT * FROM events
      WHERE organizer_wallet = $1
      ORDER BY created_at DESC
      `,
      [organizerWallet],
    )
  ).map(toEventRecord);
}

export async function listCollaborationsByWallet(walletAddress: string) {
  assertWalletAddress(walletAddress);

  const rows = await query<CollaboratorRow>(
    `
    SELECT c.*
    FROM collaborators c
    JOIN events e ON e.id = c.event_id
    WHERE c.wallet_address = $1
    ORDER BY e.created_at DESC, c.created_at DESC
    `,
    [walletAddress],
  );
  const collaborations: CollaboratorEventRecord[] = [];

  for (const row of rows) {
    const collaborator = toCollaboratorRecord(row);
    const event = await getEventById(collaborator.eventId);
    const revenueUsdc = await getEventRevenueUsdc(event.id);
    const withdrawnUsdc = await getWithdrawnTotalUsdc(event.id, walletAddress);

    collaborations.push({
      collaborator,
      event,
      earnedUsdc: (revenueUsdc * collaborator.splitPercentage) / 100,
      withdrawnUsdc,
    });
  }

  return collaborations;
}

export async function addCollaborator(
  eventId: string,
  input: UpsertCollaboratorInput,
) {
  return withTransaction((db) => addCollaboratorWithDb(eventId, input, db));
}

export async function listCollaborators(eventId: string) {
  return listCollaboratorsFromDb(eventId);
}

export async function getCollaboratorSplitTotal(eventId: string) {
  return getCollaboratorSplitTotalFromDb(eventId);
}

export async function addResource(eventId: string, input: CreateResourceInput) {
  return withTransaction((db) => addResourceWithDb(eventId, input, db));
}

export async function listResources(eventId: string) {
  return listResourcesFromDb(eventId);
}

export async function countPassesForEvent(eventId: string) {
  return countPassesForEventFromDb(eventId);
}

export async function countCheckedInPassesForEvent(eventId: string) {
  const row = await queryOne<{ count: number }>(
    `
    SELECT COUNT(*)::int AS count
    FROM passes
    WHERE event_id = $1 AND checked_in = true
    `,
    [eventId],
  );

  return Number(row?.count ?? 0);
}

export async function countMintedPasses() {
  const row = await queryOne<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM passes",
  );

  return Number(row?.count ?? 0);
}

export async function getSucceededPurchaseTotalUsdc() {
  const row = await queryOne<{ total: number }>(
    `
    SELECT COALESCE(SUM(CAST(amount_usdc AS double precision)), 0)::float8 AS total
    FROM purchases
    WHERE status = 'succeeded'
    `,
  );

  return Number(row?.total ?? 0);
}

export async function getEventRevenueUsdc(eventId: string) {
  return getEventRevenueUsdcFromDb(eventId);
}

export async function getWithdrawnTotalUsdc(
  eventId: string,
  walletAddress: string,
) {
  return getWithdrawnTotalUsdcFromDb(eventId, walletAddress);
}

export async function listWithdrawalsByWallet(walletAddress: string) {
  assertWalletAddress(walletAddress);

  return (
    await query<WithdrawalRow>(
      `
      SELECT * FROM withdrawals
      WHERE collaborator_wallet = $1
      ORDER BY created_at DESC
      `,
      [walletAddress],
    )
  ).map(toWithdrawalRecord);
}

export async function createLocalWithdrawalProof(
  eventId: string,
  collaboratorWallet: string,
) {
  assertWalletAddress(collaboratorWallet);

  return withTransaction(async (db) => {
    const eventRow = await getEventByIdFromDb(eventId, db, true);
    const event = toEventRecord(eventRow);

    if (event.status !== "published") {
      throw new Error("Only published events can be withdrawn from.");
    }

    const collaboratorRow = await queryOne<CollaboratorRow>(
      `
      SELECT * FROM collaborators
      WHERE event_id = $1 AND wallet_address = $2
      `,
      [eventId, collaboratorWallet],
      db,
    );

    if (!collaboratorRow) {
      throw new Error("Connected wallet is not a collaborator for this event.");
    }

    const collaborator = toCollaboratorRecord(collaboratorRow);
    const revenueUsdc = await getEventRevenueUsdcFromDb(event.id, db);
    const withdrawnUsdc = await getWithdrawnTotalUsdcFromDb(
      event.id,
      collaboratorWallet,
      db,
    );
    const earnedUsdc = (revenueUsdc * collaborator.splitPercentage) / 100;
    const availableUsdc = Math.max(earnedUsdc - withdrawnUsdc, 0);

    if (availableUsdc <= 0.0000001) {
      throw new Error("No withdrawable balance is available.");
    }

    const withdrawalId = createId("wdr");
    const txHash = `stub:withdraw:${event.id}:${withdrawalId}`;
    const amountUsdc = formatUsdcAmount(availableUsdc);
    const withdrawal = await queryOne<WithdrawalRow>(
      `
      INSERT INTO withdrawals (
        id, event_id, collaborator_wallet, amount_usdc, tx_hash
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [withdrawalId, event.id, collaboratorWallet, amountUsdc, txHash],
      db,
    );

    return {
      collaborator,
      event,
      withdrawal: toWithdrawalRecord(withdrawal as WithdrawalRow),
    };
  });
}

export async function recordLiveWithdrawal(input: RecordLiveWithdrawalInput) {
  assertWalletAddress(input.collaboratorWallet);
  assertLiveTransactionHash(input.txHash);
  assertUsdcAmount(input.amountUsdc);

  return withTransaction(async (db) => {
    await assertLiveProofHashUnused(input.txHash, db);

    const eventRow = await getEventByIdFromDb(input.eventId, db, true);
    const event = toEventRecord(eventRow);

    if (event.status !== "published") {
      throw new Error("Only published events can be withdrawn from.");
    }

    const collaboratorRow = await queryOne<CollaboratorRow>(
      `
      SELECT * FROM collaborators
      WHERE event_id = $1 AND wallet_address = $2
      `,
      [input.eventId, input.collaboratorWallet],
      db,
    );

    if (!collaboratorRow) {
      throw new Error("Connected wallet is not a collaborator for this event.");
    }

    const collaborator = toCollaboratorRecord(collaboratorRow);
    const revenueUsdc = await getEventRevenueUsdcFromDb(event.id, db);
    const withdrawnUsdc = await getWithdrawnTotalUsdcFromDb(
      event.id,
      input.collaboratorWallet,
      db,
    );
    const earnedUsdc = (revenueUsdc * collaborator.splitPercentage) / 100;
    const availableUsdc = Math.max(earnedUsdc - withdrawnUsdc, 0);
    const requestedUsdc = Number(input.amountUsdc);

    if (requestedUsdc - availableUsdc > 0.000000001) {
      throw new Error("Live withdrawal amount exceeds withdrawable balance.");
    }

    const withdrawalId = createId("wdr");
    const withdrawal = await queryOne<WithdrawalRow>(
      `
      INSERT INTO withdrawals (
        id, event_id, collaborator_wallet, amount_usdc, tx_hash
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        withdrawalId,
        event.id,
        input.collaboratorWallet,
        input.amountUsdc,
        input.txHash.toLowerCase(),
      ],
      db,
    );
    await reserveLiveProofHash({
      db,
      sourceId: withdrawalId,
      sourceTable: "withdrawals",
      txHash: input.txHash,
    });

    return {
      collaborator,
      event,
      withdrawal: toWithdrawalRecord(withdrawal as WithdrawalRow),
    };
  });
}

export async function getEventDashboardMetrics(eventId: string) {
  const event = await getEventById(eventId);
  const passCount = await countPassesForEvent(event.id);
  const checkedInCount = await countCheckedInPassesForEvent(event.id);
  const revenueUsdc = await getEventRevenueUsdc(event.id);

  return {
    checkedInCount,
    capacityRemaining: Math.max(event.capacity - passCount, 0),
    passCount,
    revenueUsdc,
  };
}

export async function getPassByEventAndOwner(
  eventId: string,
  ownerWallet: string,
) {
  assertWalletAddress(ownerWallet);

  const row = await queryOne<PassRow>(
    "SELECT * FROM passes WHERE event_id = $1 AND owner_wallet = $2",
    [eventId, ownerWallet],
  );

  return row ? toPassRecord(row) : null;
}

export async function listPassesByOwner(ownerWallet: string) {
  assertWalletAddress(ownerWallet);

  return (
    await query<PassRow>(
      `
      SELECT * FROM passes
      WHERE owner_wallet = $1
      ORDER BY created_at DESC
      `,
      [ownerWallet],
    )
  ).map(toPassRecord);
}

export async function getPassByTokenId(tokenId: string) {
  const passRow = await queryOne<PassRow>(
    "SELECT * FROM passes WHERE token_id = $1",
    [tokenId],
  );

  if (!passRow) {
    return null;
  }

  const purchaseRow = await queryOne<PurchaseRow>(
    `
    SELECT * FROM purchases
    WHERE token_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [tokenId],
  );

  return {
    event: await getEventById(passRow.event_id),
    pass: toPassRecord(passRow),
    purchase: purchaseRow ? toPurchaseRecord(purchaseRow) : null,
  };
}

export async function listCheckInsForEvent(eventId: string) {
  return (
    await query<CheckInRow>(
      `
      SELECT * FROM check_ins
      WHERE event_id = $1
      ORDER BY created_at DESC
      `,
      [eventId],
    )
  ).map(toCheckInRecord);
}

export async function markLocalPassCheckedIn({
  checkedInByWallet,
  eventId,
  tokenId,
}: {
  checkedInByWallet: string;
  eventId: string;
  tokenId: string;
}) {
  assertWalletAddress(checkedInByWallet);

  return withTransaction(async (db) => {
    const event = toEventRecord(await getEventByIdFromDb(eventId, db, true));

    if (event.status !== "published") {
      throw new Error("Only published events can be checked in.");
    }

    if (event.organizerWallet !== checkedInByWallet) {
      throw new Error("Only the event organizer can check in passes.");
    }

    const passRow = await queryOne<PassRow>(
      `
      SELECT * FROM passes
      WHERE event_id = $1 AND token_id = $2
      FOR UPDATE
      `,
      [eventId, tokenId],
      db,
    );

    if (!passRow) {
      throw new Error("Pass not found for this event.");
    }

    if (passRow.checked_in) {
      throw new Error("Pass is already checked in.");
    }

    const checkInId = createId("chk");
    const txHash = `stub:check-in:${eventId}:${checkInId}`;
    const checkIn = await queryOne<CheckInRow>(
      `
      INSERT INTO check_ins (
        id, event_id, token_id, owner_wallet, checked_in_by_wallet, tx_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        checkInId,
        eventId,
        tokenId,
        passRow.owner_wallet,
        checkedInByWallet,
        txHash,
      ],
      db,
    );
    const pass = await queryOne<PassRow>(
      `
      UPDATE passes
      SET checked_in = true
      WHERE event_id = $1 AND token_id = $2
      RETURNING *
      `,
      [eventId, tokenId],
      db,
    );

    return {
      checkIn: toCheckInRecord(checkIn as CheckInRow),
      event,
      pass: toPassRecord(pass as PassRow),
    };
  });
}

export async function recordLiveCheckIn(input: RecordLiveCheckInInput) {
  assertWalletAddress(input.checkedInByWallet);
  assertLiveTransactionHash(input.txHash);
  assertTokenId(input.tokenId);

  return withTransaction(async (db) => {
    await assertLiveProofHashUnused(input.txHash, db);

    const event = toEventRecord(await getEventByIdFromDb(input.eventId, db, true));

    if (event.status !== "published") {
      throw new Error("Only published events can be checked in.");
    }

    if (event.organizerWallet !== input.checkedInByWallet) {
      throw new Error("Only the event organizer can check in passes.");
    }

    const passRow = await queryOne<PassRow>(
      `
      SELECT * FROM passes
      WHERE event_id = $1 AND token_id = $2
      FOR UPDATE
      `,
      [input.eventId, input.tokenId],
      db,
    );

    if (!passRow) {
      throw new Error("Pass not found for this event.");
    }

    if (passRow.checked_in) {
      throw new Error("Pass is already checked in.");
    }

    const checkInId = createId("chk");
    const checkIn = await queryOne<CheckInRow>(
      `
      INSERT INTO check_ins (
        id, event_id, token_id, owner_wallet, checked_in_by_wallet, tx_hash
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        checkInId,
        input.eventId,
        input.tokenId,
        passRow.owner_wallet,
        input.checkedInByWallet,
        input.txHash.toLowerCase(),
      ],
      db,
    );
    const pass = await queryOne<PassRow>(
      `
      UPDATE passes
      SET checked_in = true
      WHERE event_id = $1 AND token_id = $2
      RETURNING *
      `,
      [input.eventId, input.tokenId],
      db,
    );
    await reserveLiveProofHash({
      db,
      sourceId: checkInId,
      sourceTable: "check_ins",
      txHash: input.txHash,
    });

    return {
      checkIn: toCheckInRecord(checkIn as CheckInRow),
      event,
      pass: toPassRecord(pass as PassRow),
    };
  });
}

export async function createLocalPassProof(eventId: string, ownerWallet: string) {
  assertWalletAddress(ownerWallet);

  return withTransaction(async (db) => {
    const event = toEventRecord(await getEventByIdFromDb(eventId, db, true));

    if (event.status !== "published") {
      throw new Error("Passes can only be claimed for published events.");
    }

    const existingPass = await queryOne<PassRow>(
      `
      SELECT * FROM passes
      WHERE event_id = $1 AND owner_wallet = $2
      `,
      [eventId, ownerWallet],
      db,
    );

    if (existingPass) {
      throw new Error("Connected wallet already owns a pass for this event.");
    }

    const mintedCount = await countPassesForEventFromDb(eventId, db);

    if (mintedCount >= event.capacity) {
      throw new Error("Event capacity is sold out.");
    }

    const passId = createId("pas");
    const purchaseId = createId("pur");
    const source: PassSource = event.isFree ? "free_claim" : "purchase";
    const passNumber = String(mintedCount + 1).padStart(4, "0");
    const tokenId = `qpass-${event.slug}-${passNumber}-${passId.slice(-6)}`;
    const metadataUri = `quorum://events/${event.slug}/passes/${tokenId}`;
    const metadataHash = createHash("sha256")
      .update(`${event.id}:${ownerWallet}:${tokenId}:${event.metadataHash ?? ""}`)
      .digest("hex");
    const localTxHash = `stub:${source}:${event.id}:${passId}`;
    const pass = await queryOne<PassRow>(
      `
      INSERT INTO passes (
        id, event_id, owner_wallet, token_id, metadata_uri, metadata_hash,
        mint_tx_hash, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        passId,
        event.id,
        ownerWallet,
        tokenId,
        metadataUri,
        `sha256:${metadataHash}`,
        `stub:mint:${event.id}:${passId}`,
        source,
      ],
      db,
    );
    const purchase = await queryOne<PurchaseRow>(
      `
      INSERT INTO purchases (
        id, event_id, buyer_wallet, amount_usdc, token_id, tx_hash, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'succeeded')
      RETURNING *
      `,
      [
        purchaseId,
        event.id,
        ownerWallet,
        event.isFree ? "0" : event.priceUsdc,
        tokenId,
        localTxHash,
      ],
      db,
    );

    return {
      event,
      pass: toPassRecord(pass as PassRow),
      purchase: toPurchaseRecord(purchase as PurchaseRow),
    };
  });
}

export async function recordLivePass(input: RecordLivePassInput) {
  assertWalletAddress(input.ownerWallet);
  assertLiveTransactionHash(input.txHash);
  assertTokenId(input.tokenId);

  return withTransaction(async (db) => {
    await assertLiveProofHashUnused(input.txHash, db);

    const event = toEventRecord(await getEventByIdFromDb(input.eventId, db, true));

    if (event.status !== "published") {
      throw new Error("Passes can only be recorded for published events.");
    }

    const existingPass = await queryOne<PassRow>(
      `
      SELECT * FROM passes
      WHERE event_id = $1 AND owner_wallet = $2
      `,
      [input.eventId, input.ownerWallet],
      db,
    );

    if (existingPass) {
      throw new Error("Connected wallet already owns a pass for this event.");
    }

    const mintedCount = await countPassesForEventFromDb(input.eventId, db);

    if (mintedCount >= event.capacity) {
      throw new Error("Event capacity is sold out.");
    }

    const passId = createId("pas");
    const purchaseId = createId("pur");
    const source: PassSource = event.isFree ? "free_claim" : "purchase";
    const pass = await queryOne<PassRow>(
      `
      INSERT INTO passes (
        id, event_id, owner_wallet, token_id, metadata_uri, metadata_hash,
        mint_tx_hash, source
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        passId,
        event.id,
        input.ownerWallet,
        input.tokenId,
        input.metadataUri,
        normalizeHashForStorage(input.metadataHash, "Pass metadata hash"),
        input.txHash.toLowerCase(),
        source,
      ],
      db,
    );
    const purchase = await queryOne<PurchaseRow>(
      `
      INSERT INTO purchases (
        id, event_id, buyer_wallet, amount_usdc, token_id, tx_hash, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'succeeded')
      RETURNING *
      `,
      [
        purchaseId,
        event.id,
        input.ownerWallet,
        event.isFree ? "0" : event.priceUsdc,
        input.tokenId,
        input.txHash.toLowerCase(),
      ],
      db,
    );
    await reserveLiveProofHash({
      db,
      sourceId: passId,
      sourceTable: "passes",
      txHash: input.txHash,
    });

    return {
      event,
      pass: toPassRecord(pass as PassRow),
      purchase: toPurchaseRecord(purchase as PurchaseRow),
    };
  });
}
