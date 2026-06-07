import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  Account,
  nativeToScVal,
  rpc,
  StrKey,
  type FeeBumpTransaction,
  type Transaction,
} from "@stellar/stellar-sdk";
import type {
  FreighterLiveSigner,
} from "../src/lib/stellar/freighter-live-signing";
import type { PurchaseContractArgs } from "../src/lib/stellar/live-encoding";
import type { LiveTransactionPreflightRpc } from "../src/lib/stellar/live-preflight";
import type { LiveTransactionSubmissionRpc } from "../src/lib/stellar/live-submission";

type GetTransactionResponse = Awaited<
  ReturnType<LiveTransactionSubmissionRpc["getTransaction"]>
>;

const projectRoot = process.cwd();
const databaseUrl = `file:./data/quorum-live-flow-smoke-${randomUUID()}.db`;
const eventId = "evt_apac_stellar_builder_meetup";
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));
const failureWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 5));
const fakeCoreContractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const fakePassContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
const fakeUsdcContractId = StrKey.encodeContract(Buffer.alloc(32, 9));
const txHash = Buffer.alloc(32, 21).toString("hex");
const failedTxHash = Buffer.alloc(32, 22).toString("hex");

function databasePath() {
  return path.resolve(projectRoot, databaseUrl.replace(/^file:/, ""));
}

function run(command: string, args: string[]) {
  execFileSync(command, args, {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
}

function cleanDatabaseFiles() {
  fs.rmSync(databasePath(), { force: true });
  fs.rmSync(`${databasePath()}-shm`, { force: true });
  fs.rmSync(`${databasePath()}-wal`, { force: true });
}

function getSuccess(hash: string): GetTransactionResponse {
  return {
    applicationOrder: 1,
    createdAt: Date.now(),
    feeBump: false,
    latestLedger: 42,
    latestLedgerCloseTime: Date.now(),
    ledger: 42,
    oldestLedger: 1,
    oldestLedgerCloseTime: Date.now(),
    returnValue: nativeToScVal(BigInt("9001"), { type: "u64" }),
    status: rpc.Api.GetTransactionStatus.SUCCESS,
    txHash: hash,
  } as GetTransactionResponse;
}

function getFailed(hash: string): GetTransactionResponse {
  return {
    ...getSuccess(hash),
    status: rpc.Api.GetTransactionStatus.FAILED,
  } as GetTransactionResponse;
}

async function main() {
  process.env.DATABASE_URL = databaseUrl;
  process.env.NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID = fakeCoreContractId;
  process.env.NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID = fakePassContractId;
  process.env.NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID = fakeUsdcContractId;
  process.env.NEXT_PUBLIC_STELLAR_NETWORK = "TESTNET";
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL =
    "https://soroban-testnet.stellar.org";
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE =
    "Test SDF Network ; September 2015";

  cleanDatabaseFiles();
  run("node", ["scripts/db-migrate.mjs"]);
  run("node", ["scripts/db-seed.mjs"]);

  const { getDatabase } = await import("../src/lib/db/client");
  const repository = await import("../src/lib/events/repository");
  const { prepareLiveContractAction } = await import(
    "../src/lib/stellar/live-action"
  );
  const { executePreparedLiveTransactionFlow } = await import(
    "../src/lib/stellar/live-flow"
  );

  const preparedAction = prepareLiveContractAction({
    action: "checkout_pass",
    eventId,
    signerWallet: attendeeWallet,
  });
  const purchaseArgs = preparedAction.args as PurchaseContractArgs;
  let preflightAccountCalls = 0;
  let preflightPrepareCalls = 0;
  let signCalls = 0;
  let sendCalls = 0;
  let pollCalls = 0;

  const preflightRpc: LiveTransactionPreflightRpc = {
    async getAccount(address: string) {
      preflightAccountCalls += 1;
      assert.equal(address, attendeeWallet);
      return new Account(address, "123456789");
    },
    async prepareTransaction(transaction: Transaction | FeeBumpTransaction) {
      preflightPrepareCalls += 1;
      return transaction;
    },
  };
  const signer: FreighterLiveSigner = {
    async signTransaction(transactionXdr, options) {
      signCalls += 1;
      assert.equal(options?.address, attendeeWallet);
      assert.equal(
        options?.networkPassphrase,
        "Test SDF Network ; September 2015",
      );

      return {
        signedTxXdr: transactionXdr,
        signerAddress: attendeeWallet,
      };
    },
  };
  const submissionRpc: LiveTransactionSubmissionRpc = {
    async sendTransaction(transaction) {
      sendCalls += 1;
      assert("source" in transaction);
      assert.equal(transaction.source, attendeeWallet);
      return {
        hash: txHash,
        latestLedger: 42,
        latestLedgerCloseTime: Date.now(),
        status: "PENDING",
      };
    },
    async getTransaction(hash) {
      pollCalls += 1;
      assert.equal(hash, txHash);
      return getSuccess(hash);
    },
  };

  const flowResult = await executePreparedLiveTransactionFlow({
    preflightRpc,
    preparedAction,
    signer,
    submissionOptions: {
      pollIntervalMs: 1,
      rpcServer: submissionRpc,
      timeoutMs: 100,
    },
  });

  assert.equal(flowResult.preparedTransaction.preparedForSigning, true);
  assert.equal(flowResult.signedTransaction.signerAddress, attendeeWallet);
  assert.equal(flowResult.submission.status, "SUCCESS");
  assert.equal(flowResult.submission.txHash, txHash);
  if (flowResult.submission.returnValue.kind !== "token_id") {
    throw new Error("Expected live checkout finality to return a token ID.");
  }
  const tokenId = flowResult.submission.returnValue.value;
  assert.equal(tokenId, "9001");
  assert.equal(preflightAccountCalls, 1);
  assert.equal(preflightPrepareCalls, 1);
  assert.equal(signCalls, 1);
  assert.equal(sendCalls, 1);
  assert.equal(pollCalls, 1);

  const passResult = repository.recordLivePass({
    eventId,
    metadataHash: purchaseArgs.metadataHashHex,
    metadataUri: purchaseArgs.metadataUri,
    ownerWallet: attendeeWallet,
    tokenId,
    txHash: flowResult.submission.txHash,
  });

  assert.equal(passResult.pass.ownerWallet, attendeeWallet);
  assert.equal(passResult.pass.mintTxHash, txHash);
  assert.equal(passResult.purchase.txHash, txHash);

  const failedAction = prepareLiveContractAction({
    action: "checkout_pass",
    eventId,
    signerWallet: failureWallet,
  });

  await assert.rejects(
    () =>
      executePreparedLiveTransactionFlow({
        preflightRpc: {
          async getAccount(address: string) {
            assert.equal(address, failureWallet);
            return new Account(address, "987654321");
          },
          async prepareTransaction(transaction: Transaction | FeeBumpTransaction) {
            return transaction;
          },
        },
        preparedAction: failedAction,
        signer: {
          async signTransaction(transactionXdr) {
            return {
              signedTxXdr: transactionXdr,
              signerAddress: failureWallet,
            };
          },
        },
        submissionOptions: {
          pollIntervalMs: 1,
          rpcServer: {
            async sendTransaction() {
              return {
                hash: failedTxHash,
                latestLedger: 42,
                latestLedgerCloseTime: Date.now(),
                status: "PENDING",
              };
            },
            async getTransaction(hash) {
              return getFailed(hash);
            },
          },
          timeoutMs: 100,
        },
      }),
    /transaction failed/,
  );

  assert.equal(
    repository.getPassByEventAndOwner(eventId, failureWallet),
    null,
    "failed live finality must not be persisted as a pass",
  );

  const db = getDatabase();
  const proofRows = [
    ...db.prepare("SELECT mint_tx_hash AS tx_hash FROM passes WHERE event_id = ?").all(eventId),
    ...db.prepare("SELECT tx_hash FROM purchases WHERE event_id = ?").all(eventId),
  ] as Array<{ tx_hash: string | null }>;

  assert(
    proofRows.every((row) => row.tx_hash && !row.tx_hash.startsWith("stub:")),
    "live flow smoke should only persist verified non-stub transaction hashes",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "prepare-action-from-db-state",
          "preflight-before-signing",
          "freighter-signing-options",
          "submit-and-poll-finality",
          "decode-token-id-from-finality",
          "persist-after-success-only",
          "reject-finality-failure-without-persistence",
        ],
        databasePath: databasePath(),
        persistedTokenId: passResult.pass.tokenId,
        txHash: flowResult.submission.txHash,
      },
      null,
      2,
    ),
  );
  db.close();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    cleanDatabaseFiles();
  });
