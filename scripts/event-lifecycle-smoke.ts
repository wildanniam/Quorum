import assert from "node:assert/strict";
import type { EventRecord } from "../src/lib/db/models";
import {
  EVENT_ENDED_CHECKOUT_MESSAGE,
  EVENT_ENDED_PUBLISH_MESSAGE,
  assertEventPassSalesOpen,
  assertEventPublishWindowOpen,
  eventLifecycleLabel,
  getEventLifecycle,
  hasEventEnded,
  isEventPassSalesOpen,
} from "../src/lib/events/lifecycle";
import { createFutureEventWindow } from "./demo-event-schedule.mjs";

const startDateTime = "2026-07-20T10:00:00.000Z";
const endDateTime = "2026-07-20T12:00:00.000Z";

function eventFixture(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    capacity: 50,
    coreEventId: null,
    coverImageUrl: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    endDateTime,
    eventType: "workshop",
    id: "evt_lifecycle_smoke",
    isFree: false,
    locationText: "Jakarta",
    locationType: "physical",
    meetingUrl: null,
    metadataHash: null,
    organizerWallet: "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF",
    priceUsdc: "5",
    publishTxHash: null,
    shortDescription: "Lifecycle smoke fixture for Quorum event policy.",
    slug: "lifecycle-smoke",
    startDateTime,
    status: "published",
    timezone: "Asia/Jakarta",
    title: "Lifecycle Smoke",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

const event = eventFixture();

assert.equal(
  getEventLifecycle(event, new Date("2026-07-20T09:59:59.999Z")),
  "upcoming",
);
assert.equal(
  getEventLifecycle(event, new Date(startDateTime)),
  "live",
  "the exact start time should be live",
);
assert.equal(
  getEventLifecycle(event, new Date("2026-07-20T11:59:59.999Z")),
  "live",
);
assert.equal(
  getEventLifecycle(event, new Date(endDateTime)),
  "ended",
  "the exact end time should close pass sales",
);
assert.equal(
  getEventLifecycle(eventFixture({ status: "draft" }), new Date(endDateTime)),
  "draft",
);
assert.equal(
  getEventLifecycle(eventFixture({ endDateTime: "invalid" }), new Date()),
  "ended",
  "invalid persisted dates must fail closed",
);
assert.equal(eventLifecycleLabel("live"), "Happening now");
assert.equal(eventLifecycleLabel("ended"), "Event ended");

assert.equal(
  isEventPassSalesOpen(event, new Date("2026-07-20T10:30:00.000Z")),
  true,
);
assert.equal(isEventPassSalesOpen(event, new Date(endDateTime)), false);
assert.equal(hasEventEnded(event, new Date(endDateTime)), true);

assert.throws(
  () => assertEventPassSalesOpen(event, new Date(endDateTime)),
  { message: EVENT_ENDED_CHECKOUT_MESSAGE },
);
assert.throws(
  () => assertEventPublishWindowOpen(event, new Date(endDateTime)),
  { message: EVENT_ENDED_PUBLISH_MESSAGE },
);

const referenceDate = new Date("2026-07-15T12:00:00.000Z");
const schedule = createFutureEventWindow({
  durationHours: 3,
  offsetDays: 7,
  referenceDate,
});

assert(Date.parse(schedule.startDateTime) > referenceDate.getTime());
assert.equal(
  Date.parse(schedule.endDateTime) - Date.parse(schedule.startDateTime),
  3 * 60 * 60 * 1000,
);

console.log("Event lifecycle smoke passed.");
