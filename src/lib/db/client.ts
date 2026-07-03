import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:5432/quorum";
const TIMESTAMP_OID = 1114;
const TIMESTAMPTZ_OID = 1184;

types.setTypeParser(TIMESTAMP_OID, (value) => value);
types.setTypeParser(TIMESTAMPTZ_OID, (value) => value);

type GlobalWithDatabase = typeof globalThis & {
  quorumDatabasePool?: Pool;
  quorumDatabasePoolKey?: string;
};

export type DatabaseClient = PoolClient;

function optionalEnv(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function getDatabaseUrl(databaseUrl = process.env.DATABASE_URL) {
  return optionalEnv(databaseUrl) ?? DEFAULT_DATABASE_URL;
}

export function getMigrationDatabaseUrl() {
  return optionalEnv(process.env.DIRECT_DATABASE_URL) ?? getDatabaseUrl();
}

export function getDatabaseSchema() {
  const schema = optionalEnv(process.env.QUORUM_DB_SCHEMA) ?? "public";

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
    throw new Error(
      "QUORUM_DB_SCHEMA must contain only letters, numbers, and underscores, and cannot start with a number.",
    );
  }

  return schema;
}

export function quoteIdentifier(identifier: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }

  return `"${identifier.replaceAll('"', '""')}"`;
}

function shouldUseSsl(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  const sslMode = parsed.searchParams.get("sslmode");
  const hostname = parsed.hostname.toLowerCase();

  return (
    sslMode === "require" ||
    (!["localhost", "127.0.0.1", "::1"].includes(hostname) &&
      !hostname.endsWith(".local"))
  );
}

function poolConnectionString(databaseUrl: string) {
  const parsed = new URL(databaseUrl);

  if (parsed.searchParams.get("sslmode") === "require") {
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("uselibpqcompat");
    return parsed.toString();
  }

  return databaseUrl;
}

function poolKey() {
  return `${getDatabaseUrl()}::${getDatabaseSchema()}`;
}

export function getDatabasePool() {
  const globalForDb = globalThis as GlobalWithDatabase;
  const key = poolKey();

  if (!globalForDb.quorumDatabasePool || globalForDb.quorumDatabasePoolKey !== key) {
    if (globalForDb.quorumDatabasePool) {
      void globalForDb.quorumDatabasePool.end();
    }

    const connectionString = getDatabaseUrl();
    const ssl = shouldUseSsl(connectionString)
      ? { rejectUnauthorized: false }
      : undefined;
    globalForDb.quorumDatabasePool = new Pool({
      connectionString: ssl
        ? poolConnectionString(connectionString)
        : connectionString,
      max: Number(process.env.QUORUM_DB_POOL_MAX ?? 10),
      ssl,
    });
    globalForDb.quorumDatabasePoolKey = key;
  }

  return globalForDb.quorumDatabasePool;
}

async function checkoutClient() {
  const client = await getDatabasePool().connect();

  await client.query(
    `SET search_path TO ${quoteIdentifier(getDatabaseSchema())}, public`,
  );

  return client;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
  client?: DatabaseClient,
) {
  if (client) {
    return (await client.query<T>(text, params)).rows;
  }

  const pooledClient = await checkoutClient();

  try {
    return (await pooledClient.query<T>(text, params)).rows;
  } finally {
    pooledClient.release();
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
  client?: DatabaseClient,
) {
  return (await query<T>(text, params, client))[0] ?? null;
}

export async function execute(
  text: string,
  params: unknown[] = [],
  client?: DatabaseClient,
) {
  if (client) {
    return client.query(text, params);
  }

  const pooledClient = await checkoutClient();

  try {
    return pooledClient.query(text, params);
  } finally {
    pooledClient.release();
  }
}

export async function withTransaction<T>(
  callback: (client: DatabaseClient) => Promise<T>,
) {
  const client = await checkoutClient();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
