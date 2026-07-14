import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPoolFromConnectionString,
  databaseSchema,
  databaseUrl,
  quoteIdentifier,
  redactDatabaseUrl,
} from "./postgres-utils.mjs";

const migrationsDirectory = path.join("db", "migrations");

export function repositoryMigrationFiles(projectRoot = process.cwd()) {
  return fs
    .readdirSync(path.join(projectRoot, migrationsDirectory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();
}

export function buildMigrationStatus({
  applied,
  connectionString = "<not connected>",
  expected,
  schema,
}) {
  const appliedSet = new Set(applied);
  const expectedSet = new Set(expected);
  const missing = expected.filter((filename) => !appliedSet.has(filename));
  const extra = applied.filter((filename) => !expectedSet.has(filename));

  return {
    ready: missing.length === 0 && extra.length === 0,
    schema,
    databaseUrl: redactDatabaseUrl(connectionString),
    expected,
    applied,
    missing,
    extra,
  };
}

export async function inspectMigrationStatus({
  connectionString = databaseUrl({ migration: true }),
  projectRoot = process.cwd(),
  schema = databaseSchema(),
} = {}) {
  const expected = repositoryMigrationFiles(projectRoot);
  const pool = createPoolFromConnectionString(connectionString);
  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN READ ONLY");

    const qualifiedTableName = `${quoteIdentifier(schema)}.${quoteIdentifier(
      "schema_migrations",
    )}`;
    const registry = await client.query(
      "SELECT to_regclass($1) AS table_name",
      [qualifiedTableName],
    );
    const applied = registry.rows[0]?.table_name
      ? (
          await client.query(
            `SELECT filename FROM ${qualifiedTableName} ORDER BY filename`,
          )
        ).rows.map((row) => row.filename)
      : [];

    return buildMigrationStatus({
      applied,
      connectionString,
      expected,
      schema,
    });
  } finally {
    if (client) {
      await client.query("ROLLBACK").catch(() => undefined);
      client.release();
    }
    await pool.end();
  }
}

function runSmoke() {
  const expected = ["0001_init.sql", "0002_evidence.sql"];
  const ready = buildMigrationStatus({
    applied: expected,
    expected,
    schema: "public",
  });
  const behind = buildMigrationStatus({
    applied: ["0001_init.sql"],
    expected,
    schema: "public",
  });
  const ahead = buildMigrationStatus({
    applied: [...expected, "0003_unknown.sql"],
    expected,
    schema: "public",
  });

  assert.equal(ready.ready, true);
  assert.deepEqual(ready.missing, []);
  assert.equal(behind.ready, false);
  assert.deepEqual(behind.missing, ["0002_evidence.sql"]);
  assert.equal(ahead.ready, false);
  assert.deepEqual(ahead.extra, ["0003_unknown.sql"]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "smoke",
        checks: [
          "accept-current-database-migrations",
          "detect-missing-database-migration",
          "detect-unexpected-database-migration",
        ],
      },
      null,
      2,
    ),
  );
}

async function runCli() {
  const status = await inspectMigrationStatus();
  console.log(JSON.stringify(status, null, 2));

  if (!status.ready) {
    process.exitCode = 1;
  }
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  const command = process.argv.includes("--smoke") ? runSmoke : runCli;

  Promise.resolve(command()).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
