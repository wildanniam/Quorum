import assert from "node:assert/strict";
import {
  Account,
  Networks,
  StrKey,
  type FeeBumpTransaction,
  type Transaction,
} from "@stellar/stellar-sdk";
import type { FreighterLiveSigner } from "../src/lib/stellar/freighter-live-signing";
import type { PreparedLiveContractAction } from "../src/lib/stellar/live-action";
import {
  prepareLiveTransactionForSigning,
  type LiveTransactionPreflightRpc,
} from "../src/lib/stellar/live-preflight";
import {
  LiveBrowserFlowError,
  executeLiveBrowserContractAction,
} from "../src/lib/stellar/live-browser-flow";

const fakeCoreContractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const fakePassContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
const fakeUsdcContractId = StrKey.encodeContract(Buffer.alloc(32, 9));
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));
const otherWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 5));
const eventId = "evt_apac_stellar_builder_meetup";
const eventIdHex = "a7e602bb740076b86ae7a7f4d23b6738bc9eddf6d600ca67db3b72fe8d20aa67";
const metadataHashHex =
  "84aa0f60f0db1e95387b09ace00af75db46d7e7f2ea2ae0b499f7f94045fd7a8";
const txHash = Buffer.alloc(32, 21).toString("hex");

const preparedAction: PreparedLiveContractAction = {
  action: "checkout_pass",
  args: {
    amountAtomic: "50000000",
    buyer: attendeeWallet,
    eventIdHex,
    metadataHashHex,
    metadataUri: `quorum://events/apac-stellar-builder-meetup/passes/${attendeeWallet}`,
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

async function main() {
  const preparedTransaction = await prepareLiveTransactionForSigning({
    preparedAction,
    rpcServer: mockPreflightRpc,
  });
  const calls: string[] = [];
  let signedXdrSeen: string | null = null;

  const signer: FreighterLiveSigner = {
    async signTransaction(transactionXdr, options) {
      calls.push("sign");
      assert.equal(transactionXdr, preparedTransaction.preparedTransactionXdr);
      assert.equal(options?.address, attendeeWallet);
      assert.equal(options?.networkPassphrase, Networks.TESTNET);

      return {
        signedTxXdr: transactionXdr,
        signerAddress: attendeeWallet,
      };
    },
  };
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    const path = String(url);
    calls.push(path);

    if (path.endsWith("/contract-action/preflight")) {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.action, "checkout_pass");
      assert.equal(body.timeoutSeconds, 60);

      return jsonResponse({
        preparedAction,
        preparedTransaction,
      });
    }

    if (path.endsWith("/contract-action")) {
      const body = JSON.parse(String(init?.body));
      signedXdrSeen = body.signedTransactionXdr;
      assert.equal(body.action, "checkout_pass");
      assert.equal(body.pollIntervalMs, 100);
      assert.equal(body.timeoutMs, 5000);

      return jsonResponse(
        {
          action: "checkout_pass",
          proofMode: "live",
          submission: {
            ledger: 42,
            returnValue: {
              kind: "token_id",
              value: "9001",
            },
            status: "SUCCESS",
            txHash,
          },
          tokenId: "9001",
          txHash,
        },
        201,
      );
    }

    throw new Error(`Unexpected fetch URL: ${path}`);
  };

  const result = await executeLiveBrowserContractAction({
    action: "checkout_pass",
    eventId,
    fetcher,
    pollIntervalMs: 100,
    signer,
    submissionTimeoutMs: 5000,
    timeoutSeconds: 60,
  });

  assert.deepEqual(calls, [
    `/api/events/${eventId}/contract-action/preflight`,
    "sign",
    `/api/events/${eventId}/contract-action`,
  ]);
  assert.equal(signedXdrSeen, preparedTransaction.preparedTransactionXdr);
  assert.equal(result.preparedAction.action, "checkout_pass");
  assert.equal(result.signedTransaction.signerAddress, attendeeWallet);

  await assert.rejects(
    () =>
      executeLiveBrowserContractAction({
        action: "checkout_pass",
        eventId,
        fetcher: async () => jsonResponse({ error: "preflight failed" }, 409),
        signer,
      }),
    (error) => {
      assert(error instanceof LiveBrowserFlowError);
      assert.equal(error.step, "preflight");
      assert.equal(error.status, 409);
      assert.equal(error.message, "preflight failed");
      return true;
    },
  );

  await assert.rejects(
    () =>
      executeLiveBrowserContractAction({
        action: "checkout_pass",
        eventId,
        fetcher: async (url) =>
          String(url).endsWith("/preflight")
            ? jsonResponse({ preparedAction, preparedTransaction })
            : jsonResponse({ error: "submit failed" }, 502),
        signer,
      }),
    (error) => {
      assert(error instanceof LiveBrowserFlowError);
      assert.equal(error.step, "submit");
      assert.equal(error.status, 502);
      assert.equal(error.message, "submit failed");
      return true;
    },
  );

  let mismatchSignCalls = 0;
  let mismatchSubmitCalls = 0;
  await assert.rejects(
    () =>
      executeLiveBrowserContractAction({
        action: "checkout_pass",
        eventId,
        fetcher: async (url) => {
          const path = String(url);

          if (path.endsWith("/preflight")) {
            return jsonResponse({
              preparedAction,
              preparedTransaction: {
                ...preparedTransaction,
                source: otherWallet,
              },
            });
          }

          mismatchSubmitCalls += 1;
          return jsonResponse({ error: "unexpected submit" }, 500);
        },
        signer: {
          async signTransaction(transactionXdr) {
            mismatchSignCalls += 1;

            return {
              signedTxXdr: transactionXdr,
              signerAddress: attendeeWallet,
            };
          },
        },
      }),
    (error) => {
      assert(error instanceof LiveBrowserFlowError);
      assert.equal(error.step, "preflight");
      assert.equal(error.status, 502);
      assert.equal(
        error.message,
        "Live preflight metadata did not match the requested action.",
      );
      return true;
    },
  );
  assert.equal(mismatchSignCalls, 0);
  assert.equal(mismatchSubmitCalls, 0);

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "browser-live-preflight-sign-submit",
          "browser-live-signer-options",
          "browser-live-submit-signed-xdr",
          "browser-live-preflight-error",
          "browser-live-submit-error",
          "browser-live-reject-mismatched-preflight",
        ],
        txHash,
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
