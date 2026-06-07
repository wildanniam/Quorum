import { StrKey } from "@stellar/stellar-sdk";
import { createHash } from "node:crypto";
import { getDatabase } from "@/lib/db/client";
import { createId } from "@/lib/db/ids";
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
  is_free: 0 | 1;
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
  checked_in: 0 | 1;
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

function assertWalletAddress(walletAddress: string) {
  if (!StrKey.isValidEd25519PublicKey(walletAddress)) {
    throw new Error(`Invalid Stellar wallet address: ${walletAddress}`);
  }
}

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
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
    startDateTime: row.start_date_time,
    endDateTime: row.end_date_time,
    timezone: row.timezone,
    locationType: row.location_type,
    locationText: row.location_text,
    meetingUrl: row.meeting_url,
    priceUsdc: row.price_usdc,
    isFree: row.is_free === 1,
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

function toCollaboratorRecord(row: CollaboratorRow): CollaboratorRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    displayName: row.display_name,
    role: row.role,
    walletAddress: row.wallet_address,
    splitPercentage: row.split_percentage,
    createdAt: row.created_at,
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
    sortOrder: row.sort_order,
    createdAt: row.created_at,
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
    checkedIn: row.checked_in === 1,
    createdAt: row.created_at,
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
    createdAt: row.created_at,
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
    createdAt: row.created_at,
  };
}

export function upsertUser(walletAddress: string) {
  assertWalletAddress(walletAddress);

  const db = getDatabase();
  const existing = db
    .prepare("SELECT * FROM users WHERE wallet_address = ?")
    .get(walletAddress) as UserRow | undefined;

  if (existing) {
    db.prepare(
      "UPDATE users SET last_seen_at = datetime('now') WHERE wallet_address = ?",
    ).run(walletAddress);
    return toUserRecord(
      db.prepare("SELECT * FROM users WHERE wallet_address = ?").get(walletAddress) as UserRow,
    );
  }

  const id = createId("usr");
  db.prepare("INSERT INTO users (id, wallet_address) VALUES (?, ?)").run(
    id,
    walletAddress,
  );

  return toUserRecord(db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow);
}

export function createDraftEvent(input: CreateDraftEventInput) {
  assertWalletAddress(input.organizerWallet);

  const db = getDatabase();
  const id = createId("evt");

  db.prepare(
    `
    INSERT INTO events (
      id, slug, title, event_type, short_description, cover_image_url,
      start_date_time, end_date_time, timezone, location_type, location_text,
      meeting_url, price_usdc, is_free, capacity, organizer_wallet
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
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
    input.isFree ? 1 : 0,
    input.capacity,
    input.organizerWallet,
  );

  return getEventById(id);
}

export function createDraftEventWithSetup(
  input: CreateDraftEventInput,
  collaborators: UpsertCollaboratorInput[],
  resources: CreateResourceInput[],
) {
  const db = getDatabase();

  return db.transaction(() => {
    const event = createDraftEvent(input);

    for (const collaborator of collaborators) {
      addCollaborator(event.id, collaborator);
    }

    for (const resource of resources) {
      addResource(event.id, resource);
    }

    return {
      event,
      collaborators: listCollaborators(event.id),
      resources: listResources(event.id),
    };
  })();
}

export function updateDraftEventWithSetup({
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

  const db = getDatabase();

  return db.transaction(() => {
    const existing = db
      .prepare(
        "SELECT * FROM events WHERE id = ? AND organizer_wallet = ?",
      )
      .get(eventId, organizerWallet) as EventRow | undefined;

    if (!existing) {
      throw new Error("Draft event not found for connected organizer.");
    }

    if (existing.status !== "draft") {
      throw new Error("Published events cannot be edited in the MVP.");
    }

    db.prepare(
      `
      UPDATE events
      SET
        title = ?,
        event_type = ?,
        short_description = ?,
        cover_image_url = ?,
        start_date_time = ?,
        end_date_time = ?,
        timezone = ?,
        location_type = ?,
        location_text = ?,
        meeting_url = ?,
        price_usdc = ?,
        is_free = ?,
        capacity = ?
      WHERE id = ?
      `,
    ).run(
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
      input.isFree ? 1 : 0,
      input.capacity,
      eventId,
    );

    db.prepare("DELETE FROM collaborators WHERE event_id = ?").run(eventId);
    db.prepare("DELETE FROM resources WHERE event_id = ?").run(eventId);

    for (const collaborator of collaborators) {
      addCollaborator(eventId, collaborator);
    }

    for (const resource of resources) {
      addResource(eventId, resource);
    }

    return {
      event: getEventById(eventId),
      collaborators: listCollaborators(eventId),
      resources: listResources(eventId),
    };
  })();
}

export function publishDraftEventStub(eventId: string, organizerWallet: string) {
  assertWalletAddress(organizerWallet);

  const db = getDatabase();

  return db.transaction(() => {
    const event = db
      .prepare(
        "SELECT * FROM events WHERE id = ? AND organizer_wallet = ?",
      )
      .get(eventId, organizerWallet) as EventRow | undefined;

    if (!event) {
      throw new Error("Draft event not found for connected organizer.");
    }

    if (event.status !== "draft") {
      throw new Error("Only draft events can be published.");
    }

    const splitTotal = getCollaboratorSplitTotal(eventId);
    const resourceCount = listResources(eventId).length;

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

    db.prepare(
      `
      UPDATE events
      SET status = 'published', metadata_hash = ?, publish_tx_hash = ?
      WHERE id = ?
      `,
    ).run(`sha256:${metadataHash}`, publishTxHash, eventId);

    return {
      event: getEventById(eventId),
      collaborators: listCollaborators(eventId),
      resources: listResources(eventId),
    };
  })();
}

export function getEventById(id: string) {
  const row = getDatabase().prepare("SELECT * FROM events WHERE id = ?").get(id) as
    | EventRow
    | undefined;

  if (!row) {
    throw new Error(`Event not found: ${id}`);
  }

  return toEventRecord(row);
}

export function getEventBySlug(slug: string) {
  const row = getDatabase()
    .prepare("SELECT * FROM events WHERE slug = ?")
    .get(slug) as EventRow | undefined;

  return row ? toEventRecord(row) : null;
}

export function listPublishedEvents() {
  return (
    getDatabase()
      .prepare(
        "SELECT * FROM events WHERE status = 'published' ORDER BY start_date_time ASC",
      )
      .all() as EventRow[]
  ).map(toEventRecord);
}

export function listOrganizerEvents(organizerWallet: string) {
  assertWalletAddress(organizerWallet);

  return (
    getDatabase()
      .prepare(
        "SELECT * FROM events WHERE organizer_wallet = ? ORDER BY created_at DESC",
      )
      .all(organizerWallet) as EventRow[]
  ).map(toEventRecord);
}

export function listCollaborationsByWallet(walletAddress: string) {
  assertWalletAddress(walletAddress);

  return (
    getDatabase()
      .prepare(
        `
        SELECT c.*
        FROM collaborators c
        JOIN events e ON e.id = c.event_id
        WHERE c.wallet_address = ?
        ORDER BY e.created_at DESC, c.created_at DESC
        `,
      )
      .all(walletAddress) as CollaboratorRow[]
  ).map((row) => {
    const collaborator = toCollaboratorRecord(row);
    const event = getEventById(collaborator.eventId);
    const revenueUsdc = getEventRevenueUsdc(event.id);
    const withdrawnUsdc = getWithdrawnTotalUsdc(event.id, walletAddress);

    return {
      collaborator,
      event,
      earnedUsdc: (revenueUsdc * collaborator.splitPercentage) / 100,
      withdrawnUsdc,
    };
  });
}

export function addCollaborator(
  eventId: string,
  input: UpsertCollaboratorInput,
) {
  assertWalletAddress(input.walletAddress);

  const id = createId("col");
  getDatabase()
    .prepare(
      `
      INSERT INTO collaborators (
        id, event_id, display_name, role, wallet_address, split_percentage
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      id,
      eventId,
      input.displayName,
      input.role,
      input.walletAddress,
      input.splitPercentage,
    );

  const row = getDatabase()
    .prepare("SELECT * FROM collaborators WHERE id = ?")
    .get(id) as CollaboratorRow;

  return toCollaboratorRecord(row);
}

export function listCollaborators(eventId: string) {
  return (
    getDatabase()
      .prepare("SELECT * FROM collaborators WHERE event_id = ? ORDER BY created_at ASC")
      .all(eventId) as CollaboratorRow[]
  ).map(toCollaboratorRecord);
}

export function getCollaboratorSplitTotal(eventId: string) {
  const row = getDatabase()
    .prepare(
      "SELECT COALESCE(SUM(split_percentage), 0) as total FROM collaborators WHERE event_id = ?",
    )
    .get(eventId) as { total: number };

  return Number(row.total);
}

export function addResource(eventId: string, input: CreateResourceInput) {
  const id = createId("res");
  getDatabase()
    .prepare(
      `
      INSERT INTO resources (id, event_id, title, description, type, url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      id,
      eventId,
      input.title,
      input.description ?? null,
      input.type,
      input.url ?? null,
      input.sortOrder,
    );

  return listResources(eventId).find((resource) => resource.id === id);
}

export function listResources(eventId: string) {
  return (
    getDatabase()
      .prepare(
        "SELECT * FROM resources WHERE event_id = ? ORDER BY sort_order ASC, created_at ASC",
      )
      .all(eventId) as ResourceRow[]
  ).map(toResourceRecord);
}

export function countPassesForEvent(eventId: string) {
  const row = getDatabase()
    .prepare("SELECT COUNT(*) as count FROM passes WHERE event_id = ?")
    .get(eventId) as { count: number };

  return Number(row.count);
}

export function countCheckedInPassesForEvent(eventId: string) {
  const row = getDatabase()
    .prepare(
      "SELECT COUNT(*) as count FROM passes WHERE event_id = ? AND checked_in = 1",
    )
    .get(eventId) as { count: number };

  return Number(row.count);
}

export function countMintedPasses() {
  const row = getDatabase()
    .prepare("SELECT COUNT(*) as count FROM passes")
    .get() as { count: number };

  return Number(row.count);
}

export function getSucceededPurchaseTotalUsdc() {
  const row = getDatabase()
    .prepare(
      `
      SELECT COALESCE(SUM(CAST(amount_usdc AS REAL)), 0) as total
      FROM purchases
      WHERE status = 'succeeded'
      `,
    )
    .get() as { total: number };

  return Number(row.total);
}

export function getEventRevenueUsdc(eventId: string) {
  const row = getDatabase()
    .prepare(
      `
      SELECT COALESCE(SUM(CAST(amount_usdc AS REAL)), 0) as total
      FROM purchases
      WHERE event_id = ? AND status = 'succeeded'
      `,
    )
    .get(eventId) as { total: number };

  return Number(row.total);
}

export function getWithdrawnTotalUsdc(eventId: string, walletAddress: string) {
  assertWalletAddress(walletAddress);

  const row = getDatabase()
    .prepare(
      `
      SELECT COALESCE(SUM(CAST(amount_usdc AS REAL)), 0) as total
      FROM withdrawals
      WHERE event_id = ? AND collaborator_wallet = ?
      `,
    )
    .get(eventId, walletAddress) as { total: number };

  return Number(row.total);
}

export function getEventDashboardMetrics(eventId: string) {
  const event = getEventById(eventId);
  const passCount = countPassesForEvent(event.id);
  const checkedInCount = countCheckedInPassesForEvent(event.id);
  const revenueUsdc = getEventRevenueUsdc(event.id);

  return {
    checkedInCount,
    capacityRemaining: Math.max(event.capacity - passCount, 0),
    passCount,
    revenueUsdc,
  };
}

export function getPassByEventAndOwner(eventId: string, ownerWallet: string) {
  assertWalletAddress(ownerWallet);

  const row = getDatabase()
    .prepare("SELECT * FROM passes WHERE event_id = ? AND owner_wallet = ?")
    .get(eventId, ownerWallet) as PassRow | undefined;

  return row ? toPassRecord(row) : null;
}

export function listPassesByOwner(ownerWallet: string) {
  assertWalletAddress(ownerWallet);

  return (
    getDatabase()
      .prepare("SELECT * FROM passes WHERE owner_wallet = ? ORDER BY created_at DESC")
      .all(ownerWallet) as PassRow[]
  ).map(toPassRecord);
}

export function getPassByTokenId(tokenId: string) {
  const passRow = getDatabase()
    .prepare("SELECT * FROM passes WHERE token_id = ?")
    .get(tokenId) as PassRow | undefined;

  if (!passRow) {
    return null;
  }

  const purchaseRow = getDatabase()
    .prepare(
      `
      SELECT * FROM purchases
      WHERE token_id = ?
      ORDER BY created_at DESC
      LIMIT 1
      `,
    )
    .get(tokenId) as PurchaseRow | undefined;

  return {
    event: getEventById(passRow.event_id),
    pass: toPassRecord(passRow),
    purchase: purchaseRow ? toPurchaseRecord(purchaseRow) : null,
  };
}

export function listCheckInsForEvent(eventId: string) {
  return (
    getDatabase()
      .prepare(
        "SELECT * FROM check_ins WHERE event_id = ? ORDER BY created_at DESC",
      )
      .all(eventId) as CheckInRow[]
  ).map(toCheckInRecord);
}

export function markLocalPassCheckedIn({
  checkedInByWallet,
  eventId,
  tokenId,
}: {
  checkedInByWallet: string;
  eventId: string;
  tokenId: string;
}) {
  assertWalletAddress(checkedInByWallet);

  const db = getDatabase();

  return db.transaction(() => {
    const eventRow = db
      .prepare("SELECT * FROM events WHERE id = ?")
      .get(eventId) as EventRow | undefined;

    if (!eventRow) {
      throw new Error("Event not found.");
    }

    const event = toEventRecord(eventRow);

    if (event.status !== "published") {
      throw new Error("Only published events can be checked in.");
    }

    if (event.organizerWallet !== checkedInByWallet) {
      throw new Error("Only the event organizer can check in passes.");
    }

    const passRow = db
      .prepare("SELECT * FROM passes WHERE event_id = ? AND token_id = ?")
      .get(eventId, tokenId) as PassRow | undefined;

    if (!passRow) {
      throw new Error("Pass not found for this event.");
    }

    if (passRow.checked_in === 1) {
      throw new Error("Pass is already checked in.");
    }

    const checkInId = createId("chk");
    const txHash = `stub:check-in:${eventId}:${checkInId}`;

    db.prepare(
      `
      INSERT INTO check_ins (
        id, event_id, token_id, owner_wallet, checked_in_by_wallet, tx_hash
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
    ).run(
      checkInId,
      eventId,
      tokenId,
      passRow.owner_wallet,
      checkedInByWallet,
      txHash,
    );

    db.prepare(
      "UPDATE passes SET checked_in = 1 WHERE event_id = ? AND token_id = ?",
    ).run(eventId, tokenId);

    const checkIn = db
      .prepare("SELECT * FROM check_ins WHERE id = ?")
      .get(checkInId) as CheckInRow;
    const pass = db
      .prepare("SELECT * FROM passes WHERE id = ?")
      .get(passRow.id) as PassRow;

    return {
      checkIn: toCheckInRecord(checkIn),
      event,
      pass: toPassRecord(pass),
    };
  })();
}

export function createLocalPassProof(eventId: string, ownerWallet: string) {
  assertWalletAddress(ownerWallet);

  const db = getDatabase();

  return db.transaction(() => {
    const eventRow = db
      .prepare("SELECT * FROM events WHERE id = ?")
      .get(eventId) as EventRow | undefined;

    if (!eventRow) {
      throw new Error("Event not found.");
    }

    const event = toEventRecord(eventRow);

    if (event.status !== "published") {
      throw new Error("Passes can only be claimed for published events.");
    }

    const existingPass = db
      .prepare("SELECT * FROM passes WHERE event_id = ? AND owner_wallet = ?")
      .get(eventId, ownerWallet) as PassRow | undefined;

    if (existingPass) {
      throw new Error("Connected wallet already owns a pass for this event.");
    }

    const mintedCount = countPassesForEvent(eventId);

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

    db.prepare(
      `
      INSERT INTO passes (
        id, event_id, owner_wallet, token_id, metadata_uri, metadata_hash,
        mint_tx_hash, source
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      passId,
      event.id,
      ownerWallet,
      tokenId,
      metadataUri,
      `sha256:${metadataHash}`,
      `stub:mint:${event.id}:${passId}`,
      source,
    );

    db.prepare(
      `
      INSERT INTO purchases (
        id, event_id, buyer_wallet, amount_usdc, token_id, tx_hash, status
      )
      VALUES (?, ?, ?, ?, ?, ?, 'succeeded')
      `,
    ).run(
      purchaseId,
      event.id,
      ownerWallet,
      event.isFree ? "0" : event.priceUsdc,
      tokenId,
      localTxHash,
    );

    const pass = db
      .prepare("SELECT * FROM passes WHERE id = ?")
      .get(passId) as PassRow;
    const purchase = db
      .prepare("SELECT * FROM purchases WHERE id = ?")
      .get(purchaseId) as PurchaseRow;

    return {
      event,
      pass: toPassRecord(pass),
      purchase: toPurchaseRecord(purchase),
    };
  })();
}
