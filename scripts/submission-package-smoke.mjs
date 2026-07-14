import assert from "node:assert/strict";
import fs from "node:fs";

const currentHostedUrl = "https://quorum-sandy-eight.vercel.app";
const requiredDocs = [
  "README.md",
  "docs/HACKATHON_DEMO_RUNBOOK.md",
  "docs/HACKATHON_PROOF_INVENTORY.md",
  "docs/HACKATHON_SUBMISSION_RECOVERY_PLAN.md",
  "docs/MVP_READINESS.md",
  "docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json",
  "docs/LIVE_TESTNET_EVIDENCE.json",
];

for (const file of requiredDocs) {
  assert.ok(fs.existsSync(file), `Missing submission artifact: ${file}`);
}

const read = (file) => fs.readFileSync(file, "utf8");
const readme = read("README.md");
const runbook = read("docs/HACKATHON_DEMO_RUNBOOK.md");
const inventory = read("docs/HACKATHON_PROOF_INVENTORY.md");
const readiness = read("docs/MVP_READINESS.md");
const recovery = read("docs/HACKATHON_SUBMISSION_RECOVERY_PLAN.md");
const packageJson = JSON.parse(read("package.json"));
const liveEvidence = JSON.parse(read("docs/LIVE_TESTNET_EVIDENCE.json"));

for (const document of [readme, inventory, readiness]) {
  assert.match(document, new RegExp(currentHostedUrl.replaceAll(".", "\\.")));
}

assert.match(inventory, /Historically live/);
assert.match(inventory, /currently degraded in production/i);
assert.match(inventory, /CRON_SECRET/);
assert.match(inventory, /provider approval/i);
assert.match(readiness, /candidate code ready; hosted evidence pending/i);
assert.match(readiness, /not mainnet production software/i);
assert.match(runbook, /Open `\/`\./);
assert.match(runbook, /Open `\/discover`/);
assert.match(runbook, /Do not promise pickup/i);
assert.match(recovery, /Production migration `0005`/);
assert.equal(
  packageJson.scripts?.["readiness:final"],
  "node scripts/readiness-audit.mjs --require-fresh-evidence",
);
assert.match(readme, /readiness:final/);
assert.match(runbook, /readiness:final/);

assert.doesNotMatch(readme, /Vercel project\/env configuration;/);
assert.doesNotMatch(readme, /public live evidence page/);
assert.doesNotMatch(runbook, /Open `\/`\.\s*Show the paid APAC event/);
assert.doesNotMatch(readiness, /\| App is deployed \| Gated \|/);

assert.match(liveEvidence.hostedAppUrl, /ngrok-free\.dev$/);
assert.match(inventory, /historical/i);
assert.match(inventory, /ngrok/i);
assert.notEqual(liveEvidence.hostedAppUrl, currentHostedUrl);

const routeFiles = [
  "src/app/page.tsx",
  "src/app/discover/page.tsx",
  "src/app/events/[slug]/page.tsx",
  "src/app/events/[slug]/checkout/page.tsx",
  "src/app/events/[slug]/proof/page.tsx",
  "src/app/events/[slug]/resources/page.tsx",
  "src/app/passes/[tokenId]/page.tsx",
  "src/app/dashboard/ledger/page.tsx",
  "src/app/api/contracts/status/route.ts",
];

for (const file of routeFiles) {
  assert.ok(fs.existsSync(file), `Runbook route has no implementation: ${file}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "required-submission-artifacts",
        "current-hosted-url",
        "historical-live-evidence-label",
        "production-migration-disclosure",
        "indexer-secret-disclosure",
        "moneygram-provider-disclosure",
        "judge-runbook-route-wiring",
        "reject-stale-deployment-claims",
      ],
    },
    null,
    2,
  ),
);
