import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createFutureEventWindow } from "./demo-event-schedule.mjs";
import fs from "node:fs";
import path from "node:path";
import { StrKey } from "@stellar/stellar-sdk";
import { execute, quoteIdentifier } from "../src/lib/db/client";
import type { RpcRequester } from "../src/lib/stellar/indexer";

const projectRoot = process.cwd();
const databaseSchema = `quorum_settlement_smoke_${randomUUID().replaceAll("-", "_")}`;
const coreContractId = "CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV";
const passContractId = "CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH";
const usdcContractId = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const organizerWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 11));
const collaboratorWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 12));
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 13));

function loadEnvLocalIfNeeded() {
  if (process.env.DATABASE_URL) return;

  const envPath = path.join(projectRoot, ".env.local");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"|"$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function run(command: string, args: string[]) {
  execFileSync(process.platform === "win32" && command === "npm" ? "npm.cmd" : command, args, {
    cwd: projectRoot,
    env: {
      ...process.env,
      NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: coreContractId,
      NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID: passContractId,
      NEXT_PUBLIC_STELLAR_NETWORK: "TESTNET",
      NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
      NEXT_PUBLIC_STELLAR_RPC_URL: "https://soroban-testnet.stellar.org",
      NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID: usdcContractId,
      QUORUM_DB_SCHEMA: databaseSchema,
    },
    stdio: "pipe",
  });
}

function txHash(seed: number) {
  return Buffer.alloc(32, seed).toString("hex");
}

function hex(seed: number) {
  return Buffer.alloc(32, seed).toString("hex");
}

function mockRpcEvent({
  contractId = coreContractId,
  coreEventId,
  ledger,
  pagingToken,
  topic,
  txHash: eventTxHash,
}: {
  contractId?: string;
  coreEventId: string;
  ledger: number;
  pagingToken: string;
  topic: string;
  txHash: string;
}) {
  return {
    contractId,
    inSuccessfulContractCall: true,
    ledger,
    pagingToken,
    topic: [topic, coreEventId],
    txHash: eventTxHash,
    type: "contract",
    value: {
      eventId: coreEventId,
      xdr: `mock-${topic}`,
    },
  };
}

async function main() {
  loadEnvLocalIfNeeded();

  process.env.NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID = coreContractId;
  process.env.NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID = passContractId;
  process.env.NEXT_PUBLIC_STELLAR_NETWORK = "TESTNET";
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE =
    "Test SDF Network ; September 2015";
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL = "https://soroban-testnet.stellar.org";
  process.env.NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID = usdcContractId;
  process.env.QUORUM_DB_SCHEMA = databaseSchema;

  run("node", ["scripts/db-migrate.mjs"]);

  const repository = await import("../src/lib/events/repository");
  const anchor = await import("../src/lib/anchor/payouts");
  const evidence = await import("../src/lib/evidence/repository");
  const ledger = await import("../src/lib/ledger/repository");
  const indexer = await import("../src/lib/stellar/indexer");
  const eventSchedule = createFutureEventWindow({
    durationHours: 2,
    offsetDays: 21,
  });

  const draft = await repository.createDraftEventWithSetup(
    {
      capacity: 25,
      coverImageUrl: null,
      endDateTime: eventSchedule.endDateTime,
      eventType: "workshop",
      isFree: false,
      locationText: "Jakarta + livestream",
      locationType: "hybrid",
      meetingUrl: "https://example.com/settlement-smoke",
      organizerWallet,
      priceUsdc: "10",
      shortDescription:
        "Temporary event proving indexer, evidence, and collaborator ledger.",
      slug: `settlement-smoke-${randomUUID().slice(0, 8)}`,
      startDateTime: eventSchedule.startDateTime,
      timezone: "Asia/Jakarta",
      title: "Settlement Smoke Proof",
    },
    [
      {
        displayName: "Smoke Organizer",
        role: "Host",
        splitPercentage: 70,
        walletAddress: organizerWallet,
      },
      {
        displayName: "Smoke Collaborator",
        role: "Speaker",
        splitPercentage: 30,
        walletAddress: collaboratorWallet,
      },
    ],
    [
      {
        description: "Temporary gated resource.",
        sortOrder: 1,
        title: "Settlement Deck",
        type: "link",
        url: "https://example.com/settlement-deck",
      },
    ],
  );
  const coreEventId = hex(90);
  const event = draft.event;
  const publishTx = txHash(1);
  const checkoutTx = txHash(2);
  const checkInTx = txHash(3);
  const withdrawalTx = txHash(4);
  const indexedOnlyTx = txHash(5);
  const anchorTransferTx = txHash(7);
  const tokenId = "9001";

  await repository.recordLivePublishedEvent({
    coreEventId,
    eventId: event.id,
    metadataHash: hex(91),
    organizerWallet,
    publishTxHash: publishTx,
  });
  await repository.recordLivePass({
    eventId: event.id,
    metadataHash: hex(92),
    metadataUri: "quorum://settlement-smoke/pass",
    ownerWallet: attendeeWallet,
    tokenId,
    txHash: checkoutTx,
  });
  await repository.recordLiveCheckIn({
    checkedInByWallet: organizerWallet,
    eventId: event.id,
    tokenId,
    txHash: checkInTx,
  });
  const withdrawalResult = await repository.recordLiveWithdrawal({
    amountUsdc: "3",
    collaboratorWallet,
    eventId: event.id,
    txHash: withdrawalTx,
  });
  const opportunitiesBeforeCashOut = await anchor.listAnchorPayoutOpportunities(
    collaboratorWallet,
  );

  assert.equal(opportunitiesBeforeCashOut.length, 1);
  assert.equal(
    opportunitiesBeforeCashOut[0]?.withdrawalId,
    withdrawalResult.withdrawal.id,
  );
  assert.equal(opportunitiesBeforeCashOut[0]?.settlementTxHash, withdrawalTx);
  process.env.ANCHOR_PROVIDER = "mock";
  const createdCashOut = await anchor.createAnchorPayout({
    collaboratorWallet,
    eventId: event.id,
    withdrawalId: withdrawalResult.withdrawal.id,
  });
  assert.equal(createdCashOut.retried, false);
  assert.equal(createdCashOut.payout.withdrawalId, withdrawalResult.withdrawal.id);
  await assert.rejects(
    () =>
      anchor.createAnchorPayout({
        collaboratorWallet,
        eventId: event.id,
        withdrawalId: withdrawalResult.withdrawal.id,
      }),
    /already has a cash-out request/,
  );
  await execute(
    `
    UPDATE anchor_payouts
    SET status = 'failed', failure_reason = 'retry smoke'
    WHERE id = $1
    `,
    [createdCashOut.payout.id],
  );
  const retriedCashOut = await anchor.createAnchorPayout({
    collaboratorWallet,
    eventId: event.id,
    withdrawalId: withdrawalResult.withdrawal.id,
  });
  assert.equal(retriedCashOut.retried, true);
  assert.equal(retriedCashOut.payout.id, createdCashOut.payout.id);
  await execute(
    `
    UPDATE anchor_payouts
    SET
      provider = 'moneygram',
      status = 'ready_for_pickup',
      anchor_transaction_id = 'mg-settlement-smoke',
      reference_number = 'mg-settlement-smoke',
      pickup_url = 'https://extstellar.moneygram.com/mock-interactive',
      stellar_transaction_id = $2,
      metadata_json = $3::jsonb
    WHERE id = $1
    `,
    [
      retriedCashOut.payout.id,
      anchorTransferTx,
      JSON.stringify({ mode: "moneygram", smoke: true }),
    ],
  );
  const opportunitiesAfterCashOut = await anchor.listAnchorPayoutOpportunities(
    collaboratorWallet,
  );
  assert.equal(
    opportunitiesAfterCashOut.length,
    0,
    "a settled withdrawal can only back one anchor cash-out",
  );

  const rawEvents = [
    mockRpcEvent({
      coreEventId,
      ledger: 100,
      pagingToken: "100-1",
      topic: "create_event",
      txHash: publishTx,
    }),
    mockRpcEvent({
      contractId: passContractId,
      coreEventId,
      ledger: 101,
      pagingToken: "101-1",
      topic: "pass_minted",
      txHash: checkoutTx,
    }),
    mockRpcEvent({
      coreEventId,
      ledger: 102,
      pagingToken: "102-1",
      topic: "proof_note",
      txHash: indexedOnlyTx,
    }),
  ];
  const firstIngest = await indexer.ingestStellarEvents({ events: rawEvents });
  const secondIngest = await indexer.ingestStellarEvents({ events: rawEvents });

  assert.equal(firstIngest.insertedCount, 3, "indexer should insert new events");
  assert.equal(secondIngest.insertedCount, 0, "indexer should be idempotent");
  assert(
    firstIngest.records.every((record) => record.appEventId === event.id),
    "indexed events should map back to the Quorum event",
  );

  const requester: RpcRequester = async ({ method }) => {
    if (method === "getEvents") {
      return {
        cursor: "cursor-after-103",
        events: [
          mockRpcEvent({
            coreEventId,
            ledger: 103,
            pagingToken: "103-1",
            topic: "withdraw",
            txHash: txHash(6),
          }),
        ],
        latestLedger: 103,
      };
    }

    return { sequence: 103 };
  };
  const runResult = await indexer.runStellarEventIndexer({
    requester,
    stateId: "settlement-smoke",
  });
  const indexerState = await indexer.getIndexerState("settlement-smoke");

  assert.equal(runResult.insertedCount, 1, "cron indexer should ingest RPC events");
  assert.equal(indexerState?.cursor, "cursor-after-103");
  assert.equal(indexerState?.latestLedger, 103);

  await assert.rejects(
    () =>
      indexer.runStellarEventIndexer({
        requester: async () => {
          throw new Error("mock RPC unavailable");
        },
        stateId: "settlement-smoke",
      }),
    /mock RPC unavailable/,
  );
  const failedIndexerState = await indexer.getIndexerState("settlement-smoke");
  assert.equal(failedIndexerState?.cursor, "cursor-after-103");
  assert.equal(failedIndexerState?.latestLedger, 103);
  assert.match(failedIndexerState?.lastError ?? "", /mock RPC unavailable/);

  const regressedLedgerRun = await indexer.runStellarEventIndexer({
    requester: async () => ({
      cursor: "cursor-after-empty-102",
      events: [],
      latestLedger: 102,
    }),
    stateId: "settlement-smoke",
  });
  assert.equal(regressedLedgerRun.latestLedger, 103);
  assert.equal(regressedLedgerRun.state.latestLedger, 103);
  assert.equal(regressedLedgerRun.cursor, "cursor-after-103");
  assert.equal(regressedLedgerRun.state.cursor, "cursor-after-103");

  let releaseConcurrentRun: () => void = () => {};
  let signalConcurrentRunStarted: () => void = () => {};
  const concurrentRunStarted = new Promise<void>((resolve) => {
    signalConcurrentRunStarted = resolve;
  });
  const concurrentRunRelease = new Promise<void>((resolve) => {
    releaseConcurrentRun = resolve;
  });
  const firstConcurrentRun = indexer.runStellarEventIndexer({
    requester: async () => {
      signalConcurrentRunStarted();
      await concurrentRunRelease;
      return { cursor: "concurrent-cursor", events: [], latestLedger: 103 };
    },
    startLedger: 100,
    stateId: "settlement-concurrent",
  });

  await concurrentRunStarted;
  await assert.rejects(
    () =>
      indexer.runStellarEventIndexer({
        requester: async () => ({ events: [], latestLedger: 103 }),
        startLedger: 100,
        stateId: "settlement-concurrent",
      }),
    /already active/,
  );
  releaseConcurrentRun();
  await firstConcurrentRun;

  const unexpectedContractId = StrKey.encodeContract(Buffer.alloc(32, 99));
  await assert.rejects(
    () =>
      indexer.runStellarEventIndexer({
        requester: async () => ({
          events: [
            mockRpcEvent({
              contractId: unexpectedContractId,
              coreEventId,
              ledger: 104,
              pagingToken: "104-unexpected",
              topic: "unexpected",
              txHash: txHash(8),
            }),
          ],
          latestLedger: 104,
        }),
        startLedger: 104,
        stateId: "settlement-unexpected-contract",
      }),
    /unconfigured contract/,
  );
  const rejectedContractState = await indexer.getIndexerState(
    "settlement-unexpected-contract",
  );
  assert.equal(rejectedContractState?.cursor, null);
  assert.equal(rejectedContractState?.latestLedger, null);
  assert.match(
    rejectedContractState?.lastError ?? "",
    /unconfigured contract/,
  );

  const eventEvidence = await evidence.listEvidence({ eventId: event.id });
  const evidenceKinds = new Set(eventEvidence.map((record) => record.kind));

  for (const kind of [
    "publish",
    "paid_checkout",
    "check_in",
    "anchor_payout",
    "withdrawal",
    "indexed_event",
  ]) {
    assert(evidenceKinds.has(kind as never), `evidence should include ${kind}`);
  }

  assert(
    eventEvidence
      .filter((record) => record.txHash)
      .every((record) => record.explorerUrl?.includes(record.txHash ?? "")),
    "evidence tx hashes should have explorer links",
  );

  const ledgerEntries = await ledger.listCollaboratorLedger(collaboratorWallet);
  const ledgerSummary = await ledger.getCollaboratorLedgerSummary(
    collaboratorWallet,
  );

  assert.equal(ledgerSummary.totalEarnedUsdc, "3");
  assert.equal(ledgerSummary.totalWithdrawnUsdc, "3");
  assert.equal(ledgerSummary.withdrawableUsdc, "0");
  assert(
    ledgerEntries.some((entry) => entry.kind === "credit" && entry.txHash === checkoutTx),
    "ledger should include checkout split credit",
  );
  assert(
    ledgerEntries.some(
      (entry) => entry.kind === "debit" && entry.txHash === withdrawalTx,
    ),
    "ledger should include withdrawal debit",
  );
  const withdrawalEvidence = eventEvidence.find(
    (record) => record.kind === "withdrawal",
  );
  const anchorEvidence = eventEvidence.find(
    (record) => record.kind === "anchor_payout",
  );
  assert.equal(
    withdrawalEvidence?.txHash,
    withdrawalTx,
    "contract settlement should retain its own proof hash",
  );
  assert.equal(
    anchorEvidence?.txHash,
    anchorTransferTx,
    "anchor cash-out should expose its separate Stellar transfer hash",
  );
  const withdrawalRows = await execute(
    "SELECT id FROM withdrawals WHERE event_id = $1 AND collaborator_wallet = $2",
    [event.id, collaboratorWallet],
  );
  assert.equal(
    withdrawalRows.rowCount,
    1,
    "anchor cash-out must not create a second contract withdrawal",
  );

  console.log(
    JSON.stringify(
      {
        checks: [
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
          "settlement-backed-anchor-opportunity",
          "duplicate-active-cashout-rejected",
          "failed-cashout-retry-reuses-record",
          "separate-anchor-transfer-proof",
          "single-contract-withdrawal",
        ],
        evidenceKinds: [...evidenceKinds].sort(),
        indexedEvents: firstIngest.records.length + runResult.insertedCount,
        ledgerEntries: ledgerEntries.length,
        summary: ledgerSummary,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (process.env.QUORUM_DB_SCHEMA === databaseSchema) {
      await execute(
        `DROP SCHEMA IF EXISTS ${quoteIdentifier(databaseSchema)} CASCADE`,
      );
    }
  });
