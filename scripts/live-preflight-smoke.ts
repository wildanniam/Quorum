import assert from "node:assert/strict";
import {
  Account,
  Networks,
  StrKey,
  TransactionBuilder,
  type FeeBumpTransaction,
  type Transaction,
} from "@stellar/stellar-sdk";
import type { PreparedLiveContractAction } from "../src/lib/stellar/live-action";
import {
  LiveTransactionPreflightError,
  prepareLiveTransactionForSigning,
  type LiveTransactionPreflightRpc,
} from "../src/lib/stellar/live-preflight";
import { parseLiveTransactionFunctionName } from "../src/lib/stellar/live-xdr";

const fakeCoreContractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const fakePassContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
const fakeUsdcContractId = StrKey.encodeContract(Buffer.alloc(32, 9));
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));
const eventIdHex = "a7e602bb740076b86ae7a7f4d23b6738bc9eddf6d600ca67db3b72fe8d20aa67";
const metadataHashHex =
  "84aa0f60f0db1e95387b09ace00af75db46d7e7f2ea2ae0b499f7f94045fd7a8";

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

async function main() {
  let getAccountCalls = 0;
  let prepareTransactionCalls = 0;

  const mockRpc: LiveTransactionPreflightRpc = {
    async getAccount(address: string) {
      getAccountCalls += 1;
      assert.equal(address, attendeeWallet);
      return new Account(address, "123456789");
    },
    async prepareTransaction(transaction: Transaction | FeeBumpTransaction) {
      prepareTransactionCalls += 1;
      assert("source" in transaction);
      assert.equal(transaction.source, attendeeWallet);
      assert.equal(transaction.sequence, "123456790");
      return transaction;
    },
  };

  const preparedForSigning = await prepareLiveTransactionForSigning({
    preparedAction,
    rpcServer: mockRpc,
    timeoutSeconds: 180,
  });

  assert.equal(getAccountCalls, 1);
  assert.equal(prepareTransactionCalls, 1);
  assert.equal(preparedForSigning.preparedForSigning, true);
  assert.equal(preparedForSigning.simulationRequired, false);
  assert.equal(preparedForSigning.source, attendeeWallet);
  assert.equal(preparedForSigning.sourceSequence, "123456789");
  assert.equal(preparedForSigning.timeoutSeconds, 180);
  assert.equal(
    parseLiveTransactionFunctionName({
      networkPassphrase: Networks.TESTNET,
      unsignedTransactionXdr: preparedForSigning.preparedTransactionXdr,
    }),
    "purchase",
  );
  assert.equal(
    TransactionBuilder.fromXDR(
      preparedForSigning.preparedTransactionXdr,
      Networks.TESTNET,
    ).operations.length,
    1,
  );

  await assert.rejects(
    () =>
      prepareLiveTransactionForSigning({
        preparedAction,
        rpcServer: {
          async getAccount() {
            throw new Error("account not found");
          },
          async prepareTransaction(transaction: Transaction | FeeBumpTransaction) {
            return transaction;
          },
        },
      }),
    (error) => {
      assert(error instanceof LiveTransactionPreflightError);
      assert.match(error.message, /account not found/);
      return true;
    },
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "fetch-source-account",
          "build-raw-live-transaction",
          "prepare-transaction-for-signing",
          "prepared-xdr-parseable",
          "preflight-error-normalization",
        ],
        functionName: "purchase",
        preparedXdrLength: preparedForSigning.preparedTransactionXdr.length,
        sourceSequence: preparedForSigning.sourceSequence,
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
