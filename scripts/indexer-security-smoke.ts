import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  authorizeIndexerRequest,
  indexerCronSecretError,
} from "../src/lib/stellar/indexer-auth";
import {
  resolveIndexerCheckpoint,
  validateIndexerRunOptions,
} from "../src/lib/stellar/indexer";

const secret = "quorum-indexer-cron-secret-32-chars";

const missing = authorizeIndexerRequest({
  authorization: null,
  secret: undefined,
});
assert.equal(missing.authorized, false);
assert.equal(missing.status, 503);

const weak = authorizeIndexerRequest({
  authorization: "Bearer short",
  secret: "short",
});
assert.equal(weak.authorized, false);
assert.equal(weak.status, 503);

const invalid = authorizeIndexerRequest({
  authorization: "Bearer wrong-secret-value-that-is-long-enough",
  secret,
});
assert.equal(invalid.authorized, false);
assert.equal(invalid.status, 401);

assert.deepEqual(
  authorizeIndexerRequest({
    authorization: `Bearer ${secret}`,
    secret,
  }),
  { authorized: true },
);

assert.match(
  indexerCronSecretError(`${secret}\n`) ?? "",
  /line breaks/,
);

assert.deepEqual(
  validateIndexerRunOptions({
    cursor: null,
    limit: 100,
    startLedger: 123,
  }),
  { cursor: null, limit: 100, startLedger: 123 },
);
assert.throws(
  () =>
    validateIndexerRunOptions({
      cursor: "cursor-1",
      limit: 100,
      startLedger: 123,
    }),
  /cursor and start ledger cannot be combined/i,
);
assert.throws(
  () =>
    validateIndexerRunOptions({
      cursor: null,
      limit: 0,
      startLedger: null,
    }),
  /between 1 and 500/i,
);
assert.deepEqual(
  resolveIndexerCheckpoint({
    currentCursor: "cursor-103",
    currentLatestLedger: 103,
    nextCursor: "cursor-102",
    observedLatestLedger: 102,
  }),
  { cursor: "cursor-103", latestLedger: 103 },
);

async function main() {
  const { GET } = await import(
    "../src/app/api/indexer/stellar-events/route"
  );
  const originalCronSecret = process.env.CRON_SECRET;

  try {
    delete process.env.CRON_SECRET;
    const unconfiguredResponse = await GET(
      new NextRequest("http://localhost/api/indexer/stellar-events"),
    );
    assert.equal(unconfiguredResponse.status, 503);

    process.env.CRON_SECRET = secret;
    const unauthorizedResponse = await GET(
      new NextRequest("http://localhost/api/indexer/stellar-events", {
        headers: { authorization: "Bearer wrong" },
      }),
    );
    assert.equal(unauthorizedResponse.status, 401);

    const invalidQueryResponse = await GET(
      new NextRequest("http://localhost/api/indexer/stellar-events?limit=abc", {
        headers: { authorization: `Bearer ${secret}` },
      }),
    );
    assert.equal(invalidQueryResponse.status, 400);

    const conflictingQueryResponse = await GET(
      new NextRequest(
        "http://localhost/api/indexer/stellar-events?cursor=cursor-1&startLedger=100",
        { headers: { authorization: `Bearer ${secret}` } },
      ),
    );
    assert.equal(conflictingQueryResponse.status, 400);
  } finally {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "reject-missing-indexer-cron-secret",
          "reject-weak-indexer-cron-secret",
          "reject-invalid-indexer-bearer",
          "accept-valid-indexer-bearer",
          "reject-indexer-cron-secret-line-breaks",
          "validate-indexer-run-parameters",
          "preserve-monotonic-indexer-checkpoint",
          "indexer-route-fails-closed",
          "indexer-route-rejects-invalid-query",
        ],
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
