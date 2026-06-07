import assert from "node:assert/strict";
import { StrKey } from "@stellar/stellar-sdk";
import type {
  CollaboratorRecord,
  EventRecord,
  ResourceRecord,
} from "../src/lib/db/models";
import {
  BPS_DENOMINATOR,
  deriveEventIdHex,
  prepareCheckInContractArgs,
  prepareCreateEventContractArgs,
  preparePurchaseContractArgs,
  prepareWithdrawContractArgs,
  splitPercentageToBps,
  usdcToAtomicUnits,
} from "../src/lib/stellar/live-encoding";

const organizerWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 1));
const speakerWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 2));
const partnerWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 3));
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));
const fakePassContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
const fakeUsdcContractId = StrKey.encodeContract(Buffer.alloc(32, 9));

function eventFixture(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    id: "evt_apac_stellar_builder_meetup",
    slug: "apac-stellar-builder-meetup",
    title: "APAC Stellar Builder Meetup",
    eventType: "Paid Web3 Meetup + Mini Workshop",
    shortDescription:
      "A builder meetup with USDC split escrow, non-transferable NFT passes, gated resources, and check-in proof.",
    coverImageUrl: null,
    startDateTime: "2026-06-21T11:30:00.000Z",
    endDateTime: "2026-06-21T14:30:00.000Z",
    timezone: "Asia/Jakarta",
    locationType: "hybrid",
    locationText: "Jakarta + livestream",
    meetingUrl: "https://example.com/livestream",
    priceUsdc: "5",
    isFree: false,
    capacity: 80,
    status: "published",
    organizerWallet,
    metadataHash: "sha256:demo-metadata-hash",
    coreEventId: null,
    publishTxHash: "testnet:demo-publish-stub",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

function collaboratorsFixture(): CollaboratorRecord[] {
  return [
    {
      id: "col_demo_organizer",
      eventId: "evt_apac_stellar_builder_meetup",
      displayName: "Jakarta Stellar Guild",
      role: "Organizer",
      walletAddress: organizerWallet,
      splitPercentage: 70,
      createdAt: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "col_demo_speaker",
      eventId: "evt_apac_stellar_builder_meetup",
      displayName: "Soroban Mentor",
      role: "Speaker",
      walletAddress: speakerWallet,
      splitPercentage: 20,
      createdAt: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "col_demo_partner",
      eventId: "evt_apac_stellar_builder_meetup",
      displayName: "SEA Builders",
      role: "Community Partner",
      walletAddress: partnerWallet,
      splitPercentage: 10,
      createdAt: "2026-06-01T00:00:00.000Z",
    },
  ];
}

function resourcesFixture(): ResourceRecord[] {
  return [
    {
      id: "res_demo_deck",
      eventId: "evt_apac_stellar_builder_meetup",
      title: "Workshop Deck",
      description: "Slides unlocked after pass mint.",
      type: "link",
      url: "https://example.com/deck",
      sortOrder: 1,
      createdAt: "2026-06-01T00:00:00.000Z",
    },
  ];
}

function expectThrow(fn: () => unknown, message: string) {
  assert.throws(fn, (error) => {
    assert(error instanceof Error);
    assert.match(error.message, new RegExp(message));
    return true;
  });
}

assert.equal(usdcToAtomicUnits("5").toString(), "50000000");
assert.equal(usdcToAtomicUnits("0.0000001").toString(), "1");
assert.equal(usdcToAtomicUnits("12.3400000").toString(), "123400000");
expectThrow(() => usdcToAtomicUnits("1.00000001"), "at most 7");
expectThrow(() => usdcToAtomicUnits("-1"), "non-negative");

assert.equal(splitPercentageToBps(70), 7000);
assert.equal(splitPercentageToBps(0.25), 25);

const event = eventFixture();
const collaborators = collaboratorsFixture();
const resources = resourcesFixture();
const eventIdHex = deriveEventIdHex(event.id);

assert.match(eventIdHex, /^[a-f0-9]{64}$/);
assert.equal(eventIdHex, deriveEventIdHex(event.id));

const createArgs = prepareCreateEventContractArgs({
  collaborators,
  event,
  passContractId: fakePassContractId,
  resources,
  usdcContractId: fakeUsdcContractId,
});

assert.equal(createArgs.organizer, organizerWallet);
assert.equal(createArgs.eventIdHex, eventIdHex);
assert.equal(createArgs.priceAtomic, "50000000");
assert.equal(createArgs.currencyContractId, fakeUsdcContractId);
assert.equal(createArgs.passContractId, fakePassContractId);
assert.equal(createArgs.capacity, 80);
assert.equal(createArgs.isFree, false);
assert.equal(
  createArgs.splits.reduce((total, split) => total + split.percentBps, 0),
  BPS_DENOMINATOR,
);
assert.deepEqual(
  createArgs.splits.map((split) => split.percentBps),
  [7000, 2000, 1000],
);
assert.match(createArgs.metadataHashHex, /^[a-f0-9]{64}$/);

const purchaseArgs = preparePurchaseContractArgs({
  buyerWallet: attendeeWallet,
  event,
});
assert.equal(purchaseArgs.buyer, attendeeWallet);
assert.equal(purchaseArgs.eventIdHex, eventIdHex);
assert.equal(purchaseArgs.amountAtomic, "50000000");
assert.equal(
  purchaseArgs.metadataUri,
  `quorum://events/${event.slug}/passes/${attendeeWallet}`,
);
assert.match(purchaseArgs.metadataHashHex, /^[a-f0-9]{64}$/);

const freePurchaseArgs = preparePurchaseContractArgs({
  buyerWallet: attendeeWallet,
  event: eventFixture({ isFree: true, priceUsdc: "0" }),
});
assert.equal(freePurchaseArgs.amountAtomic, "0");

const checkInArgs = prepareCheckInContractArgs({
  event,
  organizerWallet,
  tokenId: BigInt(42),
});
assert.equal(checkInArgs.eventIdHex, eventIdHex);
assert.equal(checkInArgs.tokenId, "42");
expectThrow(
  () => prepareCheckInContractArgs({ event, organizerWallet, tokenId: "42.5" }),
  "non-negative integer",
);

const withdrawArgs = prepareWithdrawContractArgs({
  collaboratorWallet: speakerWallet,
  event,
});
assert.equal(withdrawArgs.collaborator, speakerWallet);
assert.equal(withdrawArgs.eventIdHex, eventIdHex);

expectThrow(
  () =>
    prepareCreateEventContractArgs({
      collaborators,
      event,
      passContractId: "not-a-contract",
      resources,
      usdcContractId: fakeUsdcContractId,
    }),
  "Pass contract ID",
);
expectThrow(
  () =>
    prepareCreateEventContractArgs({
      collaborators: collaborators.slice(0, 2),
      event,
      passContractId: fakePassContractId,
      resources,
      usdcContractId: fakeUsdcContractId,
    }),
  "total 10000",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      eventIdHex,
      priceAtomic: createArgs.priceAtomic,
      splitBps: createArgs.splits.map((split) => split.percentBps),
      purchaseAmountAtomic: purchaseArgs.amountAtomic,
      checks: [
        "usdc-atomic-conversion",
        "event-id-derivation",
        "create-event-args",
        "purchase-args",
        "free-purchase-args",
        "check-in-args",
        "withdraw-args",
        "invalid-live-args",
      ],
    },
    null,
    2,
  ),
);
