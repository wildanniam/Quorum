import { spawnSync } from "node:child_process";

const listOnly = process.argv.includes("--list");
const maxOutputLength = 3_000;

const checks = [
  { id: "lint", command: "npm", args: ["run", "lint"] },
  { id: "build", command: "npm", args: ["run", "build"] },
  {
    id: "dependency-audit",
    command: "npm",
    args: ["audit", "--audit-level=moderate"],
  },
  {
    id: "migration-status-unit",
    command: "npm",
    args: ["run", "db:migrations:status:smoke"],
  },
  {
    id: "event-lifecycle",
    command: "npm",
    args: ["run", "event:lifecycle:smoke"],
  },
  {
    id: "product-messaging",
    command: "npm",
    args: ["run", "product:messaging:smoke"],
  },
  { id: "api-origin", command: "npm", args: ["run", "api:origin:smoke"] },
  {
    id: "anchor-config",
    command: "npm",
    args: ["run", "anchor:config:smoke"],
  },
  {
    id: "anchor-eligibility",
    command: "npm",
    args: ["run", "anchor:eligibility:smoke"],
  },
  { id: "anchor-sep1", command: "npm", args: ["run", "anchor:sep1:smoke"] },
  { id: "anchor-sep10", command: "npm", args: ["run", "anchor:sep10:smoke"] },
  { id: "anchor-sep24", command: "npm", args: ["run", "anchor:sep24:smoke"] },
  {
    id: "anchor-status-sync",
    command: "npm",
    args: ["run", "anchor:status:smoke"],
  },
  {
    id: "indexer-security",
    command: "npm",
    args: ["run", "indexer:security:smoke"],
  },
  {
    id: "deploy-env",
    command: "npm",
    args: ["run", "deploy:env:smoke"],
  },
  {
    id: "hosted-preflight-unit",
    command: "npm",
    args: ["run", "deploy:hosted:preflight:smoke"],
  },
  { id: "live-args", command: "npm", args: ["run", "live:args:smoke"] },
  {
    id: "live-preflight",
    command: "npm",
    args: ["run", "live:preflight:smoke"],
  },
  {
    id: "live-readiness",
    command: "npm",
    args: ["run", "live:readiness:smoke"],
  },
  {
    id: "live-signing-adapter",
    command: "npm",
    args: ["run", "live:signing:smoke"],
  },
  {
    id: "live-submission-boundary",
    command: "npm",
    args: ["run", "live:submission:smoke"],
  },
  { id: "live-xdr", command: "npm", args: ["run", "live:xdr:smoke"] },
  {
    id: "live-browser-helper",
    command: "npm",
    args: ["run", "live:browser-flow:smoke"],
  },
  {
    id: "live-ui-wiring",
    command: "npm",
    args: ["run", "live:ui-wiring:smoke"],
  },
  {
    id: "live-evidence-template",
    command: "npm",
    args: ["run", "live:evidence:template"],
  },
  {
    id: "live-evidence-audit-unit",
    command: "npm",
    args: ["run", "live:evidence:audit:smoke"],
  },
  {
    id: "historical-live-evidence-shape",
    command: "npm",
    args: ["run", "live:evidence:audit"],
  },
  {
    id: "deployment-evidence-read-only",
    command: "npm",
    args: ["run", "live:deployment:validate"],
  },
  {
    id: "contract-tests",
    command: "npm",
    args: ["run", "contracts:test"],
  },
  {
    id: "contract-build",
    command: "npm",
    args: ["run", "contracts:build"],
  },
  {
    id: "contract-approval-guards",
    command: "npm",
    args: ["run", "contracts:approval:smoke"],
  },
  {
    id: "contract-doctor-read-only",
    command: "npm",
    args: ["run", "contracts:doctor"],
  },
  {
    id: "isolated-db-gate-guard",
    command: "npm",
    args: ["run", "submission:db:gate:smoke"],
  },
  {
    id: "submission-package",
    command: "npm",
    args: ["run", "submission:package:smoke"],
  },
  {
    id: "hosted-read-only",
    command: "npm",
    args: ["run", "submission:hosted:probe"],
  },
  {
    id: "source-readiness",
    command: "npm",
    args: ["run", "readiness:audit"],
  },
];

const forbiddenScriptNames = [
  "browser:qa",
  "contracts:deploy:testnet",
  "contracts:init:testnet",
  "db:migrate",
  "db:seed",
  "db:smoke",
  "demo:live-policy",
  "demo:smoke",
  "evidence:local",
  "indexer:run",
  "live:flow:smoke",
  "live:persistence:smoke",
  "settlement:smoke",
  "wallet:auth:smoke",
];

const commandLines = checks.map((check) =>
  [check.command, ...check.args].join(" "),
);

for (const forbidden of forbiddenScriptNames) {
  if (commandLines.some((commandLine) => commandLine.includes(`run ${forbidden}`))) {
    throw new Error(`Submission gate includes forbidden command: ${forbidden}`);
  }
}

if (listOnly) {
  console.log(
    JSON.stringify(
      {
        mode: "list-only",
        checks: checks.map(({ id, command, args }) => ({ id, command, args })),
        excludedCheckpoints: forbiddenScriptNames,
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

const results = [];

for (const check of checks) {
  const startedAt = Date.now();
  process.stderr.write(`[submission-gate] ${check.id}... `);
  const result = spawnSync(check.command, check.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
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
  autonomousSourceReady: failed.length === 0,
  finalSubmissionReady: false,
  checks: results,
  excludedCheckpoints: [
    {
      id: "isolated-db-integration",
      reason:
        "Run submission:db:gate separately with QUORUM_RELEASE_DATABASE_URL pointing to disposable localhost Postgres.",
    },
    {
      id: "browser-qa",
      reason:
        "Fresh desktop/tablet/mobile evidence needs the user-approved browser workflow and an isolated database.",
    },
    {
      id: "fresh-hosted-indexing",
      reason:
        "Hosted indexer auth and cursor progress are proven; fresh rows require an approved signed flow first.",
    },
    {
      id: "current-origin-testnet-evidence",
      reason: "Freighter signing must be approved manually for each testnet action.",
    },
    {
      id: "moneygram-provider",
      reason:
        "MoneyGram allowlist approval, live SEP-10 auth, and provider execution are external.",
    },
    {
      id: "final-release-and-submit",
      reason:
        "Final deployment verification and hackathon submission remain explicit checkpoints.",
    },
  ],
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exit(1);
}
