import { Pool, types } from "pg";
import fs from "node:fs";
import path from "node:path";

export const DEFAULT_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:5432/quorum";

const TIMESTAMP_OID = 1114;
const TIMESTAMPTZ_OID = 1184;

types.setTypeParser(TIMESTAMP_OID, (value) => value);
types.setTypeParser(TIMESTAMPTZ_OID, (value) => value);

function loadEnvLocalIfNeeded() {
  if (process.env.DATABASE_URL) return;

  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"|"$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocalIfNeeded();

function optionalEnv(value) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function databaseUrl({ migration = false } = {}) {
  if (migration) {
    return optionalEnv(process.env.DIRECT_DATABASE_URL) ?? databaseUrl();
  }

  const schema = optionalEnv(process.env.QUORUM_DB_SCHEMA);
  const directDatabaseUrl = optionalEnv(process.env.DIRECT_DATABASE_URL);

  if (schema && schema !== "public" && directDatabaseUrl) {
    return directDatabaseUrl;
  }

  return optionalEnv(process.env.DATABASE_URL) ?? DEFAULT_DATABASE_URL;
}

export function databaseSchema() {
  const schema = optionalEnv(process.env.QUORUM_DB_SCHEMA) ?? "public";

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
    throw new Error(
      "QUORUM_DB_SCHEMA must contain only letters, numbers, and underscores, and cannot start with a number.",
    );
  }

  return schema;
}

export function quoteIdentifier(identifier) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }

  return `"${identifier.replaceAll('"', '""')}"`;
}

export function redactDatabaseUrl(value) {
  try {
    const parsed = new URL(value);

    if (parsed.password) parsed.password = "REDACTED";
    if (parsed.username) parsed.username = parsed.username.replace(/.+/, "REDACTED");

    return parsed.toString();
  } catch {
    return "<invalid database url>";
  }
}

function shouldUseSsl(value) {
  const parsed = new URL(value);
  const hostname = parsed.hostname.toLowerCase();

  return (
    parsed.searchParams.get("sslmode") === "require" ||
    (!["localhost", "127.0.0.1", "::1"].includes(hostname) &&
      !hostname.endsWith(".local"))
  );
}

function poolConnectionString(value) {
  const parsed = new URL(value);

  if (parsed.searchParams.get("sslmode") === "require") {
    parsed.searchParams.delete("sslmode");
    parsed.searchParams.delete("uselibpqcompat");
    return parsed.toString();
  }

  return value;
}

export function createPool({ migration = false } = {}) {
  const connectionString = databaseUrl({ migration });

  return createPoolFromConnectionString(connectionString);
}

export function createPoolFromConnectionString(connectionString) {
  const ssl = shouldUseSsl(connectionString)
    ? { rejectUnauthorized: false }
    : undefined;

  return new Pool({
    connectionString: ssl ? poolConnectionString(connectionString) : connectionString,
    max: Number(process.env.QUORUM_DB_POOL_MAX ?? 10),
    ssl,
  });
}

export async function withClient(callback, options = {}) {
  const pool = createPool(options);
  const schema = databaseSchema();
  const client = await pool.connect();

  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(schema)}`);
    await client.query(`SET search_path TO ${quoteIdentifier(schema)}, public`);
    return await callback(client, { schema });
  } finally {
    client.release();
    await pool.end();
  }
}

export async function withTransaction(client, callback) {
  await client.query("BEGIN");

  try {
    const result = await callback();
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}
