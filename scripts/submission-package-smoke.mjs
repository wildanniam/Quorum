import assert from "node:assert/strict";
import fs from "node:fs";

const currentHostedUrl = "https://quorum-sandy-eight.vercel.app";
const requiredDocs = [
  "README.md",
  "docs/HACKATHON_DEMO_RUNBOOK.md",
  "docs/HACKATHON_PROOF_INVENTORY.md",
  "docs/HACKATHON_SUBMISSION_RECOVERY_PLAN.md",
  "docs/HOSTED_RELEASE_EVIDENCE.json",
  "docs/MVP_READINESS.md",
  "docs/PRODUCTION_ENV_HANDOFF.md",
  "docs/BROWSER_QA.md",
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
const productionHandoff = read("docs/PRODUCTION_ENV_HANDOFF.md");
const browserQa = read("docs/BROWSER_QA.md");
const packageJson = JSON.parse(read("package.json"));
const liveEvidence = JSON.parse(read("docs/LIVE_TESTNET_EVIDENCE.json"));
const hostedReleaseEvidence = JSON.parse(
  read("docs/HOSTED_RELEASE_EVIDENCE.json"),
);

for (const document of [readme, inventory, readiness]) {
  assert.match(document, new RegExp(currentHostedUrl.replaceAll(".", "\\.")));
}

assert.match(inventory, /Historically live/);
assert.match(inventory, /Current hosted and healthy/i);
assert.match(inventory, /CRON_SECRET/);
assert.match(inventory, /provider approval/i);
assert.match(
  readiness,
  /hosted release[\s*]+operational and final browser QA complete; fresh transaction\/indexer evidence[\s*]+pending/i,
);
assert.match(browserQa, /Pages checked per viewport: `13`/);
assert.match(browserQa, /Viewports checked: `1440 x 900, 1024 x 768, 390 x 844`/);
assert.match(browserQa, /Console errors: none observed/);
assert.match(browserQa, /Horizontal overflow: none observed/);
assert.match(browserQa, /Missing required text: none observed/);
assert.doesNotMatch(readiness, /final browser QA (?:is still|required|and final QA) pending/i);
assert.doesNotMatch(inventory, /browser QA.*must be regenerated/i);
assert.match(readiness, /not mainnet production software/i);
assert.match(runbook, /Open `\/`\./);
assert.match(runbook, /Open `\/discover`/);
assert.match(runbook, /Do not promise pickup/i);
assert.match(recovery, /Production migration status is ready/i);
assert.match(recovery, /Three authenticated runs completed without error/i);
assert.match(recovery, /complete non-destructive source check list/i);
assert.doesNotMatch(recovery, /all \d+ non-destructive source checks/i);
assert.match(recovery, /github\.com\/wildanniam\/Quorum\/pull\/91/);
assert.match(recovery, /github\.com\/wildanniam\/Quorum\/pull\/94/);
assert.match(recovery, /39 checked states/i);
assert.match(readiness, /Recovery PRs #75 through #94 are merged/i);
assert.match(readme, /Three successful hosted indexer runs/i);
assert.match(
  productionHandoff,
  /https:\/\/quorum-sandy-eight\.vercel\.app/,
);
assert.match(productionHandoff, /migrations `0001` through `0005`/i);
assert.match(productionHandoff, /Three successful cursor-advancing runs/i);
assert.doesNotMatch(productionHandoff, /External setup still required/i);
assert.equal(
  packageJson.scripts?.["readiness:final"],
  "node scripts/readiness-audit.mjs --require-fresh-evidence --require-current-origin-evidence",
);
assert.equal(
  packageJson.scripts?.["live:evidence:audit:current"],
  "node scripts/live-evidence-audit.mjs docs/LIVE_TESTNET_EVIDENCE.json --require-filled --require-current-origin --expected-origin=https://quorum-sandy-eight.vercel.app",
);
assert.equal(
  packageJson.scripts?.["live:evidence:network"],
  "node scripts/live-evidence-network-validate.mjs docs/LIVE_TESTNET_EVIDENCE.json",
);
assert.match(readme, /readiness:final/);
assert.match(readme, /live:evidence:audit:current/);
assert.match(readme, /live:evidence:network/);
assert.match(runbook, /readiness:final/);
assert.match(runbook, /live:evidence:audit:current/);
assert.match(runbook, /live:evidence:network/);
assert.match(inventory, /live:evidence:network/);
assert.match(readiness, /live:evidence:network/);
assert.equal(
  packageJson.scripts?.["submission:hosted:probe"],
  "node scripts/hosted-readiness-probe.mjs",
);
assert.equal(
  packageJson.scripts?.["submission:gate"],
  "node scripts/submission-gate.mjs",
);

assert.equal(hostedReleaseEvidence.schemaVersion, 1);
assert.equal(hostedReleaseEvidence.network, "TESTNET");
assert.match(hostedReleaseEvidence.release.gitCommit, /^[0-9a-f]{40}$/);
assert.equal(hostedReleaseEvidence.release.deploymentStatus, "READY");
assert.equal(hostedReleaseEvidence.release.publicUrl, currentHostedUrl);
assert.match(hostedReleaseEvidence.release.deploymentUrl, /^https:\/\//);
assert.match(hostedReleaseEvidence.release.scope, /immutable operational checkpoint/i);
assert.ok(
  Date.parse(hostedReleaseEvidence.capturedAt) >=
    Date.parse(hostedReleaseEvidence.release.deploymentCreatedAt),
  "Hosted release evidence must be captured after deployment creation.",
);

const expectedMigrations = [
  "0001_initial_schema.sql",
  "0002_live_proof_uniqueness.sql",
  "0003_indexer_evidence_ledger.sql",
  "0004_anchor_payouts.sql",
  "0005_anchor_cashout_proof.sql",
];

assert.deepEqual(hostedReleaseEvidence.database.expectedMigrations, expectedMigrations);
assert.deepEqual(hostedReleaseEvidence.database.appliedMigrations, expectedMigrations);
assert.deepEqual(hostedReleaseEvidence.database.missingMigrations, []);
assert.deepEqual(hostedReleaseEvidence.database.extraMigrations, []);
assert.equal(hostedReleaseEvidence.database.ready, true);

assert.deepEqual(hostedReleaseEvidence.hostedProbe.routes, {
  "/": 200,
  "/discover": 200,
  "/.well-known/stellar.toml": 200,
  "/api/contracts/status": 200,
  "/evidence": 200,
});
assert.equal(hostedReleaseEvidence.hostedProbe.contractsConfigured, true);
assert.equal(hostedReleaseEvidence.hostedProbe.paymentAssetConfigured, true);
assert.equal(hostedReleaseEvidence.hostedProbe.proofMode, "live");
assert.equal(hostedReleaseEvidence.hostedProbe.rpcReachable, true);
assert.equal(hostedReleaseEvidence.hostedProbe.evidenceHealthy, true);
assert.equal(hostedReleaseEvidence.hostedProbe.evidenceDegraded, false);
assert.equal(hostedReleaseEvidence.hostedProbe.currentOriginEvidenceProven, false);

const hostedIndexer = hostedReleaseEvidence.hostedIndexer;
assert.equal(hostedIndexer.cronSchedule, "0 3 * * *");
assert.deepEqual(hostedIndexer.cronSecretConfiguredFor, ["Preview", "Production"]);
assert.equal(hostedIndexer.cronSecretStoredAsSensitive, true);
assert.equal(hostedIndexer.cronSecretValueRecorded, false);
assert.equal(hostedIndexer.missingAuthorizationHttpStatus, 401);
assert.ok(hostedIndexer.runs.length >= 2);

for (const run of hostedIndexer.runs) {
  assert.match(run.cursor, /^\d+-\d+$/);
  assert.ok(Number.isInteger(run.latestLedger) && run.latestLedger > 0);
  assert.ok(Number.isInteger(run.fetchedCount) && run.fetchedCount >= 0);
  assert.ok(Number.isInteger(run.insertedCount) && run.insertedCount >= 0);
  assert.equal(run.lastError, null);
  assert.ok(Date.parse(run.finishedAt) >= Date.parse(run.startedAt));
}

const cursorLedger = (cursor) => BigInt(cursor.split("-")[0]);

for (let index = 1; index < hostedIndexer.runs.length; index += 1) {
  const previousRun = hostedIndexer.runs[index - 1];
  const currentRun = hostedIndexer.runs[index];

  assert.ok(cursorLedger(currentRun.cursor) > cursorLedger(previousRun.cursor));
  assert.ok(currentRun.latestLedger > previousRun.latestLedger);
}

const latestHostedRun = hostedIndexer.runs.at(-1);
assert.equal(latestHostedRun.cursor, "0015135902837768191-4294967295");
assert.equal(latestHostedRun.latestLedger, 3614066);
assert.equal(latestHostedRun.trigger, "Vercel Cron");
assert.equal(hostedIndexer.cursorAdvanced, true);
assert.equal(hostedIndexer.latestLedgerAdvanced, true);
assert.equal(hostedIndexer.freshQuorumEventsIndexed, false);
assert.match(hostedIndexer.freshEventRequirement, /wallet-signed testnet flow/i);

assert.deepEqual(hostedReleaseEvidence.externalBoundaries, {
  freshFreighterFlowComplete: false,
  finalBrowserQaComplete: false,
  moneyGramProviderApproved: false,
  moneyGramPickupProven: false,
  finalHackathonSubmissionComplete: false,
});

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
        "hosted-release-evidence-shape",
        "indexer-secret-non-disclosure",
        "indexer-monotonic-progress",
        "moneygram-provider-disclosure",
        "judge-runbook-route-wiring",
        "final-browser-qa-current",
        "reject-stale-deployment-claims",
      ],
    },
    null,
    2,
  ),
);
