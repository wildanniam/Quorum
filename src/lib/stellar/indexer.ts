import { createHash } from "node:crypto";
import { execute, queryOne } from "@/lib/db/client";
import type {
  IndexerStateRecord,
  StellarEventRecord,
} from "@/lib/db/models";
import { getContractReadiness } from "@/lib/stellar/contracts";

type JsonRecord = Record<string, unknown>;

type IndexerStateRow = {
  id: string;
  network: string;
  rpc_url: string;
  contract_ids: string[];
  cursor: string | null;
  latest_ledger: number | null;
  last_started_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type StellarEventRow = {
  event_key: string;
  contract_id: string;
  event_type: string;
  topic_key: string | null;
  app_event_id: string | null;
  core_event_id: string | null;
  tx_hash: string | null;
  ledger: number;
  event_index: number;
  paging_token: string;
  successful: boolean;
  topics_json: unknown;
  value_json: unknown;
  value_xdr: string | null;
  raw_event_json: unknown;
  observed_at: string;
  created_at: string;
  updated_at: string;
};

type NormalizedStellarEvent = {
  contractId: string;
  coreEventId: string | null;
  eventIndex: number;
  eventKey: string;
  eventType: string;
  ledger: number;
  pagingToken: string;
  rawEventJson: unknown;
  successful: boolean;
  topicKey: string | null;
  topicsJson: unknown[];
  txHash: string | null;
  valueJson: unknown;
  valueXdr: string | null;
};

type RpcRequestOptions = {
  method: string;
  params?: JsonRecord;
  rpcUrl: string;
};

export type RpcRequester = (options: RpcRequestOptions) => Promise<JsonRecord>;

export type RunIndexerOptions = {
  contractIds?: string[];
  cursor?: string | null;
  limit?: number;
  requester?: RpcRequester;
  startLedger?: number | null;
  stateId?: string;
};

export type IngestStellarEventsOptions = {
  allowedContractIds?: string[];
  events: unknown[];
};

const DEFAULT_STATE_ID = "quorum-testnet-contracts";
const DEFAULT_LIMIT = 100;
const DEFAULT_RECENT_LEDGER_WINDOW = 100_000;
const INDEXER_ACTIVE_RUN_TIMEOUT_SECONDS = 15 * 60;
const MAX_RECENT_LEDGER_WINDOW = 100_000;
const HEX_64_PATTERN = /^[a-f0-9]{64}$/i;

function optionalEnv(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function validateIndexerRunOptions({
  cursor = null,
  limit = DEFAULT_LIMIT,
  startLedger = null,
}: {
  cursor?: string | null;
  limit?: number;
  startLedger?: number | null;
}) {
  const normalizedCursor = optionalEnv(cursor ?? undefined);

  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
    throw new Error("Indexer limit must be an integer between 1 and 500.");
  }

  if (
    startLedger !== null &&
    (!Number.isSafeInteger(startLedger) || startLedger < 0)
  ) {
    throw new Error("Indexer start ledger must be a non-negative integer.");
  }

  if (normalizedCursor && startLedger !== null) {
    throw new Error("Indexer cursor and start ledger cannot be combined.");
  }

  return {
    cursor: normalizedCursor,
    limit,
    startLedger,
  };
}

export function resolveIndexerCheckpoint({
  currentCursor,
  currentLatestLedger,
  nextCursor,
  observedLatestLedger,
}: {
  currentCursor: string | null;
  currentLatestLedger: number | null;
  nextCursor: string | null;
  observedLatestLedger: number;
}) {
  const regressed =
    currentLatestLedger !== null &&
    observedLatestLedger < currentLatestLedger;

  return {
    cursor: regressed ? currentCursor : nextCursor ?? currentCursor,
    latestLedger: Math.max(currentLatestLedger ?? 0, observedLatestLedger),
  };
}

function recentLedgerWindow() {
  const raw = optionalEnv(process.env.QUORUM_INDEXER_RECENT_LEDGER_WINDOW);
  if (!raw) return DEFAULT_RECENT_LEDGER_WINDOW;

  const value = Number(raw);

  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_RECENT_LEDGER_WINDOW) {
    throw new Error(
      `QUORUM_INDEXER_RECENT_LEDGER_WINDOW must be an integer between 1 and ${MAX_RECENT_LEDGER_WINDOW}.`,
    );
  }

  return value;
}

function configuredStartLedger() {
  const raw = optionalEnv(process.env.QUORUM_INDEXER_START_LEDGER);
  if (!raw) return null;

  const value = Number(raw);

  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(
      "QUORUM_INDEXER_START_LEDGER must be a non-negative integer.",
    );
  }

  return value;
}

function toIndexerStateRecord(row: IndexerStateRow): IndexerStateRecord {
  return {
    id: row.id,
    network: row.network,
    rpcUrl: row.rpc_url,
    contractIds: row.contract_ids,
    cursor: row.cursor,
    latestLedger: row.latest_ledger === null ? null : Number(row.latest_ledger),
    lastStartedAt: row.last_started_at,
    lastSuccessAt: row.last_success_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toStellarEventRecord(row: StellarEventRow): StellarEventRecord {
  return {
    eventKey: row.event_key,
    contractId: row.contract_id,
    eventType: row.event_type,
    topicKey: row.topic_key,
    appEventId: row.app_event_id,
    coreEventId: row.core_event_id,
    txHash: row.tx_hash,
    ledger: Number(row.ledger),
    eventIndex: Number(row.event_index),
    pagingToken: row.paging_token,
    successful: row.successful,
    topicsJson: row.topics_json,
    valueJson: row.value_json,
    valueXdr: row.value_xdr,
    rawEventJson: row.raw_event_json,
    observedAt: row.observed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (isJsonRecord(value)) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asInteger(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);

  return null;
}

function normalizeHex64(value: unknown) {
  const text = asString(value)?.toLowerCase() ?? null;

  return text && HEX_64_PATTERN.test(text) ? text : null;
}

function maybeScValLabel(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (!isJsonRecord(value)) return null;

  for (const key of ["symbol", "sym", "str", "string", "value"]) {
    if (key in value) {
      const label = maybeScValLabel(value[key]);
      if (label) return label;
    }
  }

  const xdr = asString(value.xdr);
  if (xdr) return `xdr:${xdr.slice(0, 14)}`;

  return null;
}

function findHex64(value: unknown) {
  const match = stableJson(value).match(/[a-f0-9]{64}/i);

  return match ? match[0].toLowerCase() : null;
}

function eventArrayFromRpcResult(result: JsonRecord) {
  const events = result.events;

  return Array.isArray(events) ? events : [];
}

function latestLedgerFromRpcResult(result: JsonRecord) {
  return (
    asInteger(result.latestLedger) ??
    asInteger(result.latestLedgerSequence) ??
    asInteger(result.latest_ledger) ??
    asInteger(result.sequence) ??
    null
  );
}

function cursorFromRpcResult(result: JsonRecord, events: unknown[]) {
  const cursor = asString(result.cursor);
  if (cursor) return cursor;

  const lastEvent = events.at(-1);
  if (!isJsonRecord(lastEvent)) return null;

  return (
    asString(lastEvent.pagingToken) ??
    asString(lastEvent.paging_token) ??
    asString(lastEvent.id)
  );
}

async function defaultRpcRequester({
  method,
  params,
  rpcUrl,
}: RpcRequestOptions): Promise<JsonRecord> {
  const response = await fetch(rpcUrl, {
    body: JSON.stringify({
      id: "quorum-indexer",
      jsonrpc: "2.0",
      method,
      params,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Stellar RPC ${method} failed with HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as JsonRecord;

  if (isJsonRecord(payload.error)) {
    throw new Error(
      `Stellar RPC ${method} failed: ${String(payload.error.message ?? "unknown error")}`,
    );
  }

  if (!isJsonRecord(payload.result)) {
    throw new Error(`Stellar RPC ${method} returned no result object.`);
  }

  return payload.result;
}

function normalizeStellarEvent(
  rawEvent: unknown,
  eventIndex: number,
): NormalizedStellarEvent {
  if (!isJsonRecord(rawEvent)) {
    throw new Error("Stellar event must be an object.");
  }

  const contractId =
    asString(rawEvent.contractId) ??
    asString(rawEvent.contract_id) ??
    asString(rawEvent.contract);
  const ledger =
    asInteger(rawEvent.ledger) ??
    asInteger(rawEvent.ledgerSequence) ??
    asInteger(rawEvent.ledger_sequence);

  if (!contractId) throw new Error("Indexed Stellar event is missing contract ID.");
  if (ledger === null) throw new Error("Indexed Stellar event is missing ledger.");

  const topicsRaw = rawEvent.topic ?? rawEvent.topics ?? [];
  const topicsJson = Array.isArray(topicsRaw) ? topicsRaw : [topicsRaw];
  const valueJson = rawEvent.value ?? rawEvent.value_json ?? {};
  const txHash =
    normalizeHex64(rawEvent.txHash) ??
    normalizeHex64(rawEvent.tx_hash) ??
    normalizeHex64(rawEvent.transactionHash);
  const pagingToken =
    asString(rawEvent.pagingToken) ??
    asString(rawEvent.paging_token) ??
    asString(rawEvent.id) ??
    `${contractId}:${ledger}:${eventIndex}:${txHash ?? "no-tx"}`;
  const topicKey = maybeScValLabel(topicsJson[0]);
  const eventType =
    asString(rawEvent.type) ??
    (topicKey ? topicKey.toLowerCase().replaceAll(" ", "_") : "contract");
  const eventKey = sha256Hex(`${contractId}:${pagingToken}`);
  const valueXdr = isJsonRecord(valueJson)
    ? asString(valueJson.xdr) ?? asString(valueJson.valueXdr)
    : null;

  return {
    contractId,
    coreEventId: findHex64([topicsJson, valueJson]),
    eventIndex,
    eventKey,
    eventType,
    ledger,
    pagingToken,
    rawEventJson: rawEvent,
    successful: rawEvent.inSuccessfulContractCall !== false,
    topicKey,
    topicsJson,
    txHash,
    valueJson,
    valueXdr,
  };
}

async function resolveAppEventId({
  coreEventId,
  txHash,
}: {
  coreEventId: string | null;
  txHash: string | null;
}) {
  if (coreEventId) {
    const row = await queryOne<{ id: string }>(
      "SELECT id FROM events WHERE core_event_id = $1 LIMIT 1",
      [coreEventId],
    );

    if (row) return row.id;
  }

  if (!txHash) return null;

  const row = await queryOne<{ event_id: string }>(
    `
    SELECT id AS event_id FROM events WHERE publish_tx_hash = $1
    UNION ALL SELECT event_id FROM passes WHERE mint_tx_hash = $1
    UNION ALL SELECT event_id FROM purchases WHERE tx_hash = $1
    UNION ALL SELECT event_id FROM check_ins WHERE tx_hash = $1
    UNION ALL SELECT event_id FROM withdrawals WHERE tx_hash = $1
    LIMIT 1
    `,
    [txHash],
  );

  return row?.event_id ?? null;
}

async function recordNormalizedStellarEvent(event: NormalizedStellarEvent) {
  const appEventId = await resolveAppEventId({
    coreEventId: event.coreEventId,
    txHash: event.txHash,
  });
  const inserted = await queryOne<StellarEventRow>(
    `
    INSERT INTO stellar_events (
      event_key, contract_id, event_type, topic_key, app_event_id,
      core_event_id, tx_hash, ledger, event_index, paging_token, successful,
      topics_json, value_json, value_xdr, raw_event_json
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb, $14, $15::jsonb)
    ON CONFLICT (event_key) DO NOTHING
    RETURNING *
    `,
    [
      event.eventKey,
      event.contractId,
      event.eventType,
      event.topicKey,
      appEventId,
      event.coreEventId,
      event.txHash,
      event.ledger,
      event.eventIndex,
      event.pagingToken,
      event.successful,
      JSON.stringify(event.topicsJson),
      JSON.stringify(event.valueJson),
      event.valueXdr,
      JSON.stringify(event.rawEventJson),
    ],
  );

  if (inserted) {
    return { inserted: true, record: toStellarEventRecord(inserted) };
  }

  const updated = await queryOne<StellarEventRow>(
    `
    UPDATE stellar_events
    SET
      app_event_id = COALESCE($2, app_event_id),
      core_event_id = COALESCE($3, core_event_id),
      tx_hash = COALESCE($4, tx_hash),
      raw_event_json = $5::jsonb
    WHERE event_key = $1
    RETURNING *
    `,
    [
      event.eventKey,
      appEventId,
      event.coreEventId,
      event.txHash,
      JSON.stringify(event.rawEventJson),
    ],
  );

  if (!updated) {
    throw new Error("Could not read existing indexed Stellar event.");
  }

  return { inserted: false, record: toStellarEventRecord(updated) };
}

async function markIndexerStarted({
  contractIds,
  network,
  rpcUrl,
  stateId,
}: {
  contractIds: string[];
  network: string;
  rpcUrl: string;
  stateId: string;
}) {
  const row = await queryOne<IndexerStateRow>(
    `
    INSERT INTO indexer_state (
      id, network, rpc_url, contract_ids, last_started_at, last_error
    )
    VALUES ($1, $2, $3, $4, now(), NULL)
    ON CONFLICT (id) DO UPDATE
    SET
      network = EXCLUDED.network,
      rpc_url = EXCLUDED.rpc_url,
      contract_ids = EXCLUDED.contract_ids,
      last_started_at = now(),
      last_error = NULL
    WHERE
      indexer_state.last_started_at IS NULL
      OR indexer_state.last_success_at >= indexer_state.last_started_at
      OR indexer_state.last_error IS NOT NULL
      OR indexer_state.last_started_at <
        now() - make_interval(secs => $5)
    RETURNING *
    `,
    [
      stateId,
      network,
      rpcUrl,
      contractIds,
      INDEXER_ACTIVE_RUN_TIMEOUT_SECONDS,
    ],
  );

  if (!row) {
    throw new Error("A Stellar event indexer run is already active.");
  }

  return toIndexerStateRecord(row);
}

async function markIndexerSuccess({
  cursor,
  latestLedger,
  stateId,
}: {
  cursor: string | null;
  latestLedger: number | null;
  stateId: string;
}) {
  const row = await queryOne<IndexerStateRow>(
    `
    UPDATE indexer_state
    SET
      cursor = COALESCE($2, cursor),
      latest_ledger = CASE
        WHEN $3::integer IS NULL THEN latest_ledger
        WHEN latest_ledger IS NULL THEN $3::integer
        ELSE GREATEST(latest_ledger, $3::integer)
      END,
      last_success_at = now(),
      last_error = NULL
    WHERE id = $1
    RETURNING *
    `,
    [stateId, cursor, latestLedger],
  );

  if (!row) throw new Error("Could not update indexer state.");

  return toIndexerStateRecord(row);
}

async function markIndexerFailure({
  error,
  stateId,
}: {
  error: unknown;
  stateId: string;
}) {
  const message = (error instanceof Error ? error.message : String(error)).slice(
    0,
    1_000,
  );

  await execute(
    "UPDATE indexer_state SET last_error = $2 WHERE id = $1",
    [stateId, message],
  );
}

export async function getIndexerState(stateId = DEFAULT_STATE_ID) {
  const row = await queryOne<IndexerStateRow>(
    "SELECT * FROM indexer_state WHERE id = $1",
    [stateId],
  );

  return row ? toIndexerStateRecord(row) : null;
}

export function getQuorumIndexerContracts() {
  const readiness = getContractReadiness();
  const contractIds = [
    readiness.coreContractId,
    readiness.passContractId,
  ].filter((value): value is string => Boolean(value));

  return { contractIds, readiness };
}

export async function ingestStellarEvents({
  allowedContractIds,
  events,
}: IngestStellarEventsOptions) {
  const normalizedEvents = events.map((event, eventIndex) =>
    normalizeStellarEvent(event, eventIndex),
  );
  const allowedContracts = allowedContractIds
    ? new Set(allowedContractIds)
    : null;

  if (allowedContracts) {
    const unexpected = normalizedEvents.find(
      (event) => !allowedContracts.has(event.contractId),
    );

    if (unexpected) {
      throw new Error(
        `Stellar RPC returned an event for unconfigured contract ${unexpected.contractId}.`,
      );
    }
  }

  const records: StellarEventRecord[] = [];
  let insertedCount = 0;

  for (const event of normalizedEvents) {
    const result = await recordNormalizedStellarEvent(event);

    if (result.inserted) insertedCount += 1;
    records.push(result.record);
  }

  return {
    insertedCount,
    records,
    totalCount: normalizedEvents.length,
  };
}

async function latestLedgerForInitialRun({
  requester,
  rpcUrl,
}: {
  requester: RpcRequester;
  rpcUrl: string;
}) {
  const result = await requester({ method: "getLatestLedger", rpcUrl });
  const latestLedger = latestLedgerFromRpcResult(result);

  if (latestLedger === null) {
    throw new Error("Stellar RPC getLatestLedger did not return a ledger number.");
  }

  return latestLedger;
}

export async function runStellarEventIndexer({
  contractIds: contractIdsOverride,
  cursor: cursorOverride = null,
  limit = DEFAULT_LIMIT,
  requester = defaultRpcRequester,
  startLedger: startLedgerOverride = null,
  stateId = DEFAULT_STATE_ID,
}: RunIndexerOptions = {}) {
  const startedAt = new Date();
  const runStartedMs = startedAt.getTime();
  const validated = validateIndexerRunOptions({
    cursor: cursorOverride,
    limit,
    startLedger: startLedgerOverride,
  });
  const { contractIds: configuredContractIds, readiness } =
    getQuorumIndexerContracts();
  const contractIds = [
    ...new Set(contractIdsOverride ?? configuredContractIds),
  ].sort();

  if (!readiness.configured && !contractIdsOverride) {
    throw new Error("Valid Quorum contract IDs are required before indexing.");
  }

  if (contractIds.length === 0) {
    throw new Error("At least one contract ID is required before indexing.");
  }

  const state = await markIndexerStarted({
    contractIds,
    network: readiness.network,
    rpcUrl: readiness.rpcUrl,
    stateId,
  });
  const cursor =
    validated.startLedger !== null
      ? null
      : validated.cursor ?? state.cursor;
  const envStartLedger = configuredStartLedger();
  let startLedger =
    validated.startLedger ??
    (cursor
      ? null
      : state.latestLedger !== null
        ? state.latestLedger + 1
        : envStartLedger);

  try {
    if (startLedger === null && !cursor) {
      const latestLedger = await latestLedgerForInitialRun({
        requester,
        rpcUrl: readiness.rpcUrl,
      });
      startLedger = Math.max(latestLedger - recentLedgerWindow(), 0);
    }

    const result = await requester({
      method: "getEvents",
      params: {
        filters: [
          {
            contractIds,
            topics: [["*"]],
            type: "contract",
          },
        ],
        pagination: {
          ...(cursor ? { cursor } : {}),
          limit: validated.limit,
        },
        ...(startLedger !== null ? { startLedger } : {}),
      },
      rpcUrl: readiness.rpcUrl,
    });
    const events = eventArrayFromRpcResult(result);
    const ingested = await ingestStellarEvents({
      allowedContractIds: contractIds,
      events,
    });
    const reportedLatestLedger = latestLedgerFromRpcResult(result);
    const observedLatestLedger = Math.max(
      reportedLatestLedger ?? 0,
      startLedger ?? 0,
      ...ingested.records.map((record) => record.ledger),
    );
    const checkpoint = resolveIndexerCheckpoint({
      currentCursor: cursor,
      currentLatestLedger: state.latestLedger,
      nextCursor: cursorFromRpcResult(result, events),
      observedLatestLedger,
    });
    const finalState = await markIndexerSuccess({
      cursor: checkpoint.cursor,
      latestLedger: checkpoint.latestLedger,
      stateId,
    });

    return {
      contractIds,
      cursor: checkpoint.cursor,
      durationMs: Date.now() - runStartedMs,
      fetchedCount: events.length,
      finishedAt: new Date().toISOString(),
      insertedCount: ingested.insertedCount,
      latestLedger: checkpoint.latestLedger,
      startedAt: startedAt.toISOString(),
      state: finalState,
    };
  } catch (error) {
    await markIndexerFailure({ error, stateId }).catch(() => undefined);
    throw error;
  }
}
