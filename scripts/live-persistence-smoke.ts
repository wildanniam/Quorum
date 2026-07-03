import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { StrKey } from "@stellar/stellar-sdk";
import { execute, query, quoteIdentifier } from "../src/lib/db/client";

const projectRoot = process.cwd();
const databaseSchema = `quorum_live_persistence_smoke_${randomUUID().replaceAll("-", "_")}`;
const eventId = "evt_apac_stellar_builder_meetup";
const freeEventId = "evt_stellar_open_office_hours";
const organizerWallet = "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const speakerWallet = "GC33PRL24QY6EUIHOJT6ITM34QHBJOIFXO4UBL3AS2RECIDIPFAF6YDH";
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));
const freeAttendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 5));

function run(command: string, args: string[]) {
  execFileSync(process.platform === "win32" && command === "npm" ? "npm.cmd" : command, args, {
    cwd: projectRoot,
    env: { ...process.env, QUORUM_DB_SCHEMA: databaseSchema },
    stdio: "pipe",
  });
}

function txHash(seed: number) {
  return Buffer.alloc(32, seed).toString("hex");
}

async function expectReject(fn: () => Promise<unknown>, message: string) {
  await assert.rejects(fn, (error) => {
    assert(error instanceof Error);
    assert.match(error.message, new RegExp(message));
    return true;
  });
}

async function main() {
  process.env.QUORUM_DB_SCHEMA = databaseSchema;

  run("node", ["scripts/db-migrate.mjs"]);
  run("node", ["scripts/db-seed.mjs"]);

  const repository = await import("../src/lib/events/repository");

  const draft = await repository.createDraftEventWithSetup(
    {
      slug: `live-persistence-${randomUUID().slice(0, 8)}`,
      title: "Live Persistence Smoke",
      eventType: "workshop",
      shortDescription:
        "A smoke-test draft for recording verified live transaction results.",
      coverImageUrl: null,
      startDateTime: "2026-07-01T10:00:00.000Z",
      endDateTime: "2026-07-01T12:00:00.000Z",
      timezone: "Asia/Jakarta",
      locationType: "hybrid",
      locationText: "Jakarta + livestream",
      meetingUrl: "https://example.com/live-persistence",
      isFree: false,
      priceUsdc: "7",
      capacity: 42,
      organizerWallet,
    },
    [
      {
        displayName: "Live Persistence Host",
        role: "Host",
        walletAddress: organizerWallet,
        splitPercentage: 60,
      },
      {
        displayName: "Live Persistence Speaker",
        role: "Speaker",
        walletAddress: speakerWallet,
        splitPercentage: 40,
      },
    ],
    [
      {
        title: "Live Persistence Resource",
        description: "Gated resource used by live persistence smoke.",
        type: "link",
        url: "https://example.com/live-persistence-resource",
        sortOrder: 1,
      },
    ],
  );

  const publishResult = await repository.recordLivePublishedEvent({
    coreEventId: txHash(10),
    eventId: draft.event.id,
    metadataHash: txHash(11),
    organizerWallet,
    publishTxHash: txHash(12),
  });
  assert.equal(publishResult.event.status, "published");
  assert.equal(publishResult.event.coreEventId, txHash(10));
  assert.equal(publishResult.event.publishTxHash, txHash(12));
  assert.equal(publishResult.event.metadataHash, `sha256:${txHash(11)}`);

  const replayDraft = await repository.createDraftEventWithSetup(
    {
      slug: `live-persistence-replay-${randomUUID().slice(0, 8)}`,
      title: "Live Persistence Replay Smoke",
      eventType: "workshop",
      shortDescription:
        "A smoke-test draft for rejecting replayed publish transaction hashes.",
      coverImageUrl: null,
      startDateTime: "2026-07-02T10:00:00.000Z",
      endDateTime: "2026-07-02T12:00:00.000Z",
      timezone: "Asia/Jakarta",
      locationType: "hybrid",
      locationText: "Jakarta + livestream",
      meetingUrl: "https://example.com/live-persistence-replay",
      isFree: false,
      priceUsdc: "7",
      capacity: 42,
      organizerWallet,
    },
    [
      {
        displayName: "Live Persistence Replay Host",
        role: "Host",
        walletAddress: organizerWallet,
        splitPercentage: 60,
      },
      {
        displayName: "Live Persistence Replay Speaker",
        role: "Speaker",
        walletAddress: speakerWallet,
        splitPercentage: 40,
      },
    ],
    [
      {
        title: "Live Persistence Replay Resource",
        description: "Gated resource used by live persistence replay smoke.",
        type: "link",
        url: "https://example.com/live-persistence-replay-resource",
        sortOrder: 1,
      },
    ],
  );
  await expectReject(
    () =>
      repository.recordLivePublishedEvent({
        coreEventId: txHash(20),
        eventId: replayDraft.event.id,
        metadataHash: txHash(21),
        organizerWallet,
        publishTxHash: txHash(12),
      }),
    "already recorded",
  );

  const passResult = await repository.recordLivePass({
    eventId,
    metadataHash: txHash(13),
    metadataUri: `quorum://events/apac-stellar-builder-meetup/passes/${attendeeWallet}`,
    ownerWallet: attendeeWallet,
    tokenId: "12345",
    txHash: txHash(14),
  });
  assert.equal(passResult.pass.tokenId, "12345");
  assert.equal(passResult.pass.mintTxHash, txHash(14));
  assert.equal(passResult.pass.metadataHash, `sha256:${txHash(13)}`);
  assert.equal(passResult.purchase.txHash, txHash(14));
  assert.equal(passResult.purchase.status, "succeeded");

  await expectReject(
    () =>
      repository.recordLivePass({
        eventId: freeEventId,
        metadataHash: txHash(22),
        metadataUri: `quorum://events/stellar-open-office-hours/passes/${freeAttendeeWallet}`,
        ownerWallet: freeAttendeeWallet,
        tokenId: "54320",
        txHash: txHash(14),
      }),
    "already recorded",
  );

  const freePassResult = await repository.recordLivePass({
    eventId: freeEventId,
    metadataHash: txHash(23),
    metadataUri: `quorum://events/stellar-open-office-hours/passes/${freeAttendeeWallet}`,
    ownerWallet: freeAttendeeWallet,
    tokenId: "54321",
    txHash: txHash(19),
  });
  assert.equal(freePassResult.pass.tokenId, "54321");
  assert.equal(freePassResult.purchase.amountUsdc, "0");

  const checkInResult = await repository.recordLiveCheckIn({
    checkedInByWallet: organizerWallet,
    eventId,
    tokenId: "12345",
    txHash: txHash(15),
  });
  assert.equal(checkInResult.pass.checkedIn, true);
  assert.equal(checkInResult.checkIn.txHash, txHash(15));

  await expectReject(
    () =>
      repository.recordLiveCheckIn({
        checkedInByWallet: organizerWallet,
        eventId: freeEventId,
        tokenId: "54321",
        txHash: txHash(15),
      }),
    "already recorded",
  );

  await expectReject(
    () =>
      repository.recordLiveWithdrawal({
        amountUsdc: "0.1",
        collaboratorWallet: speakerWallet,
        eventId,
        txHash: txHash(14),
      }),
    "already recorded",
  );

  await expectReject(
    () =>
      repository.recordLiveWithdrawal({
        amountUsdc: "1.5",
        collaboratorWallet: speakerWallet,
        eventId,
        txHash: txHash(16),
      }),
    "exceeds withdrawable balance",
  );

  const withdrawalResult = await repository.recordLiveWithdrawal({
    amountUsdc: "1",
    collaboratorWallet: speakerWallet,
    eventId,
    txHash: txHash(17),
  });
  assert.equal(withdrawalResult.withdrawal.amountUsdc, "1");
  assert.equal(withdrawalResult.withdrawal.txHash, txHash(17));

  await expectReject(
    () =>
      repository.recordLiveWithdrawal({
        amountUsdc: "1",
        collaboratorWallet: speakerWallet,
        eventId,
        txHash: txHash(17),
      }),
    "already recorded",
  );
  await expectReject(
    () =>
      repository.recordLiveWithdrawal({
        amountUsdc: "0.1",
        collaboratorWallet: speakerWallet,
        eventId,
        txHash: txHash(18),
      }),
    "exceeds withdrawable balance",
  );

  await expectReject(
    () =>
      repository.recordLivePass({
        eventId,
        metadataHash: txHash(17),
        metadataUri: "quorum://events/apac-stellar-builder-meetup/passes/bad",
        ownerWallet: StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 5)),
        tokenId: "12346",
        txHash: "stub:purchase",
      }),
    "Live transaction hash",
  );
  await expectReject(
    () =>
      repository.recordLiveCheckIn({
        checkedInByWallet: organizerWallet,
        eventId,
        tokenId: "12345",
        txHash: txHash(18),
      }),
    "already checked in",
  );

  const proofRows = [
    ...(await query<{ tx_hash: string | null }>(
      "SELECT publish_tx_hash AS tx_hash FROM events WHERE id = $1",
      [draft.event.id],
    )),
    ...(await query<{ tx_hash: string | null }>(
      "SELECT mint_tx_hash AS tx_hash FROM passes WHERE event_id = $1",
      [eventId],
    )),
    ...(await query<{ tx_hash: string | null }>(
      "SELECT tx_hash FROM purchases WHERE event_id = $1",
      [eventId],
    )),
    ...(await query<{ tx_hash: string | null }>(
      "SELECT tx_hash FROM check_ins WHERE event_id = $1",
      [eventId],
    )),
    ...(await query<{ tx_hash: string | null }>(
      "SELECT tx_hash FROM withdrawals WHERE event_id = $1",
      [eventId],
    )),
  ] as Array<{ tx_hash: string | null }>;

  assert(
    proofRows.every((row) => row.tx_hash && !row.tx_hash.startsWith("stub:")),
    "live persistence smoke should not store stub transaction hashes",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        databaseSchema,
        checks: [
          "record-live-publish",
          "record-live-pass",
          "record-live-check-in",
          "record-live-withdrawal",
          "reject-stub-live-hash",
          "reject-duplicate-live-publish-tx",
          "reject-duplicate-live-pass-tx",
          "reject-cross-table-live-hash-replay",
          "reject-duplicate-live-check-in",
          "reject-duplicate-live-check-in-tx",
          "reject-live-withdrawal-overdraw",
          "reject-duplicate-live-withdrawal-tx",
          "no-stub-live-records",
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
