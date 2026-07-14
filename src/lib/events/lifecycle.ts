import type { EventRecord } from "@/lib/db/models";

export type EventLifecycle = "draft" | "ended" | "live" | "upcoming";

type EventLifecycleInput = Pick<
  EventRecord,
  "endDateTime" | "startDateTime" | "status"
>;

export const EVENT_ENDED_CHECKOUT_MESSAGE =
  "Pass sales are closed because this event has ended.";
export const EVENT_ENDED_PUBLISH_MESSAGE =
  "This event cannot be published because its end time has passed.";

function timestamp(value: string) {
  const result = Date.parse(value);

  return Number.isFinite(result) ? result : null;
}

function nowTimestamp(now: Date) {
  const result = now.getTime();

  if (!Number.isFinite(result)) {
    throw new Error("Event lifecycle requires a valid reference time.");
  }

  return result;
}

export function hasEventEnded(
  event: Pick<EventLifecycleInput, "endDateTime">,
  now = new Date(),
) {
  const end = timestamp(event.endDateTime);

  // Invalid persisted dates fail closed so checkout and publishing cannot proceed.
  return end === null || nowTimestamp(now) >= end;
}

export function getEventLifecycle(
  event: EventLifecycleInput,
  now = new Date(),
): EventLifecycle {
  if (event.status === "draft") {
    return "draft";
  }

  const start = timestamp(event.startDateTime);
  const end = timestamp(event.endDateTime);
  const current = nowTimestamp(now);

  if (start === null || end === null || end <= start || current >= end) {
    return "ended";
  }

  return current < start ? "upcoming" : "live";
}

export function isEventPassSalesOpen(
  event: EventLifecycleInput,
  now = new Date(),
) {
  const lifecycle = getEventLifecycle(event, now);

  return lifecycle === "upcoming" || lifecycle === "live";
}

export function assertEventPassSalesOpen(
  event: EventLifecycleInput,
  now = new Date(),
) {
  if (event.status !== "published") {
    throw new Error("Passes can only be issued for published events.");
  }

  if (!isEventPassSalesOpen(event, now)) {
    throw new Error(EVENT_ENDED_CHECKOUT_MESSAGE);
  }
}

export function assertEventPublishWindowOpen(
  event: Pick<EventLifecycleInput, "endDateTime">,
  now = new Date(),
) {
  if (hasEventEnded(event, now)) {
    throw new Error(EVENT_ENDED_PUBLISH_MESSAGE);
  }
}

export function eventLifecycleLabel(lifecycle: EventLifecycle) {
  if (lifecycle === "live") return "Happening now";
  if (lifecycle === "upcoming") return "Upcoming";
  if (lifecycle === "ended") return "Event ended";

  return "Draft";
}
