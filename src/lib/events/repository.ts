import { StrKey } from "@stellar/stellar-sdk";
import { getDatabase } from "@/lib/db/client";
import { createId } from "@/lib/db/ids";
import type {
  CollaboratorRecord,
  EventRecord,
  LocationType,
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
