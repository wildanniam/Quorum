import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
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
import { execute, query, quoteIdentifier } from "../src/lib/db/client";
import type { PreparedLiveContractAction } from "../src/lib/stellar/live-action";
import type { PurchaseContractArgs } from "../src/lib/stellar/live-encoding";
import type { LiveTransactionPreflightRpc } from "../src/lib/stellar/live-preflight";
import type { LiveTransactionSubmissionRpc } from "../src/lib/stellar/live-submission";
import { createFutureEventWindow } from "./demo-event-schedule.mjs";

type GetTransactionResponse = Awaited<
  ReturnType<LiveTransactionSubmissionRpc["getTransaction"]>
>;

const projectRoot = process.cwd();
const databaseSchema = `quorum_live_flow_smoke_${randomUUID().replaceAll("-", "_")}`;
const freeEventId = "evt_stellar_open_office_hours";
const organizerWallet = "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const speakerWallet = "GC33PRL24QY6EUIHOJT6ITM34QHBJOIFXO4UBL3AS2RECIDIPFAF6YDH";
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));
const freeAttendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 6));
const failureWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 5));
const fakeCoreContractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const fakePassContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
const fakeUsdcContractId = StrKey.encodeContract(Buffer.alloc(32, 9));

function txHash(seed: number) {
  return Buffer.alloc(32, seed).toString("hex");
}

function run(command: string, args: string[]) {
  execFileSync(process.platform === "win32" && command === "npm" ? "npm.cmd" : command, args, {
    cwd: projectRoot,
    env: { ...process.env, QUORUM_DB_SCHEMA: databaseSchema },
    stdio: "pipe",
  });
}

function getSuccess(
  hash: string,
  returnValue?: ReturnType<typeof nativeToScVal>,
): GetTransactionResponse {
  return {
    applicationOrder: 1,
    createdAt: Date.now(),
    feeBump: false,
    latestLedger: 42,
    latestLedgerCloseTime: Date.now(),
    ledger: 42,
    oldestLedger: 1,
    oldestLedgerCloseTime: Date.now(),
    ...(returnValue ? { returnValue } : {}),
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
  process.env.QUORUM_DB_SCHEMA = databaseSchema;
  process.env.NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID = fakeCoreContractId;
  process.env.NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID = fakePassContractId;
  process.env.NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID = fakeUsdcContractId;
  process.env.NEXT_PUBLIC_STELLAR_NETWORK = "TESTNET";
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL =
    "https://soroban-testnet.stellar.org";
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE =
    "Test SDF Network ; September 2015";

  run("node", ["scripts/db-migrate.mjs"]);
  run("node", ["scripts/db-seed.mjs"]);

  const repository = await import("../src/lib/events/repository");
  const { prepareLiveContractAction } = await import(
    "../src/lib/stellar/live-action"
  );
  const { executePreparedLiveTransactionFlow } = await import(
    "../src/lib/stellar/live-flow"
  );
  const { persistLiveTransactionResult } = await import(
    "../src/lib/stellar/live-result-persistence"
  );

  let preflightAccountCalls = 0;
  let preflightPrepareCalls = 0;
  let signCalls = 0;
  let sendCalls = 0;
  let pollCalls = 0;
  const draftSchedule = createFutureEventWindow({
    durationHours: 2,
    offsetDays: 21,
  });

  async function runLiveFlow({
    expectedSigner,
    preparedAction,
    returnValue,
    transactionHash,
  }: {
    expectedSigner: string;
    preparedAction: PreparedLiveContractAction;
    returnValue?: ReturnType<typeof nativeToScVal>;
    transactionHash: string;
  }) {
    const preflightRpc: LiveTransactionPreflightRpc = {
      async getAccount(address: string) {
        preflightAccountCalls += 1;
        assert.equal(address, expectedSigner);
        return new Account(address, String(123456789 + preflightAccountCalls));
      },
      async prepareTransaction(transaction: Transaction | FeeBumpTransaction) {
        preflightPrepareCalls += 1;
        return transaction;
      },
    };
    const signer: FreighterLiveSigner = {
      async signTransaction(transactionXdr, options) {
        signCalls += 1;
        assert.equal(options?.address, expectedSigner);
        assert.equal(
          options?.networkPassphrase,
          "Test SDF Network ; September 2015",
        );

        return {
          signedTxXdr: transactionXdr,
          signerAddress: expectedSigner,
        };
      },
    };
    const submissionRpc: LiveTransactionSubmissionRpc = {
      async sendTransaction(transaction) {
        sendCalls += 1;
        assert("source" in transaction);
        assert.equal(transaction.source, expectedSigner);
        return {
          hash: transactionHash,
          latestLedger: 42,
          latestLedgerCloseTime: Date.now(),
          status: "PENDING",
        };
      },
      async getTransaction(hash) {
        pollCalls += 1;
        assert.equal(hash, transactionHash);
        return getSuccess(hash, returnValue);
      },
    };

    return executePreparedLiveTransactionFlow({
      preflightRpc,
      preparedAction,
      signer,
      submissionOptions: {
        pollIntervalMs: 1,
        rpcServer: submissionRpc,
        timeoutMs: 100,
      },
    });
  }

  const draft = await repository.createDraftEventWithSetup(
    {
      slug: `live-flow-${randomUUID().slice(0, 8)}`,
      title: "Live Flow Smoke",
      eventType: "workshop",
      shortDescription:
        "A smoke-test draft for the full mock live transaction chain.",
      coverImageUrl: null,
      startDateTime: draftSchedule.startDateTime,
      endDateTime: draftSchedule.endDateTime,
      timezone: "Asia/Jakarta",
      locationType: "hybrid",
      locationText: "Jakarta + livestream",
      meetingUrl: "https://example.com/live-flow",
      isFree: false,
      priceUsdc: "7",
      capacity: 42,
      organizerWallet,
    },
    [
      {
        displayName: "Live Flow Host",
        role: "Host",
        walletAddress: organizerWallet,
        splitPercentage: 60,
      },
      {
        displayName: "Live Flow Speaker",
        role: "Speaker",
        walletAddress: speakerWallet,
        splitPercentage: 40,
      },
    ],
    [
      {
        title: "Live Flow Resource",
        description: "Gated resource used by full live flow smoke.",
        type: "link",
        url: "https://example.com/live-flow-resource",
        sortOrder: 1,
      },
    ],
  );
  const publishAction = await prepareLiveContractAction({
    action: "publish_event",
    eventId: draft.event.id,
    signerWallet: organizerWallet,
  });
  const publishFlow = await runLiveFlow({
    expectedSigner: organizerWallet,
    preparedAction: publishAction,
    transactionHash: txHash(21),
  });
  assert.equal(publishFlow.submission.returnValue.kind, "void");

  const persistedPublish = await persistLiveTransactionResult({
    eventId: draft.event.id,
    preparedAction: publishAction,
    submission: publishFlow.submission,
  });
  assert.equal(persistedPublish.action, "publish_event");
  const published = persistedPublish.result;
  assert.equal(published.event.status, "published");
  assert.equal(published.event.publishTxHash, txHash(21));

  const checkoutAction = await prepareLiveContractAction({
    action: "checkout_pass",
    eventId: published.event.id,
    signerWallet: attendeeWallet,
  });
  const checkoutFlow = await runLiveFlow({
    expectedSigner: attendeeWallet,
    preparedAction: checkoutAction,
    returnValue: nativeToScVal(BigInt("9001"), { type: "u64" }),
    transactionHash: txHash(22),
  });
  assert.equal(checkoutFlow.preparedTransaction.preparedForSigning, true);
  assert.equal(checkoutFlow.signedTransaction.signerAddress, attendeeWallet);
  assert.equal(checkoutFlow.submission.status, "SUCCESS");
  if (checkoutFlow.submission.returnValue.kind !== "token_id") {
    throw new Error("Expected live checkout finality to return a token ID.");
  }
  const tokenId = checkoutFlow.submission.returnValue.value;
  assert.equal(tokenId, "9001");

  const persistedPass = await persistLiveTransactionResult({
    eventId: published.event.id,
    preparedAction: checkoutAction,
    submission: checkoutFlow.submission,
  });
  assert.equal(persistedPass.action, "checkout_pass");
  assert.equal(persistedPass.tokenId, tokenId);
  const passResult = persistedPass.result;

  assert.equal(passResult.pass.ownerWallet, attendeeWallet);
  assert.equal(passResult.pass.mintTxHash, txHash(22));
  assert.equal(passResult.purchase.txHash, txHash(22));

  const freeClaimAction = await prepareLiveContractAction({
    action: "checkout_pass",
    eventId: freeEventId,
    signerWallet: freeAttendeeWallet,
  });
  const freeClaimArgs = freeClaimAction.args as PurchaseContractArgs;
  assert.equal(freeClaimArgs.amountAtomic, "0");
  const freeClaimFlow = await runLiveFlow({
    expectedSigner: freeAttendeeWallet,
    preparedAction: freeClaimAction,
    returnValue: nativeToScVal(BigInt("9002"), { type: "u64" }),
    transactionHash: txHash(26),
  });
  if (freeClaimFlow.submission.returnValue.kind !== "token_id") {
    throw new Error("Expected live free claim finality to return a token ID.");
  }
  const freeTokenId = freeClaimFlow.submission.returnValue.value;
  assert.equal(freeTokenId, "9002");
  const persistedFreePass = await persistLiveTransactionResult({
    eventId: freeEventId,
    preparedAction: freeClaimAction,
    submission: freeClaimFlow.submission,
  });
  assert.equal(persistedFreePass.action, "checkout_pass");
  assert.equal(persistedFreePass.tokenId, freeTokenId);
  const freePassResult = persistedFreePass.result;
  assert.equal(freePassResult.pass.source, "free_claim");
  assert.equal(freePassResult.pass.mintTxHash, txHash(26));
  assert.equal(freePassResult.purchase.amountUsdc, "0");
  assert.equal(freePassResult.purchase.txHash, txHash(26));

  const checkInAction = await prepareLiveContractAction({
    action: "check_in_pass",
    eventId: published.event.id,
    signerWallet: organizerWallet,
    tokenId,
  });
  const checkInFlow = await runLiveFlow({
    expectedSigner: organizerWallet,
    preparedAction: checkInAction,
    transactionHash: txHash(23),
  });
  assert.equal(checkInFlow.submission.returnValue.kind, "void");
  const persistedCheckIn = await persistLiveTransactionResult({
    eventId: published.event.id,
    preparedAction: checkInAction,
    submission: checkInFlow.submission,
  });
  assert.equal(persistedCheckIn.action, "check_in_pass");
  const checkInResult = persistedCheckIn.result;
  assert.equal(checkInResult.pass.checkedIn, true);
  assert.equal(checkInResult.checkIn.txHash, txHash(23));

  const withdrawAction = await prepareLiveContractAction({
    action: "withdraw_balance",
    eventId: published.event.id,
    signerWallet: speakerWallet,
  });
  const withdrawFlow = await runLiveFlow({
    expectedSigner: speakerWallet,
    preparedAction: withdrawAction,
    returnValue: nativeToScVal(BigInt("28000000"), { type: "i128" }),
    transactionHash: txHash(24),
  });
  if (withdrawFlow.submission.returnValue.kind !== "withdraw_amount_atomic") {
    throw new Error("Expected live withdraw finality to return an amount.");
  }
  const persistedWithdrawal = await persistLiveTransactionResult({
    eventId: published.event.id,
    preparedAction: withdrawAction,
    submission: withdrawFlow.submission,
  });
  assert.equal(persistedWithdrawal.action, "withdraw_balance");
  assert.equal(persistedWithdrawal.amountUsdc, "2.8");
  const withdrawalResult = persistedWithdrawal.result;
  assert.equal(withdrawalResult.withdrawal.amountUsdc, "2.8");
  assert.equal(withdrawalResult.withdrawal.txHash, txHash(24));

  await assert.rejects(
    () =>
      persistLiveTransactionResult({
        eventId: published.event.id,
        preparedAction: checkoutAction,
        submission: {
          ...checkoutFlow.submission,
          action: "withdraw_balance",
        },
      }),
    /does not match/,
  );

  assert.equal(preflightAccountCalls, 5);
  assert.equal(preflightPrepareCalls, 5);
  assert.equal(signCalls, 5);
  assert.equal(sendCalls, 5);
  assert.equal(pollCalls, 5);

  const failedAction = await prepareLiveContractAction({
    action: "checkout_pass",
    eventId: published.event.id,
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
                hash: txHash(25),
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
    await repository.getPassByEventAndOwner(published.event.id, failureWallet),
    null,
    "failed live finality must not be persisted as a pass",
  );

  const proofRows = [
    ...(await query<{ tx_hash: string | null }>(
      "SELECT publish_tx_hash AS tx_hash FROM events WHERE id = $1",
      [published.event.id],
    )),
    ...(await query<{ tx_hash: string | null }>(
      "SELECT mint_tx_hash AS tx_hash FROM passes WHERE event_id = $1",
      [published.event.id],
    )),
    ...(await query<{ tx_hash: string | null }>(
      "SELECT tx_hash FROM purchases WHERE event_id = $1",
      [published.event.id],
    )),
    ...(await query<{ tx_hash: string | null }>(
      "SELECT tx_hash FROM check_ins WHERE event_id = $1",
      [published.event.id],
    )),
    ...(await query<{ tx_hash: string | null }>(
      "SELECT tx_hash FROM withdrawals WHERE event_id = $1",
      [published.event.id],
    )),
    ...(await query<{ tx_hash: string | null }>(
      "SELECT mint_tx_hash AS tx_hash FROM passes WHERE event_id = $1",
      [freeEventId],
    )),
    ...(await query<{ tx_hash: string | null }>(
      "SELECT tx_hash FROM purchases WHERE event_id = $1",
      [freeEventId],
    )),
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
          "publish-live-flow",
          "checkout-live-flow",
          "free-claim-live-flow",
          "check-in-live-flow",
          "withdraw-live-flow",
          "decode-token-id-from-finality",
          "decode-withdraw-amount-from-finality",
          "persist-live-result-helper",
          "reject-mismatched-live-result",
          "persist-after-success-only",
          "reject-finality-failure-without-persistence",
        ],
        databaseSchema,
        persistedEventId: published.event.id,
        persistedTokenId: passResult.pass.tokenId,
        persistedFreeTokenId: freePassResult.pass.tokenId,
        persistedWithdrawUsdc: withdrawalResult.withdrawal.amountUsdc,
        txHashes: [
          publishFlow.submission.txHash,
          checkoutFlow.submission.txHash,
          freeClaimFlow.submission.txHash,
          checkInFlow.submission.txHash,
          withdrawFlow.submission.txHash,
        ],
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
    if (process.env.QUORUM_DB_SCHEMA) {
      await execute(
        `DROP SCHEMA IF EXISTS ${quoteIdentifier(process.env.QUORUM_DB_SCHEMA)} CASCADE`,
      );
    }
  });
