import { spawnSync } from "node:child_process";

const listOnly = process.argv.includes("--list");
const validateOnly = process.argv.includes("--validate-url-only");
const maxOutputLength = 3_000;

const checks = [
  { id: "migrate", command: "npm", args: ["run", "db:migrate"] },
  { id: "seed", command: "npm", args: ["run", "db:seed"] },
  { id: "database-smoke", command: "npm", args: ["run", "db:smoke"] },
  { id: "demo-flow", command: "npm", args: ["run", "demo:smoke"] },
  { id: "wallet-auth", command: "npm", args: ["run", "wallet:auth:smoke"] },
  { id: "live-policy", command: "npm", args: ["run", "demo:live-policy"] },
  { id: "settlement-indexer", command: "npm", args: ["run", "settlement:smoke"] },
  { id: "live-flow", command: "npm", args: ["run", "live:flow:smoke"] },
  {
    id: "live-persistence",
    command: "npm",
    args: ["run", "live:persistence:smoke"],
  },
];

if (listOnly) {
  console.log(
    JSON.stringify(
      {
        mode: "list-only",
        databasePolicy: "localhost-only",
        checks,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

function validateLocalDatabaseUrl(rawUrl) {
  if (!rawUrl) {
    throw new Error(
      "Set QUORUM_RELEASE_DATABASE_URL to a disposable localhost Postgres database.",
    );
  }

  let parsed;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("QUORUM_RELEASE_DATABASE_URL must be a valid Postgres URL.");
  }

  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("QUORUM_RELEASE_DATABASE_URL must use postgres:// or postgresql://.");
  }

  const allowedHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);

  if (!allowedHosts.has(parsed.hostname)) {
    throw new Error(
      "Submission DB gate only accepts localhost. Hosted and production databases are rejected.",
    );
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));

  if (!databaseName) {
    throw new Error("QUORUM_RELEASE_DATABASE_URL must include a database name.");
  }

  return {
    databaseName,
    host: parsed.hostname,
    port: parsed.port || "5432",
  };
}

let target;

try {
  target = validateLocalDatabaseUrl(process.env.QUORUM_RELEASE_DATABASE_URL);
} catch (error) {
  console.error(
    `[submission-db-gate] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}

if (validateOnly) {
  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "validate-url-only",
        databasePolicy: "localhost-only",
        target,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

function sanitizeOutput(output) {
  const normalized = output
    .replace(/\x1b\[[0-9;]*m/g, "")
    .trim();

  if (normalized.length <= maxOutputLength) return normalized;
  return `${normalized.slice(0, maxOutputLength)}\n... [truncated]`;
}

const databaseUrl = process.env.QUORUM_RELEASE_DATABASE_URL;
const gateEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DEMO_SMOKE_PORT: "3135",
  DIRECT_DATABASE_URL: databaseUrl,
  LIVE_POLICY_SMOKE_PORT: "3136",
  NEXT_TELEMETRY_DISABLED: "1",
  NODE_ENV: "test",
  QUORUM_DB_SCHEMA: "public",
  WALLET_AUTH_SMOKE_PORT: "3142",
};
const results = [];

for (const check of checks) {
  const startedAt = Date.now();
  process.stderr.write(`[submission-db-gate] ${check.id}... `);
  const result = spawnSync(check.command, check.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: gateEnv,
    maxBuffer: 1024 * 1024 * 16,
    timeout: 10 * 60 * 1000,
  });
  const passed = result.status === 0;
  process.stderr.write(`${passed ? "PASS" : "FAIL"}\n`);
  results.push({
    id: check.id,
    command: [check.command, ...check.args].join(" "),
    status: passed ? "pass" : "fail",
    exitCode: result.status ?? 1,
    durationMs: Date.now() - startedAt,
    output: sanitizeOutput(`${result.stdout ?? ""}${result.stderr ?? ""}`),
  });
}

const failed = results.filter((result) => result.status === "fail");
const report = {
  ok: failed.length === 0,
  databasePolicy: "localhost-only",
  target,
  checks: results,
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exit(1);
}
