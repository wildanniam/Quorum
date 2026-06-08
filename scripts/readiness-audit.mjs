import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const allowDirtyEvidence = process.argv.includes("--allow-dirty-evidence");
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
  "docs/LIVE_SIGNING_HANDOFF.md",
  "docs/LIVE_TESTNET_EVIDENCE.example.json",
  "docs/MVP_READINESS.md",
  "docs/QUORUM_PM_GOAL_BRIEF.md",
  "docs/SOROBAN_SPIKE.md",
  "scripts/live-args-smoke.ts",
  "scripts/live-browser-flow-smoke.ts",
  "scripts/live-evidence-audit.mjs",
  "scripts/live-flow-smoke.ts",
  "scripts/live-persistence-smoke.ts",
  "scripts/live-preflight-smoke.ts",
  "scripts/live-signing-smoke.ts",
  "scripts/live-submission-smoke.ts",
  "scripts/live-ui-wiring-smoke.mjs",
  "scripts/live-xdr-smoke.ts",
  "scripts/contracts/live-signing-approval.mjs",
  "scripts/contracts/live-signing-approval-smoke.mjs",
  "scripts/deploy-env-smoke.ts",
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
  "db:seed",
  "db:smoke",
  "demo:live-policy",
  "demo:smoke",
  "deploy:env:smoke",
  "browser:qa",
  "evidence:local",
  "lint",
  "live:args:smoke",
  "live:browser-flow:smoke",
  "live:evidence:audit",
  "live:evidence:template",
  "live:flow:smoke",
  "live:persistence:smoke",
  "live:preflight:smoke",
  "live:signing:smoke",
  "live:submission:smoke",
  "live:ui-wiring:smoke",
  "live:xdr:smoke",
  "readiness:audit",
];

const requiredEvidenceChecks = [
  "DB migrate",
  "DB seed",
  "DB smoke",
  "Lint",
  "Build",
  "Audit",
  "Demo smoke",
  "Live policy smoke",
  "Browser QA",
  "Deploy env smoke",
  "Live args smoke",
  "Live browser flow smoke",
  "Live evidence template",
  "Live flow smoke",
  "Live persistence smoke",
  "Live preflight smoke",
  "Live signing smoke",
  "Live submission smoke",
  "Live UI wiring smoke",
  "Live XDR smoke",
  "Contract tests",
  "Contract build",
  "Contract approval smoke",
  "Contract doctor",
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
  "reject-source-mismatch-before-rpc",
  "reject-function-mismatch-before-rpc",
  "reject-contract-mismatch-before-rpc",
  "reject-argument-mismatch-before-rpc",
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
  "deploy-script-denies-without-live-approval",
  "init-script-denies-without-live-approval",
];

const requiredDeployEnvCoverage = [
  "reject-missing-production-session-secret",
  "reject-placeholder-production-session-secret",
  "reject-local-fallback-production-session-secret",
  "reject-short-production-session-secret",
  "accept-valid-production-session-secret",
  "reject-expired-session-token",
  "reject-future-session-token",
  "accept-current-wallet-bound-challenge",
  "reject-expired-wallet-challenge",
  "reject-future-wallet-challenge",
  "reject-wallet-mismatched-challenge",
  "reject-malformed-wallet-challenge",
];

const requiredLiveHandoffTerms = [
  "explicitly approves",
  "STELLAR_ACCOUNT",
  "QUORUM_SESSION_SECRET",
  "QUORUM_LIVE_SIGNING_APPROVED",
  "I_APPROVE_TESTNET_SIGNING",
  "Freighter",
  "NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID",
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

  return (
    entries.length > 0 &&
    entries.every((entry) =>
      generatedDocs.some((generatedDoc) => entry.endsWith(generatedDoc)),
    )
  );
}

function expectedEvidenceCommits() {
  const head = git(["rev-parse", "--short", "HEAD"]);
  const headFiles = git([
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    "HEAD",
  ]);

  if (listOnlyEvidenceFile(headFiles)) {
    return [git(["rev-parse", "--short", "HEAD^"]), head];
  }

  return [head];
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
    "QUORUM_SESSION_SECRET",
    "NEXT_PUBLIC_STELLAR_NETWORK",
    "NEXT_PUBLIC_STELLAR_RPC_URL",
    "NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE",
    "NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID",
    "NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID",
    "NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID",
    "STELLAR_NETWORK",
    "STELLAR_ACCOUNT",
    "ADMIN_ADDRESS",
    "QUORUM_PLATFORM_FEE_BPS",
  ];

  for (const term of requiredEnvExampleTerms) {
    if (!envExample.includes(term)) {
      fail(`.env.example is missing ${term}.`);
    }
  }

  if (!envExample.includes("non-placeholder value of at least 32 characters")) {
    fail(".env.example does not document the hosted session secret requirement.");
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

  for (const coverage of requiredSmokeCoverage) {
    if (!evidence.includes(`- ${coverage}`)) {
      fail(`DEMO_EVIDENCE is missing smoke coverage: ${coverage}`);
    }
  }

  for (const coverage of requiredLiveFlowCoverage) {
    if (!evidence.includes(`"${coverage}"`)) {
      fail(`DEMO_EVIDENCE is missing live flow coverage: ${coverage}`);
    }
  }

  for (const coverage of requiredLivePolicyCoverage) {
    if (!evidence.includes(`"${coverage}"`)) {
      fail(`DEMO_EVIDENCE is missing live policy coverage: ${coverage}`);
    }
  }

  for (const coverage of requiredLiveSigningCoverage) {
    if (!evidence.includes(`"${coverage}"`)) {
      fail(`DEMO_EVIDENCE is missing live signing coverage: ${coverage}`);
    }
  }

  for (const coverage of requiredLiveSubmissionCoverage) {
    if (!evidence.includes(`"${coverage}"`)) {
      fail(`DEMO_EVIDENCE is missing live submission coverage: ${coverage}`);
    }
  }

  for (const coverage of requiredLiveBrowserCoverage) {
    if (!evidence.includes(`"${coverage}"`)) {
      fail(`DEMO_EVIDENCE is missing live browser flow coverage: ${coverage}`);
    }
  }

  for (const coverage of requiredLiveUiCoverage) {
    if (!evidence.includes(`"${coverage}"`)) {
      fail(`DEMO_EVIDENCE is missing live UI wiring coverage: ${coverage}`);
    }
  }

  for (const coverage of requiredContractCoverage) {
    if (!evidence.includes(coverage)) {
      fail(`DEMO_EVIDENCE is missing contract coverage: ${coverage}`);
    }
  }

  for (const coverage of requiredContractApprovalCoverage) {
    if (!evidence.includes(`"${coverage}"`)) {
      fail(`DEMO_EVIDENCE is missing contract approval coverage: ${coverage}`);
    }
  }

  for (const coverage of requiredDeployEnvCoverage) {
    if (!evidence.includes(`"${coverage}"`)) {
      fail(`DEMO_EVIDENCE is missing deploy env coverage: ${coverage}`);
    }
  }

  if (!evidence.includes("- Payment asset configured: `false`")) {
    fail("DEMO_EVIDENCE does not record local payment asset readiness.");
  }

  if (!evidence.includes("STELLAR_ACCOUNT is missing")) {
    fail("DEMO_EVIDENCE does not document the funded signing gate.");
  }

  if (!evidence.includes("NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID")) {
    fail("DEMO_EVIDENCE does not document the USDC payment asset gate.");
  }

  if (!browserQa.includes("This file is generated by `npm run browser:qa`")) {
    fail("BROWSER_QA does not identify the browser QA generator.");
  }

  for (const term of [
    "Marketplace",
    "Paid event detail",
    "Locked resources",
    "Dashboard readiness",
    "Local proof mode",
    "USDC asset",
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
  const readiness = readFile("docs/MVP_READINESS.md");
  const templateAudit = runJson("node", ["scripts/live-evidence-audit.mjs"]);

  for (const term of requiredLiveHandoffTerms) {
    if (!handoff.includes(term)) {
      fail(`LIVE_SIGNING_HANDOFF is missing boundary term: ${term}`);
    }
  }

  if (!readiness.includes("The testnet USDC token contract ID is confirmed")) {
    fail("MVP_READINESS does not list the USDC token contract ID live gate.");
  }

  for (const term of [
    "Live RPC preflight can prepare transaction XDR for signing",
    "Freighter signing boundary validates signed transaction output",
    "Signed transaction submission boundary polls finality and decodes return values",
    "Mock live transaction flow persists only after success",
    "Verified live transaction results can be recorded",
    "Unsigned Soroban XDR templates are parseable",
  ]) {
    if (!readiness.includes(term)) {
      fail(`MVP_READINESS is missing live readiness row: ${term}`);
    }
  }

  if (!readiness.includes("not yet a complete live testnet submission")) {
    fail("MVP_READINESS does not preserve the live submission boundary.");
  }

  if (!templateAudit.ok || templateAudit.mode !== "template") {
    fail("Live testnet evidence template audit does not pass in template mode.");
  }

  if (templateAudit.liveEvidenceComplete) {
    fail("Live testnet evidence template must not claim complete live evidence.");
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
  allowDirtyEvidence,
  doctorReadyToDeploy: doctor.readyToDeploy,
  doctorBlockers: doctor.blockers ?? [],
  warnings,
  failures,
};

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
