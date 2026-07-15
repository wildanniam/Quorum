import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { Keypair, StrKey } from "@stellar/stellar-sdk";

const projectRoot = process.cwd();
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "quorum-live-evidence-"));

const account = () => Keypair.random().publicKey();
const contract = (fill) => StrKey.encodeContract(Buffer.alloc(32, fill));
const hex64 = (fill) => fill.toString(16).padStart(2, "0").repeat(32);

function buildEvidence(overrides = {}) {
  return {
    generatedAt: new Date().toISOString(),
    network: "TESTNET",
    rpcUrl: "https://soroban-testnet.stellar.org",
    hostedAppUrl: "https://quorum.example.com",
    wallets: {
      admin: account(),
      organizer: account(),
      paidAttendee: account(),
      freeAttendee: account(),
      collaborator: account(),
    },
    contracts: {
      coreContractId: contract(7),
      passContractId: contract(8),
      usdcContractId: contract(9),
      coreWasmHash:
        "73ad1844be4fbcf16c76206b18461b020c68c6e230e4fb8b37d50e2dcddb2ac0",
      passWasmHash:
        "e78624a8bf8dbb1babdf808ff38bc29053fe8a91c3761ee64c519983797202ec",
      platformFeeBps: 0,
    },
    deploymentTransactions: {
      passDeployTxHash: hex64(1),
      coreDeployTxHash: hex64(2),
      passInitTxHash: hex64(3),
      coreInitTxHash: hex64(4),
      passSetCoreTxHash: hex64(5),
    },
    liveFlows: {
      publishPaidEvent: {
        txHash: hex64(6),
        eventUrl: "https://quorum.example.com/events/paid",
        priceUsdc: "1",
        splitTotalBps: 10000,
      },
      paidCheckout: {
        txHash: hex64(7),
        tokenId: "1",
        paymentAsset: "USDC",
        amountUsdc: "1",
      },
      publishFreeEvent: {
        txHash: hex64(8),
        eventUrl: "https://quorum.example.com/events/free",
        priceUsdc: "0",
        splitTotalBps: 10000,
      },
      freeClaim: {
        txHash: hex64(9),
        tokenId: "2",
        amountUsdc: "0",
      },
      checkIn: {
        txHash: hex64(10),
        tokenId: "1",
      },
      collaboratorWithdraw: {
        txHash: hex64(11),
        withdrawAmountUsdc: "2.5",
      },
    },
    browserProof: {
      contractStatusUrl: "https://quorum.example.com/api/contracts/status",
      contractStatusProofMode: "live",
      contractStatusActionsLive: true,
      paidResourceUnlockedUrl: "https://quorum.example.com/events/paid/resources",
      browserQaDeployed: "Deployed browser QA passed.",
    },
    indexerProof: {
      stateId: "quorum-testnet-contracts",
      lastRunStatus: "success",
      baselineCursor: "100-1",
      finalCursor: "200-2",
      baselineLatestLedger: 100,
      finalLatestLedger: 200,
      lastSuccessAt: new Date(Date.now() - 1_000).toISOString(),
      indexedEventCount: 8,
      indexedTransactionHashes: [6, 7, 8, 9, 10, 11].map(hex64),
      evidenceUrl: "https://quorum.example.com/evidence",
    },
    verification: {
      commands: {
        contractsDoctor: {
          command: "npm run contracts:doctor",
          status: "PASS",
          exitCode: 0,
        },
        contractsTest: {
          command: "npm run contracts:test",
          status: "PASS",
          exitCode: 0,
        },
        contractsBuild: {
          command: "npm run contracts:build",
          status: "PASS",
          exitCode: 0,
        },
        lint: {
          command: "npm run lint",
          status: "PASS",
          exitCode: 0,
        },
        build: {
          command: "npm run build",
          status: "PASS",
          exitCode: 0,
        },
        readinessAudit: {
          command: "npm run readiness:audit",
          status: "PASS",
          exitCode: 0,
        },
      },
    },
    approval: {
      explicitApprovalRecorded: true,
      approvedBy: "Quorum demo owner",
      approvedAt: "2026-06-08T00:00:00.000Z",
      notes: "Approved live testnet signing evidence run.",
    },
    ...overrides,
  };
}

function runAudit(filename, evidence, extraArgs = []) {
  const evidencePath = path.join(tmpDir, filename);
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  return spawnSync(
    "node",
    [
      "scripts/live-evidence-audit.mjs",
      evidencePath,
      "--require-filled",
      ...extraArgs,
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
    },
  );
}

const validResult = runAudit("valid.json", buildEvidence());
assert.equal(validResult.status, 0, validResult.stderr || validResult.stdout);

const validCurrentOriginResult = runAudit(
  "valid-current-origin.json",
  buildEvidence(),
  [
    "--require-current-origin",
    "--expected-origin=https://quorum.example.com",
  ],
);
assert.equal(
  validCurrentOriginResult.status,
  0,
  validCurrentOriginResult.stderr || validCurrentOriginResult.stdout,
);

const placeholderResult = runAudit(
  "placeholder.json",
  buildEvidence({
    approval: {
      explicitApprovalRecorded: true,
      approvedBy: "Quorum demo owner",
      approvedAt: "2026-06-08T00:00:00.000Z",
      notes: "<approval scope notes>",
    },
  }),
);
assert.notEqual(placeholderResult.status, 0);
assert.match(
  `${placeholderResult.stdout}${placeholderResult.stderr}`,
  /must be filled, not a placeholder/,
);

const localUrlResult = runAudit(
  "local-url.json",
  buildEvidence({
    hostedAppUrl: "http://localhost:3000",
  }),
);
assert.notEqual(localUrlResult.status, 0);
assert.match(
  `${localUrlResult.stdout}${localUrlResult.stderr}`,
  /public HTTPS URL/,
);

const duplicateTxEvidence = buildEvidence();
duplicateTxEvidence.liveFlows.paidCheckout.txHash =
  duplicateTxEvidence.liveFlows.publishPaidEvent.txHash;
const duplicateTxResult = runAudit("duplicate-tx.json", duplicateTxEvidence);
assert.notEqual(duplicateTxResult.status, 0);
assert.match(
  `${duplicateTxResult.stdout}${duplicateTxResult.stderr}`,
  /must be unique/,
);

const tokenMismatchEvidence = buildEvidence();
tokenMismatchEvidence.liveFlows.checkIn.tokenId = "999";
const tokenMismatchResult = runAudit("token-mismatch.json", tokenMismatchEvidence);
assert.notEqual(tokenMismatchResult.status, 0);
assert.match(
  `${tokenMismatchResult.stdout}${tokenMismatchResult.stderr}`,
  /must match liveFlows\.paidCheckout\.tokenId/,
);

const originMismatchEvidence = buildEvidence();
originMismatchEvidence.browserProof.paidResourceUnlockedUrl =
  "https://other-quorum.example.com/events/paid/resources";
const originMismatchResult = runAudit("origin-mismatch.json", originMismatchEvidence);
assert.notEqual(originMismatchResult.status, 0);
assert.match(
  `${originMismatchResult.stdout}${originMismatchResult.stderr}`,
  /same origin as hostedAppUrl/,
);

const duplicatePublishUrlEvidence = buildEvidence();
duplicatePublishUrlEvidence.liveFlows.publishFreeEvent.eventUrl =
  duplicatePublishUrlEvidence.liveFlows.publishPaidEvent.eventUrl;
const duplicatePublishUrlResult = runAudit(
  "duplicate-publish-url.json",
  duplicatePublishUrlEvidence,
);
assert.notEqual(duplicatePublishUrlResult.status, 0);
assert.match(
  `${duplicatePublishUrlResult.stdout}${duplicatePublishUrlResult.stderr}`,
  /publishFreeEvent\.eventUrl must be distinct/,
);

const zeroWithdrawEvidence = buildEvidence();
zeroWithdrawEvidence.liveFlows.collaboratorWithdraw.withdrawAmountUsdc = "0";
const zeroWithdrawResult = runAudit("zero-withdraw.json", zeroWithdrawEvidence);
assert.notEqual(zeroWithdrawResult.status, 0);
assert.match(
  `${zeroWithdrawResult.stdout}${zeroWithdrawResult.stderr}`,
  /positive decimal string/,
);

const wrongCurrentOriginResult = runAudit(
  "wrong-current-origin.json",
  buildEvidence(),
  [
    "--require-current-origin",
    "--expected-origin=https://current-quorum.example.com",
  ],
);
assert.notEqual(wrongCurrentOriginResult.status, 0);
assert.match(
  `${wrongCurrentOriginResult.stdout}${wrongCurrentOriginResult.stderr}`,
  /must use the current release origin/,
);

const staleCurrentEvidence = buildEvidence({
  generatedAt: "2026-06-08T00:00:00.000Z",
});
const staleCurrentEvidenceResult = runAudit(
  "stale-current-origin.json",
  staleCurrentEvidence,
  [
    "--require-current-origin",
    "--expected-origin=https://quorum.example.com",
  ],
);
assert.notEqual(staleCurrentEvidenceResult.status, 0);
assert.match(
  `${staleCurrentEvidenceResult.stdout}${staleCurrentEvidenceResult.stderr}`,
  /must be no more than 168 hours old/,
);

const wrongPaidPriceEvidence = buildEvidence();
wrongPaidPriceEvidence.liveFlows.publishPaidEvent.priceUsdc = "5";
const wrongPaidPriceResult = runAudit(
  "wrong-paid-price.json",
  wrongPaidPriceEvidence,
  [
    "--require-current-origin",
    "--expected-origin=https://quorum.example.com",
  ],
);
assert.notEqual(wrongPaidPriceResult.status, 0);
assert.match(
  `${wrongPaidPriceResult.stdout}${wrongPaidPriceResult.stderr}`,
  /publishPaidEvent\.priceUsdc must be/,
);

const regressedIndexerEvidence = buildEvidence();
regressedIndexerEvidence.indexerProof.finalCursor = "99-9";
const regressedIndexerResult = runAudit(
  "regressed-indexer.json",
  regressedIndexerEvidence,
  [
    "--require-current-origin",
    "--expected-origin=https://quorum.example.com",
  ],
);
assert.notEqual(regressedIndexerResult.status, 0);
assert.match(
  `${regressedIndexerResult.stdout}${regressedIndexerResult.stderr}`,
  /finalCursor must advance/,
);

const missingIndexedHashEvidence = buildEvidence();
missingIndexedHashEvidence.indexerProof.indexedTransactionHashes.pop();
const missingIndexedHashResult = runAudit(
  "missing-indexed-hash.json",
  missingIndexedHashEvidence,
  [
    "--require-current-origin",
    "--expected-origin=https://quorum.example.com",
  ],
);
assert.notEqual(missingIndexedHashResult.status, 0);
assert.match(
  `${missingIndexedHashResult.stdout}${missingIndexedHashResult.stderr}`,
  /indexedTransactionHashes must contain each unique app-flow transaction hash/,
);

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "accept-filled-live-evidence",
        "reject-filled-live-evidence-placeholder",
        "reject-filled-live-evidence-local-url",
        "reject-filled-live-evidence-duplicate-tx",
        "reject-filled-live-evidence-token-mismatch",
        "reject-filled-live-evidence-origin-mismatch",
        "reject-filled-live-evidence-duplicate-publish-url",
        "reject-filled-live-evidence-zero-withdraw",
        "accept-current-origin-live-evidence",
        "reject-wrong-current-origin",
        "reject-stale-current-origin-evidence",
        "reject-wrong-final-paid-price",
        "reject-regressed-indexer-cursor",
        "reject-missing-indexed-transaction",
      ],
    },
    null,
    2,
  ),
);
