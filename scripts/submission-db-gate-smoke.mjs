import { spawnSync } from "node:child_process";

const script = "scripts/submission-db-gate.mjs";

function runValidation(databaseUrl) {
  return spawnSync(process.execPath, [script, "--validate-url-only"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      QUORUM_RELEASE_DATABASE_URL: databaseUrl,
    },
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const local = runValidation(
  "postgresql://quorum:test@127.0.0.1:55432/quorum_release",
);
assert(local.status === 0, "localhost Postgres URL should be accepted");

const hosted = runValidation(
  "postgresql://quorum:test@db.example.supabase.co:5432/quorum_release",
);
assert(hosted.status !== 0, "hosted Postgres URL should be rejected");
assert(
  hosted.stderr.includes("only accepts localhost"),
  "hosted rejection should explain the localhost-only policy",
);

const invalidProtocol = runValidation(
  "https://127.0.0.1:55432/quorum_release",
);
assert(invalidProtocol.status !== 0, "non-Postgres URL should be rejected");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "accept-localhost-postgres",
        "reject-hosted-postgres",
        "reject-non-postgres-protocol",
      ],
    },
    null,
    2,
  ),
);
