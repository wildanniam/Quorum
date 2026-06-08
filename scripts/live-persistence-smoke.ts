import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { StrKey } from "@stellar/stellar-sdk";

const projectRoot = process.cwd();
const databaseUrl = `file:./data/quorum-live-persistence-smoke-${randomUUID()}.db`;
const eventId = "evt_apac_stellar_builder_meetup";
const freeEventId = "evt_stellar_open_office_hours";
const organizerWallet = "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const speakerWallet = "GC33PRL24QY6EUIHOJT6ITM34QHBJOIFXO4UBL3AS2RECIDIPFAF6YDH";
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));
const freeAttendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 5));

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

function txHash(seed: number) {
  return Buffer.alloc(32, seed).toString("hex");
}

function expectThrow(fn: () => unknown, message: string) {
  assert.throws(fn, (error) => {
    assert(error instanceof Error);
    assert.match(error.message, new RegExp(message));
    return true;
  });
}

async function main() {
  process.env.DATABASE_URL = databaseUrl;
  fs.rmSync(databasePath(), { force: true });
  fs.rmSync(`${databasePath()}-shm`, { force: true });
  fs.rmSync(`${databasePath()}-wal`, { force: true });

  run("node", ["scripts/db-migrate.mjs"]);
  run("node", ["scripts/db-seed.mjs"]);

  const dbModule = await import("../src/lib/db/client");
  const repository = await import("../src/lib/events/repository");

  const draft = repository.createDraftEventWithSetup(
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

  const publishResult = repository.recordLivePublishedEvent({
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

  const replayDraft = repository.createDraftEventWithSetup(
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
  expectThrow(
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

  const passResult = repository.recordLivePass({
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

  expectThrow(
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

  const freePassResult = repository.recordLivePass({
    eventId: freeEventId,
    metadataHash: txHash(23),
    metadataUri: `quorum://events/stellar-open-office-hours/passes/${freeAttendeeWallet}`,
    ownerWallet: freeAttendeeWallet,
    tokenId: "54321",
    txHash: txHash(19),
  });
  assert.equal(freePassResult.pass.tokenId, "54321");
  assert.equal(freePassResult.purchase.amountUsdc, "0");

  const checkInResult = repository.recordLiveCheckIn({
    checkedInByWallet: organizerWallet,
    eventId,
    tokenId: "12345",
    txHash: txHash(15),
  });
  assert.equal(checkInResult.pass.checkedIn, true);
  assert.equal(checkInResult.checkIn.txHash, txHash(15));

  expectThrow(
    () =>
      repository.recordLiveCheckIn({
        checkedInByWallet: organizerWallet,
        eventId: freeEventId,
        tokenId: "54321",
        txHash: txHash(15),
      }),
    "already recorded",
  );

  expectThrow(
    () =>
      repository.recordLiveWithdrawal({
        amountUsdc: "1.5",
        collaboratorWallet: speakerWallet,
        eventId,
        txHash: txHash(16),
      }),
    "exceeds withdrawable balance",
  );

  const withdrawalResult = repository.recordLiveWithdrawal({
    amountUsdc: "1",
    collaboratorWallet: speakerWallet,
    eventId,
    txHash: txHash(17),
  });
  assert.equal(withdrawalResult.withdrawal.amountUsdc, "1");
  assert.equal(withdrawalResult.withdrawal.txHash, txHash(17));

  expectThrow(
    () =>
      repository.recordLiveWithdrawal({
        amountUsdc: "1",
        collaboratorWallet: speakerWallet,
        eventId,
        txHash: txHash(17),
      }),
    "already recorded",
  );
  expectThrow(
    () =>
      repository.recordLiveWithdrawal({
        amountUsdc: "0.1",
        collaboratorWallet: speakerWallet,
        eventId,
        txHash: txHash(18),
      }),
    "exceeds withdrawable balance",
  );

  expectThrow(
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
  expectThrow(
    () =>
      repository.recordLiveCheckIn({
        checkedInByWallet: organizerWallet,
        eventId,
        tokenId: "12345",
        txHash: txHash(18),
      }),
    "already checked in",
  );

  const db = dbModule.getDatabase();
  const proofRows = [
    ...db.prepare("SELECT publish_tx_hash AS tx_hash FROM events WHERE id = ?").all(draft.event.id),
    ...db.prepare("SELECT mint_tx_hash AS tx_hash FROM passes WHERE event_id = ?").all(eventId),
    ...db.prepare("SELECT tx_hash FROM purchases WHERE event_id = ?").all(eventId),
    ...db.prepare("SELECT tx_hash FROM check_ins WHERE event_id = ?").all(eventId),
    ...db.prepare("SELECT tx_hash FROM withdrawals WHERE event_id = ?").all(eventId),
  ] as Array<{ tx_hash: string | null }>;

  assert(
    proofRows.every((row) => row.tx_hash && !row.tx_hash.startsWith("stub:")),
    "live persistence smoke should not store stub transaction hashes",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        databasePath: databasePath(),
        checks: [
          "record-live-publish",
          "record-live-pass",
          "record-live-check-in",
          "record-live-withdrawal",
          "reject-stub-live-hash",
          "reject-duplicate-live-publish-tx",
          "reject-duplicate-live-pass-tx",
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
  dbModule.getDatabase().close();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    fs.rmSync(databasePath(), { force: true });
    fs.rmSync(`${databasePath()}-shm`, { force: true });
    fs.rmSync(`${databasePath()}-wal`, { force: true });
  });
