import { timingSafeEqual } from "node:crypto";

export const MIN_INDEXER_CRON_SECRET_LENGTH = 32;

export type IndexerAuthorization =
  | { authorized: true }
  | { authorized: false; error: string; status: 401 | 503 };

export function indexerCronSecretError(secret: string | undefined) {
  const value = secret?.trim() ?? "";

  if (!value) {
    return "CRON_SECRET is not configured for the Stellar event indexer.";
  }

  if (value.length < MIN_INDEXER_CRON_SECRET_LENGTH) {
    return `CRON_SECRET must contain at least ${MIN_INDEXER_CRON_SECRET_LENGTH} characters.`;
  }

  if (/\r|\n/.test(secret ?? "")) {
    return "CRON_SECRET must not contain line breaks.";
  }

  return null;
}

export function authorizeIndexerRequest({
  authorization,
  secret,
}: {
  authorization: string | null;
  secret: string | undefined;
}): IndexerAuthorization {
  const configurationError = indexerCronSecretError(secret);

  if (configurationError) {
    return {
      authorized: false,
      error: configurationError,
      status: 503,
    };
  }

  const actual = Buffer.from(authorization ?? "");
  const expected = Buffer.from(`Bearer ${secret?.trim()}`);
  const matches =
    actual.length === expected.length && timingSafeEqual(actual, expected);

  if (!matches) {
    return {
      authorized: false,
      error: "Indexer cron authorization is invalid.",
      status: 401,
    };
  }

  return { authorized: true };
}
