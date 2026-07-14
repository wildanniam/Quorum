const DAY_MS = 24 * 60 * 60 * 1000;

export function createFutureEventWindow({
  durationHours,
  offsetDays,
  referenceDate = new Date(),
  startHourUtc = 10,
}) {
  const reference = new Date(referenceDate);

  if (Number.isNaN(reference.getTime())) {
    throw new Error("Demo event schedule requires a valid reference date.");
  }

  const start = new Date(reference);
  start.setUTCHours(startHourUtc, 0, 0, 0);
  start.setTime(start.getTime() + offsetDays * DAY_MS);

  if (start.getTime() <= reference.getTime()) {
    start.setTime(start.getTime() + DAY_MS);
  }

  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  return {
    endDateTime: end.toISOString(),
    startDateTime: start.toISOString(),
  };
}
