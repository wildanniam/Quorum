import assert from "node:assert/strict";
import {
  Account,
  Networks,
  StrKey,
  rpc,
  type FeeBumpTransaction,
  type Transaction,
} from "@stellar/stellar-sdk";
import type { PreparedLiveContractAction } from "../src/lib/stellar/live-action";
import {
  prepareLiveTransactionForSigning,
  type LiveTransactionPreflightRpc,
} from "../src/lib/stellar/live-preflight";
import type { SignedLiveTransaction } from "../src/lib/stellar/freighter-live-signing";
import {
  LiveTransactionSubmissionError,
  submitSignedLiveTransaction,
  type LiveTransactionSubmissionRpc,
} from "../src/lib/stellar/live-submission";

type GetTransactionResponse = Awaited<
  ReturnType<LiveTransactionSubmissionRpc["getTransaction"]>
>;

const fakeCoreContractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const fakePassContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
const fakeUsdcContractId = StrKey.encodeContract(Buffer.alloc(32, 9));
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));
const eventIdHex = "a7e602bb740076b86ae7a7f4d23b6738bc9eddf6d600ca67db3b72fe8d20aa67";
const metadataHashHex =
  "84aa0f60f0db1e95387b09ace00af75db46d7e7f2ea2ae0b499f7f94045fd7a8";
const txHash = Buffer.alloc(32, 19).toString("hex");

const preparedAction: PreparedLiveContractAction = {
  action: "checkout_pass",
  args: {
    buyer: attendeeWallet,
    eventIdHex,
    amountAtomic: "50000000",
    metadataUri: `quorum://events/apac-stellar-builder-meetup/passes/${attendeeWallet}`,
    metadataHashHex,
  },
  contractId: fakeCoreContractId,
  coreContractId: fakeCoreContractId,
  executionMode: "live_required",
  functionName: "purchase",
  network: "TESTNET",
  networkPassphrase: Networks.TESTNET,
  passContractId: fakePassContractId,
  proofMode: "live",
  rpcUrl: "https://soroban-testnet.stellar.org",
  signer: attendeeWallet,
  usdcContractId: fakeUsdcContractId,
};

const mockPreflightRpc: LiveTransactionPreflightRpc = {
  async getAccount(address: string) {
    return new Account(address, "123456789");
  },
  async prepareTransaction(transaction: Transaction | FeeBumpTransaction) {
    return transaction;
  },
};

function getMissing(hash: string): GetTransactionResponse {
  return {
    status: rpc.Api.GetTransactionStatus.NOT_FOUND,
    txHash: hash,
    latestLedger: 1,
    latestLedgerCloseTime: Date.now(),
    oldestLedger: 1,
    oldestLedgerCloseTime: Date.now(),
  };
}

function getSuccess(hash: string): GetTransactionResponse {
  return {
    ...getMissing(hash),
    applicationOrder: 1,
    createdAt: Date.now(),
    feeBump: false,
    ledger: 42,
    status: rpc.Api.GetTransactionStatus.SUCCESS,
  } as GetTransactionResponse;
}

function getFailed(hash: string): GetTransactionResponse {
  return {
    ...getSuccess(hash),
    status: rpc.Api.GetTransactionStatus.FAILED,
  } as GetTransactionResponse;
}

async function main() {
  const preparedForSigning = await prepareLiveTransactionForSigning({
    preparedAction,
    rpcServer: mockPreflightRpc,
  });
  const signedTransaction: SignedLiveTransaction = {
    action: preparedForSigning.action,
    contractId: preparedForSigning.contractId,
    functionName: preparedForSigning.functionName,
    networkPassphrase: preparedForSigning.networkPassphrase,
    signedTransactionXdr: preparedForSigning.preparedTransactionXdr,
    signerAddress: preparedForSigning.source,
  };
  let sendCalls = 0;
  let pollCalls = 0;

  const successRpc: LiveTransactionSubmissionRpc = {
    async sendTransaction(transaction) {
      sendCalls += 1;
      assert("source" in transaction);
      assert.equal(transaction.source, attendeeWallet);
      return {
        hash: txHash,
        latestLedger: 1,
        latestLedgerCloseTime: Date.now(),
        status: "PENDING",
      };
    },
    async getTransaction(hash) {
      pollCalls += 1;
      assert.equal(hash, txHash);
      return pollCalls === 1 ? getMissing(hash) : getSuccess(hash);
    },
  };

  const result = await submitSignedLiveTransaction({
    options: {
      pollIntervalMs: 1,
      rpcServer: successRpc,
      timeoutMs: 100,
    },
    signedTransaction,
  });

  assert.equal(sendCalls, 1);
  assert.equal(pollCalls, 2);
  assert.equal(result.status, "SUCCESS");
  assert.equal(result.txHash, txHash);
  assert.equal(result.ledger, 42);

  await assert.rejects(
    () =>
      submitSignedLiveTransaction({
        options: {
          pollIntervalMs: 1,
          rpcServer: {
            async sendTransaction() {
              return {
                hash: txHash,
                latestLedger: 1,
                latestLedgerCloseTime: Date.now(),
                status: "ERROR",
              };
            },
            async getTransaction(hash) {
              return getMissing(hash);
            },
          },
          timeoutMs: 50,
        },
        signedTransaction,
      }),
    (error) => {
      assert(error instanceof LiveTransactionSubmissionError);
      assert.match(error.message, /rejected/);
      assert.equal(error.txHash, txHash);
      return true;
    },
  );

  await assert.rejects(
    () =>
      submitSignedLiveTransaction({
        options: {
          pollIntervalMs: 1,
          rpcServer: {
            async sendTransaction() {
              return {
                hash: txHash,
                latestLedger: 1,
                latestLedgerCloseTime: Date.now(),
                status: "TRY_AGAIN_LATER",
              };
            },
            async getTransaction(hash) {
              return getMissing(hash);
            },
          },
          timeoutMs: 50,
        },
        signedTransaction,
      }),
    (error) => {
      assert(error instanceof LiveTransactionSubmissionError);
      assert.match(error.message, /retry/);
      assert.equal(error.txHash, txHash);
      return true;
    },
  );

  await assert.rejects(
    () =>
      submitSignedLiveTransaction({
        options: {
          pollIntervalMs: 1,
          rpcServer: {
            async sendTransaction() {
              return {
                hash: txHash,
                latestLedger: 1,
                latestLedgerCloseTime: Date.now(),
                status: "PENDING",
              };
            },
            async getTransaction(hash) {
              return getFailed(hash);
            },
          },
          timeoutMs: 50,
        },
        signedTransaction,
      }),
    (error) => {
      assert(error instanceof LiveTransactionSubmissionError);
      assert.match(error.message, /failed/);
      assert.equal(error.txHash, txHash);
      return true;
    },
  );

  await assert.rejects(
    () =>
      submitSignedLiveTransaction({
        options: {
          pollIntervalMs: 1,
          rpcServer: {
            async sendTransaction() {
              return {
                hash: txHash,
                latestLedger: 1,
                latestLedgerCloseTime: Date.now(),
                status: "PENDING",
              };
            },
            async getTransaction(hash) {
              return getMissing(hash);
            },
          },
          timeoutMs: 1,
        },
        signedTransaction,
      }),
    (error) => {
      assert(error instanceof LiveTransactionSubmissionError);
      assert.match(error.message, /Timed out/);
      assert.equal(error.txHash, txHash);
      return true;
    },
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "submit-signed-transaction",
          "poll-until-success",
          "reject-submission-error",
          "reject-submission-retry-later",
          "reject-finality-failure",
          "reject-finality-timeout",
        ],
        ledger: result.ledger,
        pollCalls,
        txHash: result.txHash,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
