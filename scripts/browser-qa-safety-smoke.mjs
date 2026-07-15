import { spawnSync } from "node:child_process";

const script = "scripts/browser-qa.mjs";

function runValidation(databaseUrl) {
  return spawnSync(process.execPath, [script, "--validate-database-only"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DIRECT_DATABASE_URL: databaseUrl,
    },
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const local = runValidation(
  "postgresql://quorum:test@127.0.0.1:55432/quorum_browser_qa",
);
assert(local.status === 0, "localhost Postgres URL should be accepted");
assert(
  local.stdout.includes('"databasePolicy": "localhost-only"'),
  "local validation should report the localhost-only policy",
);

const hosted = runValidation(
  "postgresql://quorum:test@db.example.supabase.co:5432/quorum_browser_qa",
);
assert(hosted.status !== 0, "hosted Postgres URL should be rejected");
assert(
  hosted.stderr.includes("only accepts localhost"),
  "hosted rejection should explain the localhost-only policy",
);

const invalidProtocol = runValidation(
  "https://127.0.0.1:55432/quorum_browser_qa",
);
assert(invalidProtocol.status !== 0, "non-Postgres URL should be rejected");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "accept-browser-qa-localhost-postgres",
        "reject-browser-qa-hosted-postgres",
        "reject-browser-qa-non-postgres-protocol",
      ],
    },
    null,
    2,
  ),
);
