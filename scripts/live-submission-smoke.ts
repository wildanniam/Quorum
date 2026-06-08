import assert from "node:assert/strict";
import {
  Account,
  Networks,
  StrKey,
  nativeToScVal,
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
const otherWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 5));
const eventIdHex = "a7e602bb740076b86ae7a7f4d23b6738bc9eddf6d600ca67db3b72fe8d20aa67";
const metadataHashHex =
  "84aa0f60f0db1e95387b09ace00af75db46d7e7f2ea2ae0b499f7f94045fd7a8";
const txHash = Buffer.alloc(32, 19).toString("hex");
const withdrawTxHash = Buffer.alloc(32, 20).toString("hex");
const duplicateTxHash = Buffer.alloc(32, 21).toString("hex");

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

function getSuccess(
  hash: string,
  returnValue = nativeToScVal(BigInt("9001"), { type: "u64" }),
): GetTransactionResponse {
  return {
    ...getMissing(hash),
    applicationOrder: 1,
    createdAt: Date.now(),
    feeBump: false,
    ledger: 42,
    returnValue,
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
    invocationArgsXdr: preparedForSigning.invocationArgsXdr,
    networkPassphrase: preparedForSigning.networkPassphrase,
    signedTransactionXdr: preparedForSigning.preparedTransactionXdr,
    signerAddress: preparedForSigning.source,
  };
  const withdrawPreparedAction: PreparedLiveContractAction = {
    ...preparedAction,
    action: "withdraw_balance",
    args: {
      collaborator: attendeeWallet,
      eventIdHex,
    },
    functionName: "withdraw",
  };
  const withdrawPreparedForSigning = await prepareLiveTransactionForSigning({
    preparedAction: withdrawPreparedAction,
    rpcServer: mockPreflightRpc,
  });
  const otherContractPreparedForSigning = await prepareLiveTransactionForSigning({
    preparedAction: {
      ...preparedAction,
      contractId: fakePassContractId,
    },
    rpcServer: mockPreflightRpc,
  });
  const otherArgsPreparedForSigning = await prepareLiveTransactionForSigning({
    preparedAction: {
      ...preparedAction,
      args: {
        ...preparedAction.args,
        amountAtomic: "60000000",
      },
    },
    rpcServer: mockPreflightRpc,
  });
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
  assert.deepEqual(result.returnValue, {
    kind: "token_id",
    value: "9001",
  });

  let duplicatePollCalls = 0;

  const duplicateResult = await submitSignedLiveTransaction({
    options: {
      pollIntervalMs: 1,
      rpcServer: {
        async sendTransaction(transaction) {
          assert("source" in transaction);
          assert.equal(transaction.source, attendeeWallet);
          return {
            hash: duplicateTxHash,
            latestLedger: 1,
            latestLedgerCloseTime: Date.now(),
            status: "DUPLICATE",
          };
        },
        async getTransaction(hash) {
          duplicatePollCalls += 1;
          assert.equal(hash, duplicateTxHash);
          return getSuccess(hash, nativeToScVal(BigInt("9003"), { type: "u64" }));
        },
      },
      timeoutMs: 100,
    },
    signedTransaction,
  });

  assert.equal(duplicatePollCalls, 1);
  assert.equal(duplicateResult.status, "SUCCESS");
  assert.equal(duplicateResult.txHash, duplicateTxHash);
  assert.deepEqual(duplicateResult.returnValue, {
    kind: "token_id",
    value: "9003",
  });

  let sourceMismatchSendCalls = 0;

  await assert.rejects(
    () =>
      submitSignedLiveTransaction({
        options: {
          rpcServer: {
            async sendTransaction() {
              sourceMismatchSendCalls += 1;
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
        },
        signedTransaction: {
          ...signedTransaction,
          signerAddress: otherWallet,
        },
      }),
    (error) => {
      assert(error instanceof LiveTransactionSubmissionError);
      assert.match(error.message, /source/);
      assert.equal(error.txHash, undefined);
      return true;
    },
  );
  assert.equal(sourceMismatchSendCalls, 0);

  let functionMismatchSendCalls = 0;

  await assert.rejects(
    () =>
      submitSignedLiveTransaction({
        options: {
          rpcServer: {
            async sendTransaction() {
              functionMismatchSendCalls += 1;
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
        },
        signedTransaction: {
          ...signedTransaction,
          signedTransactionXdr: withdrawPreparedForSigning.preparedTransactionXdr,
        },
      }),
    (error) => {
      assert(error instanceof LiveTransactionSubmissionError);
      assert.match(error.message, /function/);
      assert.equal(error.txHash, undefined);
      return true;
    },
  );
  assert.equal(functionMismatchSendCalls, 0);

  let contractMismatchSendCalls = 0;

  await assert.rejects(
    () =>
      submitSignedLiveTransaction({
        options: {
          rpcServer: {
            async sendTransaction() {
              contractMismatchSendCalls += 1;
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
        },
        signedTransaction: {
          ...signedTransaction,
          signedTransactionXdr:
            otherContractPreparedForSigning.preparedTransactionXdr,
        },
      }),
    (error) => {
      assert(error instanceof LiveTransactionSubmissionError);
      assert.match(error.message, /contract ID/);
      assert.equal(error.txHash, undefined);
      return true;
    },
  );
  assert.equal(contractMismatchSendCalls, 0);

  let argumentMismatchSendCalls = 0;

  await assert.rejects(
    () =>
      submitSignedLiveTransaction({
        options: {
          rpcServer: {
            async sendTransaction() {
              argumentMismatchSendCalls += 1;
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
        },
        signedTransaction: {
          ...signedTransaction,
          signedTransactionXdr:
            otherArgsPreparedForSigning.preparedTransactionXdr,
        },
      }),
    (error) => {
      assert(error instanceof LiveTransactionSubmissionError);
      assert.match(error.message, /arguments/);
      assert.equal(error.txHash, undefined);
      return true;
    },
  );
  assert.equal(argumentMismatchSendCalls, 0);

  const withdrawResult = await submitSignedLiveTransaction({
    options: {
      pollIntervalMs: 1,
      rpcServer: {
        async sendTransaction() {
          return {
            hash: withdrawTxHash,
            latestLedger: 1,
            latestLedgerCloseTime: Date.now(),
            status: "PENDING",
          };
        },
        async getTransaction(hash) {
          assert.equal(hash, withdrawTxHash);
          return getSuccess(
            hash,
            nativeToScVal(BigInt("15000000"), { type: "i128" }),
          );
        },
      },
      timeoutMs: 100,
    },
    signedTransaction: {
      ...signedTransaction,
      action: "withdraw_balance",
      functionName: "withdraw",
      invocationArgsXdr: withdrawPreparedForSigning.invocationArgsXdr,
      signedTransactionXdr: withdrawPreparedForSigning.preparedTransactionXdr,
    },
  });

  assert.deepEqual(withdrawResult.returnValue, {
    kind: "withdraw_amount_atomic",
    value: "15000000",
  });

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
                status: "PENDING",
              };
            },
            async getTransaction(hash) {
              return {
                ...getSuccess(hash),
                returnValue: undefined,
              } as GetTransactionResponse;
            },
          },
          timeoutMs: 50,
        },
        signedTransaction,
      }),
    (error) => {
      assert(error instanceof LiveTransactionSubmissionError);
      assert.match(error.message, /token ID/);
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
              return getSuccess(hash, nativeToScVal(true));
            },
          },
          timeoutMs: 50,
        },
        signedTransaction,
      }),
    (error) => {
      assert(error instanceof LiveTransactionSubmissionError);
      assert.match(error.message, /return value type/);
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
          "accept-duplicate-submission-status",
          "decode-purchase-token-id",
          "decode-withdraw-amount",
          "reject-source-mismatch-before-rpc",
          "reject-function-mismatch-before-rpc",
          "reject-contract-mismatch-before-rpc",
          "reject-argument-mismatch-before-rpc",
          "reject-submission-error",
          "reject-submission-retry-later",
          "reject-finality-failure",
          "reject-finality-timeout",
          "reject-missing-return-value",
          "reject-wrong-return-value-type",
        ],
        ledger: result.ledger,
        pollCalls,
        tokenId: result.returnValue.value,
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
