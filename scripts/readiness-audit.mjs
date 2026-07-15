import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  listOnlyGeneratedFiles,
  resolveEvidenceSourceCandidates,
} from "./evidence-lineage.mjs";

const projectRoot = process.cwd();
const allowDirtyEvidence = process.argv.includes("--allow-dirty-evidence");
const requireFreshEvidence = process.argv.includes("--require-fresh-evidence");
const generatedDocs = ["docs/BROWSER_QA.md", "docs/DEMO_EVIDENCE.md"];

const requiredFiles = [
  ".env.example",
  "TECHNICAL_SPEC.md",
  "DEVELOPMENT_PLAN.md",
  "README.md",
  "docs/BROWSER_QA.md",
  "docs/CONTRACT_DEPLOYMENT.md",
  "docs/DEMO_EVIDENCE.md",
  "docs/HACKATHON_DEMO_RUNBOOK.md",
  "docs/HACKATHON_PROOF_INVENTORY.md",
  "docs/HACKATHON_SUBMISSION_RECOVERY_PLAN.md",
  "docs/HOSTED_RELEASE_EVIDENCE.json",
  "docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json",
  "docs/LIVE_SIGNING_HANDOFF.md",
  "docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md",
  "docs/LIVE_TESTNET_EVIDENCE.example.json",
  "docs/MVP_READINESS.md",
  "docs/PR_2_3_5_COMPLETION.md",
  "docs/PRODUCTION_ENV_HANDOFF.md",
  "docs/QUORUM_PM_GOAL_BRIEF.md",
  "docs/SOROBAN_SPIKE.md",
  "db/migrations/0003_indexer_evidence_ledger.sql",
  "db/migrations/0002_live_proof_uniqueness.sql",
  "db/migrations/0005_anchor_cashout_proof.sql",
  "scripts/settlement-smoke.ts",
  "scripts/event-lifecycle-smoke.ts",
  "scripts/product-messaging-smoke.ts",
  "scripts/anchor-payout-eligibility-smoke.ts",
  "scripts/submission-package-smoke.mjs",
  "scripts/hosted-readiness-probe.mjs",
  "scripts/submission-db-gate.mjs",
  "scripts/submission-db-gate-smoke.mjs",
  "scripts/browser-qa-safety-smoke.mjs",
  "scripts/evidence-lineage.mjs",
  "scripts/evidence-lineage-smoke.mjs",
  "scripts/submission-gate.mjs",
  "scripts/stellar-indexer-run.ts",
  "scripts/indexer-security-smoke.ts",
  "scripts/mutation-origin-smoke.ts",
  "scripts/live-args-smoke.ts",
  "scripts/live-browser-flow-smoke.ts",
  "scripts/live-evidence-audit.mjs",
  "scripts/live-evidence-audit-smoke.mjs",
  "scripts/live-deployment-validate.mjs",
  "scripts/live-flow-smoke.ts",
  "scripts/hosted-deployment-preflight.ts",
  "scripts/db-migration-status.mjs",
  "scripts/live-persistence-smoke.ts",
  "scripts/live-preflight-smoke.ts",
  "scripts/live-readiness-smoke.ts",
  "scripts/live-signing-smoke.ts",
  "scripts/live-submission-smoke.ts",
  "scripts/live-ui-wiring-smoke.mjs",
  "scripts/live-xdr-smoke.ts",
  "scripts/wallet-auth-smoke.mjs",
  "scripts/contracts/contract-cli-output.mjs",
  "scripts/contracts/live-signing-approval.mjs",
  "scripts/contracts/live-signing-approval-smoke.mjs",
  "scripts/contracts/platform-fee-policy.mjs",
  "scripts/contracts/testnet-network-guard.mjs",
  "scripts/deploy-env-smoke.ts",
  "src/lib/auth/origin.ts",
  "src/lib/anchor/payout-eligibility.ts",
  "src/lib/capability-presentation.ts",
  "src/lib/stellar/freighter-live-signing.ts",
  "src/lib/stellar/live-action.ts",
  "src/lib/stellar/live-encoding.ts",
  "src/lib/stellar/live-browser-flow.ts",
  "src/lib/stellar/live-flow.ts",
  "src/lib/stellar/live-result-persistence.ts",
  "src/lib/stellar/live-preflight.ts",
  "src/lib/stellar/live-submission.ts",
  "src/lib/stellar/live-xdr.ts",
  "src/app/api/events/[eventId]/contract-action/preflight/route.ts",
];

const requiredPackageScripts = [
  "build",
  "contracts:build",
  "contracts:approval:smoke",
  "contracts:deploy:testnet",
  "contracts:doctor",
  "contracts:init:testnet",
  "contracts:test",
  "db:migrate",
  "db:migrations:status",
  "db:migrations:status:smoke",
  "db:seed",
  "db:smoke",
  "api:origin:smoke",
  "demo:live-policy",
  "demo:smoke",
  "event:lifecycle:smoke",
  "product:messaging:smoke",
  "anchor:config:smoke",
  "anchor:eligibility:smoke",
  "anchor:sep10:smoke",
  "anchor:sep10:live",
  "deploy:env:smoke",
  "deploy:hosted:preflight",
  "deploy:hosted:preflight:smoke",
  "browser:qa",
  "browser:qa:safety:smoke",
  "evidence:local",
  "evidence:lineage:smoke",
  "lint",
  "live:args:smoke",
  "live:browser-flow:smoke",
  "live:evidence:audit",
  "live:evidence:audit:smoke",
  "live:evidence:template",
  "live:deployment:validate",
  "live:flow:smoke",
  "live:persistence:smoke",
  "live:preflight:smoke",
  "live:readiness:smoke",
  "live:signing:smoke",
  "live:submission:smoke",
  "live:ui-wiring:smoke",
  "live:xdr:smoke",
  "readiness:audit",
  "readiness:final",
  "submission:package:smoke",
  "submission:db:gate",
  "submission:db:gate:smoke",
  "submission:hosted:probe",
  "submission:gate",
  "settlement:smoke",
  "indexer:run",
  "indexer:security:smoke",
  "wallet:auth:smoke",
];

const requiredEvidenceChecks = [
  "DB migrate",
  "DB seed",
  "DB smoke",
  "Lint",
  "Build",
  "Audit",
  "Wallet auth smoke",
  "API origin smoke",
  "Demo smoke",
  "Event lifecycle smoke",
  "Product messaging smoke",
  "Anchor config smoke",
  "Anchor eligibility smoke",
  "Live policy smoke",
  "Settlement smoke",
  "Indexer security smoke",
  "Browser QA",
  "Evidence lineage smoke",
  "Deploy env smoke",
  "Deploy hosted preflight smoke",
  "Live args smoke",
  "Live browser flow smoke",
  "Live deployment validation",
  "Live evidence audit smoke",
  "Live evidence template",
  "Live flow smoke",
  "Live persistence smoke",
  "Live preflight smoke",
  "Live readiness smoke",
  "Live signing smoke",
  "Live submission smoke",
  "Live UI wiring smoke",
  "Live XDR smoke",
  "Contract tests",
  "Contract build",
  "Contract approval smoke",
  "Contract doctor",
  "Submission package smoke",
];

const requiredSmokeCoverage = [
  "marketplace",
  "event-detail",
  "draft-validation",
  "publish-lifecycle",
  "contract-status",
  "payment-asset-status",
  "contract-action-policy",
  "checkout",
  "duplicate-checkout-guard",
  "free-claim",
  "duplicate-free-claim-guard",
  "resource-gating",
  "organizer-check-in",
  "duplicate-check-in-guard",
  "proof-labels",
  "collaborator-withdraw",
  "duplicate-withdraw-guard",
  "pass-page",
  "dashboard-proof",
  "dashboard-payment-asset-readiness",
  "dashboard-action-policy",
];

const requiredDbSmokeCoverage = [
  "unique-live-proof-indexes",
  "live-proof-hash-registry",
  "indexer-tables",
  "anchor-cashout-proof-column",
  "anchor-cashout-proof-index",
  "event-crud",
  "collaborator-split-total",
  "resource-crud",
  "cascade-cleanup",
];

const requiredWalletAuthCoverage = [
  "reject-invalid-wallet-challenge-request",
  "issue-wallet-bound-challenge-cookie",
  "encode-multiline-challenge-cookie",
  "verify-signed-wallet-challenge",
  "set-wallet-session-cookie",
  "me-reads-wallet-session",
  "logout-clears-wallet-session",
];

const requiredApiOriginCoverage = [
  "allow-same-origin-mutation",
  "allow-missing-origin-mutation",
  "allow-forwarded-same-origin-mutation",
  "reject-cross-origin-mutation",
  "reject-invalid-origin-mutation",
  "all-mutation-routes-use-origin-guard",
];

const requiredLiveFlowCoverage = [
  "publish-live-flow",
  "checkout-live-flow",
  "free-claim-live-flow",
  "check-in-live-flow",
  "withdraw-live-flow",
  "decode-token-id-from-finality",
  "decode-withdraw-amount-from-finality",
  "persist-live-result-helper",
  "reject-mismatched-live-result",
  "reject-finality-failure-without-persistence",
];

const requiredLivePersistenceCoverage = [
  "record-live-publish",
  "record-live-pass",
  "record-live-check-in",
  "record-live-withdrawal",
  "reject-stub-live-hash",
  "reject-duplicate-live-publish-tx",
  "reject-duplicate-live-pass-tx",
  "reject-cross-table-live-hash-replay",
  "reject-duplicate-live-check-in",
  "reject-duplicate-live-check-in-tx",
  "reject-live-withdrawal-overdraw",
  "reject-duplicate-live-withdrawal-tx",
  "no-stub-live-records",
];

const requiredSettlementCoverage = [
  "indexer-schema",
  "indexer-idempotent-ingest",
  "indexer-state-cursor",
  "indexer-failure-preserves-state",
  "indexer-latest-ledger-monotonic",
  "indexer-concurrent-run-lock",
  "indexer-rejects-unconfigured-contract",
  "global-event-evidence-read-model",
  "event-proof-filter",
  "stellar-explorer-links",
  "collaborator-credit-ledger",
  "collaborator-debit-ledger",
  "collaborator-withdrawable-balance",
];

const requiredIndexerSecurityCoverage = [
  "reject-missing-indexer-cron-secret",
  "reject-weak-indexer-cron-secret",
  "reject-invalid-indexer-bearer",
  "accept-valid-indexer-bearer",
  "reject-indexer-cron-secret-line-breaks",
  "validate-indexer-run-parameters",
  "preserve-monotonic-indexer-checkpoint",
  "indexer-route-fails-closed",
  "indexer-route-rejects-invalid-query",
];

const requiredLivePolicyCoverage = [
  "preflight-route-invalid-request",
  "submit-invalid-signed-xdr-no-persistence",
  "check-in-short-live-token-required",
];

const requiredLiveSigningCoverage = [
  "reject-prepared-xdr-function-mismatch-before-wallet",
  "reject-prepared-xdr-contract-mismatch-before-wallet",
  "reject-prepared-xdr-argument-mismatch-before-wallet",
  "reject-signed-xdr-function-mismatch",
  "reject-signed-xdr-argument-mismatch",
];

const requiredLiveSubmissionCoverage = [
  "accept-duplicate-submission-status",
  "reject-source-mismatch-before-rpc",
  "reject-function-mismatch-before-rpc",
  "reject-contract-mismatch-before-rpc",
  "reject-argument-mismatch-before-rpc",
];

const requiredLiveReadinessCoverage = [
  "accept-testnet-live-readiness",
  "reject-non-testnet-live-readiness",
  "reject-mismatched-testnet-passphrase",
];

const requiredLiveBrowserCoverage = [
  "browser-live-preflight-sign-submit",
  "browser-live-signer-options",
  "browser-live-submit-signed-xdr",
  "browser-live-preflight-error",
  "browser-live-submit-error",
  "browser-live-reject-mismatched-preflight",
  "browser-live-reject-mismatched-preflight-args",
];

const requiredLiveUiCoverage = [
  "browser-helper-preflight-submit-routes",
  "publish-live-ui-wiring",
  "checkout-live-ui-wiring",
  "check-in-live-ui-wiring",
  "withdraw-live-ui-wiring",
];

const requiredContractCoverage = [
  "emits_core_and_pass_proof_events",
  "set_core_emits_event",
];

const requiredContractApprovalCoverage = [
  "approval-helper-default-deny",
  "approval-helper-exact-phrase",
  "fee-policy-helper-default-deny",
  "fee-policy-helper-exact-phrase",
  "parse-contract-id-from-cli-output",
  "reject-invalid-contract-deploy-output",
  "deploy-script-denies-without-live-approval",
  "init-script-denies-without-live-approval",
  "deploy-script-denies-non-testnet-network",
  "init-script-denies-non-testnet-network",
  "doctor-blocks-non-testnet-network",
  "init-script-denies-nonzero-fee-without-approval",
  "doctor-blocks-nonzero-fee-without-approval",
];

const requiredDeployEnvCoverage = [
  "reject-missing-production-session-secret",
  "reject-placeholder-production-session-secret",
  "reject-local-fallback-production-session-secret",
  "reject-short-production-session-secret",
  "accept-valid-production-session-secret",
  "reject-extra-segment-session-token",
  "reject-invalid-session-wallet",
  "reject-expired-session-token",
  "reject-future-session-token",
  "accept-current-wallet-bound-challenge",
  "reject-expired-wallet-challenge",
  "reject-future-wallet-challenge",
  "reject-wallet-mismatched-challenge",
  "reject-malformed-wallet-challenge",
];

const requiredLiveEvidenceAuditCoverage = [
  "accept-filled-live-evidence",
  "reject-filled-live-evidence-placeholder",
  "reject-filled-live-evidence-local-url",
  "reject-filled-live-evidence-duplicate-tx",
  "reject-filled-live-evidence-token-mismatch",
  "reject-filled-live-evidence-origin-mismatch",
  "reject-filled-live-evidence-duplicate-publish-url",
  "reject-filled-live-evidence-zero-withdraw",
];

const requiredHostedPreflightCoverage = [
  "hosted-url-public-https",
  "production-session-secret-present",
  "server-postgres-database-url-present",
  "database-migrations-current",
  "hosted-indexer-cron-secret-ready",
  "runtime-env-matches-deployment-evidence",
  "operator-signing-env-absent",
  "browser-supabase-env-absent",
  "contract-status-live-proof-mode",
  "contract-status-rpc-reachable",
  "contract-status-actions-live-required",
  "reject-localhost-hosted-url",
  "reject-contract-id-mismatch",
  "reject-operator-signing-env",
  "reject-invalid-production-session-secret",
  "reject-missing-indexer-cron-secret",
  "reject-weak-indexer-cron-secret",
  "reject-non-postgres-database-url",
  "reject-hosted-postgres-url-without-sslmode",
  "reject-browser-supabase-env",
  "reject-supabase-service-role-env",
  "reject-local-contract-status",
  "reject-non-live-action-policy",
  "reject-missing-database-migration",
];

const requiredLiveDeploymentValidationCoverage = [
  "static-evidence-shape",
  "horizon-admin-transaction-window",
  "decoded-init-and-set-core-parameters",
  "rpc-set-core-event",
  "stellar-cli-contract-interfaces",
  "recorded-read-only-validation-evidence",
];

const requiredLiveHandoffTerms = [
  "explicitly approves",
  "STELLAR_ACCOUNT",
  "QUORUM_SESSION_SECRET",
  "QUORUM_LIVE_SIGNING_APPROVED",
  "I_APPROVE_TESTNET_SIGNING",
  "Freighter",
  "NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID",
  "non-testnet",
  "Acceptance Evidence For Live Mode",
  "Partial live mode must not mix live IDs with local proof writes",
  "sourceSequence",
  "live-flow.ts",
  "live-result-persistence.ts",
  "live-preflight.ts",
  "recordLivePublishedEvent",
  "recordLivePass",
  "recordLiveCheckIn",
  "recordLiveWithdrawal",
  "freighter-live-signing.ts",
  "live-submission.ts",
  "return value decoding",
  "atomic-to-decimal",
  "LIVE_TESTNET_EVIDENCE.example.json",
  "live:evidence:audit",
  "passInitTxHash",
  "passSetCoreTxHash",
  "contract-action/preflight",
  "live-browser-flow.ts",
  "executeLiveBrowserContractAction",
];

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function run(command, args) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function runJson(command, args) {
  const output = run(command, args);
  const first = output.indexOf("{");
  const last = output.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) {
    throw new Error(`${command} ${args.join(" ")} did not emit JSON.`);
  }

  return JSON.parse(output.slice(first, last + 1));
}

function git(args) {
  return run("git", args);
}

function listOnlyEvidenceFile(output) {
  const entries = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return listOnlyGeneratedFiles(entries, generatedDocs);
}

function expectedEvidenceCommits() {
  const head = git(["rev-parse", "--short", "HEAD"]);

  return resolveEvidenceSourceCandidates({
    head,
    generatedDocs,
    parentsOf(commit) {
      const parts = git(["rev-list", "--parents", "-n", "1", commit]).split(
        /\s+/,
      );
      return parts
        .slice(1)
        .map((parent) => git(["rev-parse", "--short", parent]));
    },
    changedFilesOf(commit) {
      return git([
        "diff-tree",
        "--no-commit-id",
        "--name-only",
        "-r",
        commit,
      ])
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    },
  });
}

function checkWorkingTree() {
  const status = git(["status", "--short"]);

  if (!status) return;

  if (allowDirtyEvidence && listOnlyEvidenceFile(status)) {
    warn("Working tree has only generated QA/evidence docs pending.");
    return;
  }

  fail(`Working tree is not clean:\n${status}`);
}

function checkRequiredFiles() {
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(projectRoot, file))) {
      fail(`Required file is missing: ${file}`);
    }
  }
}

function checkEnvExample() {
  const envExample = readFile(".env.example");
  const requiredEnvExampleTerms = [
    "DATABASE_URL",
    "DIRECT_DATABASE_URL",
    "QUORUM_DB_SCHEMA",
    "QUORUM_SESSION_SECRET",
    "NEXT_PUBLIC_STELLAR_NETWORK",
    "NEXT_PUBLIC_STELLAR_RPC_URL",
    "NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE",
    "NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID",
    "NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID",
    "NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID",
    "STELLAR_NETWORK",
    "STELLAR_ACCOUNT",
    "QUORUM_LIVE_SIGNING_APPROVED",
    "ADMIN_ADDRESS",
    "QUORUM_PLATFORM_FEE_BPS",
    "QUORUM_NONZERO_PLATFORM_FEE_APPROVED",
  ];

  for (const term of requiredEnvExampleTerms) {
    if (!envExample.includes(term)) {
      fail(`.env.example is missing ${term}.`);
    }
  }

  if (!envExample.includes("non-placeholder value of at least 32 characters")) {
    fail(".env.example does not document the hosted session secret requirement.");
  }

  if (!envExample.includes("Do not add NEXT_PUBLIC_SUPABASE_*")) {
    fail(".env.example does not document the server-only Supabase boundary.");
  }
}

function checkPackageScripts() {
  const packageJson = JSON.parse(readFile("package.json"));
  const scripts = packageJson.scripts ?? {};

  for (const script of requiredPackageScripts) {
    if (!scripts[script]) {
      fail(`package.json is missing script: ${script}`);
    }
  }
}

function checkEvidence() {
  const evidence = readFile("docs/DEMO_EVIDENCE.md");
  const browserQa = readFile("docs/BROWSER_QA.md");
  const sourceCommit = evidence.match(/- Commit: `([^`]+)`/)?.[1];

  if (!browserQa.includes("This file is generated by `npm run browser:qa`")) {
    fail("BROWSER_QA does not identify the browser QA generator.");
  }

  const historicalCommandEvidence = evidence.includes(
    "Historical verification snapshot",
  );
  const historicalBrowserEvidence = browserQa.includes(
    "Historical local browser snapshot",
  );

  if (
    !requireFreshEvidence &&
    historicalCommandEvidence &&
    historicalBrowserEvidence
  ) {
    warn(
      "Historical command and browser evidence were validated as historical only. " +
        "Use --require-fresh-evidence after approved isolated browser/database QA.",
    );
    return;
  }

  if (historicalCommandEvidence !== historicalBrowserEvidence) {
    fail(
      "DEMO_EVIDENCE and BROWSER_QA must both be historical or both be fresh.",
    );
    return;
  }

  if (historicalCommandEvidence || historicalBrowserEvidence) {
    fail("Fresh evidence mode rejects historical command or browser snapshots.");
    return;
  }

  const validSourceCommits = expectedEvidenceCommits();

  if (!sourceCommit) {
    fail("DEMO_EVIDENCE does not include a source commit.");
  } else if (!validSourceCommits.includes(sourceCommit)) {
    fail(
      `DEMO_EVIDENCE source commit ${sourceCommit} is stale; expected ${validSourceCommits.join(" or ")}.`,
    );
  }

  if (!evidence.includes("Overall local verification: **PASS**")) {
    fail("DEMO_EVIDENCE does not report overall local verification PASS.");
  }

  for (const check of requiredEvidenceChecks) {
    const row = new RegExp(`\\| ${check} \\| [^\\n]+ \\| PASS \\| 0 \\|`);
    if (!row.test(evidence)) {
      fail(`DEMO_EVIDENCE is missing PASS row for ${check}.`);
    }
  }

  const quotedCoverageGroups = [
    ["DB smoke", requiredDbSmokeCoverage],
    ["wallet auth", requiredWalletAuthCoverage],
    ["API origin", requiredApiOriginCoverage],
    ["live flow", requiredLiveFlowCoverage],
    ["live persistence", requiredLivePersistenceCoverage],
    ["settlement smoke", requiredSettlementCoverage],
    ["indexer security", requiredIndexerSecurityCoverage],
    ["live policy", requiredLivePolicyCoverage],
    ["live signing", requiredLiveSigningCoverage],
    ["live submission", requiredLiveSubmissionCoverage],
    ["live readiness", requiredLiveReadinessCoverage],
    ["live browser flow", requiredLiveBrowserCoverage],
    ["live UI wiring", requiredLiveUiCoverage],
    ["contract approval", requiredContractApprovalCoverage],
    ["deploy env", requiredDeployEnvCoverage],
    ["live evidence audit", requiredLiveEvidenceAuditCoverage],
    ["hosted preflight", requiredHostedPreflightCoverage],
    ["live deployment validation", requiredLiveDeploymentValidationCoverage],
  ];

  for (const [label, coverageItems] of quotedCoverageGroups) {
    for (const coverage of coverageItems) {
      if (!evidence.includes(`"${coverage}"`)) {
        fail(`DEMO_EVIDENCE is missing ${label} coverage: ${coverage}`);
      }
    }
  }

  for (const coverage of requiredSmokeCoverage) {
    if (!evidence.includes(`- ${coverage}`)) {
      fail(`DEMO_EVIDENCE is missing demo smoke coverage: ${coverage}`);
    }
  }

  for (const coverage of requiredContractCoverage) {
    if (!evidence.includes(coverage)) {
      fail(`DEMO_EVIDENCE is missing contract coverage: ${coverage}`);
    }
  }

  for (const term of [
    "- Payment asset configured: `true`",
    "QUORUM_LIVE_SIGNING_APPROVED=I_APPROVE_TESTNET_SIGNING",
    "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  ]) {
    if (!evidence.includes(term)) {
      fail(`DEMO_EVIDENCE is missing required release evidence: ${term}`);
    }
  }

  for (const term of [
    "Landing",
    "Discover",
    "Paid event detail",
    "Checkout",
    "Event proof",
    "Collaborator ledger",
    "Evidence hub",
    "Console errors: none observed",
    "Horizontal overflow: none observed",
  ]) {
    if (!browserQa.includes(term)) {
      fail(`BROWSER_QA is missing expected browser proof: ${term}`);
    }
  }
}

function checkLiveBoundaries() {
  const handoff = readFile("docs/LIVE_SIGNING_HANDOFF.md");
  const manualRunbook = readFile("docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md");
  const productionHandoff = readFile("docs/PRODUCTION_ENV_HANDOFF.md");
  const readiness = readFile("docs/MVP_READINESS.md");
  const normalizedReadiness = readiness.replaceAll("**", "").replace(/\s+/g, " ");
  const templateAudit = runJson("node", ["scripts/live-evidence-audit.mjs"]);
  const submissionPackage = runJson("node", ["scripts/submission-package-smoke.mjs"]);

  for (const term of requiredLiveHandoffTerms) {
    if (!handoff.includes(term)) {
      fail(`LIVE_SIGNING_HANDOFF is missing boundary term: ${term}`);
    }
  }

  for (const term of [
    "https://quorum-sandy-eight.vercel.app",
    "0005_anchor_cashout_proof.sql",
    "CRON_SECRET",
    "Historically live",
    "current-origin evidence",
    "provider allowlist approval",
    "Contract-level end-time enforcement is not implemented",
    "fresh transaction/indexer evidence",
    "Quorum is not mainnet production software",
  ]) {
    if (!readiness.includes(term)) {
      fail(`MVP_READINESS is missing current release boundary: ${term}`);
    }
  }

  if (
    !normalizedReadiness.includes(
      "hosted release operational and final browser QA complete",
    )
  ) {
    fail(
      "MVP_READINESS is missing current release boundary: hosted release operational and final browser QA complete",
    );
  }

  for (const term of [
    "Manual Freighter Signing Runbook",
    "Stop immediately",
    "QuorumCore.create_event",
    "QuorumCore.purchase",
    "QuorumCore.check_in",
    "QuorumCore.withdraw",
    "liveFlows.publishFreeEvent.txHash",
    "docs/LIVE_TESTNET_EVIDENCE.json",
    "npm run live:evidence:audit",
  ]) {
    if (!manualRunbook.includes(term)) {
      fail(`MANUAL_FREIGHTER_SIGNING_RUNBOOK is missing term: ${term}`);
    }
  }

  for (const term of [
    "npm run deploy:hosted:preflight",
    "Supabase Postgres",
    "DATABASE_URL",
    "DIRECT_DATABASE_URL",
    "Do not add `NEXT_PUBLIC_SUPABASE_*`",
    "Vercel",
    "public HTTPS",
  ]) {
    if (!productionHandoff.includes(term)) {
      fail(`PRODUCTION_ENV_HANDOFF is missing term: ${term}`);
    }
  }

  if (!templateAudit.ok || templateAudit.mode !== "template") {
    fail("Live testnet evidence template audit does not pass in template mode.");
  }

  if (templateAudit.liveEvidenceComplete) {
    fail("Live testnet evidence template must not claim complete live evidence.");
  }

  if (!submissionPackage.ok) {
    fail("Hackathon submission package smoke does not pass.");
  }
}

function checkDoctor() {
  const doctor = runJson("node", ["scripts/contracts/doctor.mjs"]);

  if (!doctor.network?.rpcReachable) {
    fail("contracts:doctor reports Stellar RPC is not reachable.");
  }

  if (!doctor.tools?.stellar?.ok || !doctor.tools?.rust?.ok || !doctor.tools?.cargo?.ok) {
    fail("contracts:doctor reports a missing required tool.");
  }

  if (!doctor.tools?.wasm32v1NoneInstalled) {
    fail("contracts:doctor reports wasm32v1-none target is missing.");
  }

  if (!Array.isArray(doctor.contracts?.wasmArtifacts)) {
    fail("contracts:doctor did not report WASM artifacts.");
  } else {
    for (const artifact of doctor.contracts.wasmArtifacts) {
      if (!artifact.exists || !artifact.sha256 || !artifact.sizeBytes) {
        fail(`contracts:doctor reports incomplete artifact: ${artifact.label}`);
      }
    }
  }

  if (!doctor.paymentAsset || typeof doctor.paymentAsset.usdcContractIdConfigured !== "boolean") {
    fail("contracts:doctor does not report payment asset readiness.");
  }

  if (!doctor.readyToDeploy && !doctor.blockers?.length) {
    fail("contracts:doctor is not ready to deploy but reported no blockers.");
  }

  return doctor;
}

checkWorkingTree();
checkRequiredFiles();
checkEnvExample();
checkPackageScripts();
checkEvidence();
checkLiveBoundaries();
const doctor = checkDoctor();

const report = {
  ok: failures.length === 0,
  scope: requireFreshEvidence ? "final-evidence" : "source-readiness",
  allowDirtyEvidence,
  requireFreshEvidence,
  releaseCandidateReady: requireFreshEvidence && failures.length === 0,
  doctorReadyToDeploy: doctor.readyToDeploy,
  doctorBlockers: doctor.blockers ?? [],
  warnings,
  failures,
};

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
