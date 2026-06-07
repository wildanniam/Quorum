import assert from "node:assert/strict";
import {
  Account,
  Networks,
  StrKey,
  type FeeBumpTransaction,
  type Transaction,
} from "@stellar/stellar-sdk";
import type { PreparedLiveContractAction } from "../src/lib/stellar/live-action";
import {
  prepareLiveTransactionForSigning,
  type LiveTransactionPreflightRpc,
} from "../src/lib/stellar/live-preflight";
import {
  FreighterLiveSigningError,
  signPreparedLiveTransaction,
  type FreighterLiveSigner,
} from "../src/lib/stellar/freighter-live-signing";

const fakeCoreContractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const fakePassContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
const fakeUsdcContractId = StrKey.encodeContract(Buffer.alloc(32, 9));
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));
const otherWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 5));
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

const mockRpc: LiveTransactionPreflightRpc = {
  async getAccount(address: string) {
    assert.equal(address, attendeeWallet);
    return new Account(address, "123456789");
  },
  async prepareTransaction(transaction: Transaction | FeeBumpTransaction) {
    return transaction;
  },
};

async function main() {
  const preparedTransaction = await prepareLiveTransactionForSigning({
    preparedAction,
    rpcServer: mockRpc,
  });
  const withdrawPreparedTransaction = await prepareLiveTransactionForSigning({
    preparedAction: {
      ...preparedAction,
      action: "withdraw_balance",
      args: {
        collaborator: attendeeWallet,
        eventIdHex,
      },
      functionName: "withdraw",
    },
    rpcServer: mockRpc,
  });
  const otherContractPreparedTransaction = await prepareLiveTransactionForSigning({
    preparedAction: {
      ...preparedAction,
      contractId: fakePassContractId,
    },
    rpcServer: mockRpc,
  });
  let signCalls = 0;

  const signer: FreighterLiveSigner = {
    async signTransaction(transactionXdr, options) {
      signCalls += 1;
      assert.equal(transactionXdr, preparedTransaction.preparedTransactionXdr);
      assert.equal(options?.address, attendeeWallet);
      assert.equal(options?.networkPassphrase, Networks.TESTNET);

      return {
        signedTxXdr: transactionXdr,
        signerAddress: attendeeWallet,
      };
    },
  };

  const signed = await signPreparedLiveTransaction({
    preparedTransaction,
    signer,
  });

  assert.equal(signCalls, 1);
  assert.equal(signed.action, "checkout_pass");
  assert.equal(signed.functionName, "purchase");
  assert.equal(signed.signerAddress, attendeeWallet);
  assert.equal(signed.signedTransactionXdr, preparedTransaction.preparedTransactionXdr);

  await assert.rejects(
    () =>
      signPreparedLiveTransaction({
        preparedTransaction,
        signer: {
          async signTransaction(transactionXdr) {
            return {
              signedTxXdr: transactionXdr,
              signerAddress: otherWallet,
            };
          },
        },
      }),
    (error) => {
      assert(error instanceof FreighterLiveSigningError);
      assert.match(error.message, /different wallet/);
      return true;
    },
  );

  await assert.rejects(
    () =>
      signPreparedLiveTransaction({
        preparedTransaction,
        signer: {
          async signTransaction() {
            return {
              error: { message: "User rejected the request." },
              signedTxXdr: "",
              signerAddress: "",
            };
          },
        },
      }),
    (error) => {
      assert(error instanceof FreighterLiveSigningError);
      assert.match(error.message, /User rejected/);
      return true;
    },
  );

  await assert.rejects(
    () =>
      signPreparedLiveTransaction({
        preparedTransaction: {
          ...preparedTransaction,
          preparedTransactionXdr: "not-xdr",
        },
        signer,
      }),
    (error) => {
      assert(error instanceof FreighterLiveSigningError);
      return true;
    },
  );

  let preparedMismatchSignCalls = 0;

  await assert.rejects(
    () =>
      signPreparedLiveTransaction({
        preparedTransaction: {
          ...preparedTransaction,
          preparedTransactionXdr:
            withdrawPreparedTransaction.preparedTransactionXdr,
        },
        signer: {
          async signTransaction(transactionXdr) {
            preparedMismatchSignCalls += 1;

            return {
              signedTxXdr: transactionXdr,
              signerAddress: attendeeWallet,
            };
          },
        },
      }),
    (error) => {
      assert(error instanceof FreighterLiveSigningError);
      assert.match(error.message, /function/);
      return true;
    },
  );
  assert.equal(preparedMismatchSignCalls, 0);

  let preparedContractMismatchSignCalls = 0;

  await assert.rejects(
    () =>
      signPreparedLiveTransaction({
        preparedTransaction: {
          ...preparedTransaction,
          preparedTransactionXdr:
            otherContractPreparedTransaction.preparedTransactionXdr,
        },
        signer: {
          async signTransaction(transactionXdr) {
            preparedContractMismatchSignCalls += 1;

            return {
              signedTxXdr: transactionXdr,
              signerAddress: attendeeWallet,
            };
          },
        },
      }),
    (error) => {
      assert(error instanceof FreighterLiveSigningError);
      assert.match(error.message, /contract ID/);
      return true;
    },
  );
  assert.equal(preparedContractMismatchSignCalls, 0);

  let signedMismatchSignCalls = 0;

  await assert.rejects(
    () =>
      signPreparedLiveTransaction({
        preparedTransaction,
        signer: {
          async signTransaction() {
            signedMismatchSignCalls += 1;

            return {
              signedTxXdr: withdrawPreparedTransaction.preparedTransactionXdr,
              signerAddress: attendeeWallet,
            };
          },
        },
      }),
    (error) => {
      assert(error instanceof FreighterLiveSigningError);
      assert.match(error.message, /function/);
      return true;
    },
  );
  assert.equal(signedMismatchSignCalls, 1);

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "freighter-sign-transaction-options",
          "signed-xdr-parseable",
          "reject-signer-mismatch",
          "normalize-wallet-rejection",
          "reject-invalid-prepared-xdr",
          "reject-prepared-xdr-function-mismatch-before-wallet",
          "reject-prepared-xdr-contract-mismatch-before-wallet",
          "reject-signed-xdr-function-mismatch",
        ],
        signedXdrLength: signed.signedTransactionXdr.length,
        signerAddress: signed.signerAddress,
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
