import assert from "node:assert/strict";
import {
  SESSION_MAX_AGE_MS,
  createSessionToken,
  readSessionToken,
  resolveSessionSecret,
} from "../src/lib/auth/session";

const walletAddress = "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const validProductionSecret = "demo-production-session-secret-32-chars-minimum";

function assertSecretRejected(secret: string | undefined, label: string) {
  assert.throws(
    () =>
      resolveSessionSecret({
        NODE_ENV: "production",
        QUORUM_SESSION_SECRET: secret,
      }),
    /QUORUM_SESSION_SECRET/,
    label,
  );
}

assertSecretRejected(undefined, "production should reject a missing secret");
assertSecretRejected(
  "replace-with-a-long-random-secret",
  "production should reject the env example placeholder",
);
assertSecretRejected(
  "quorum-local-dev-session-secret",
  "production should reject the local development fallback",
);
assertSecretRejected("short-secret", "production should reject short secrets");
assert.equal(
  resolveSessionSecret({
    NODE_ENV: "production",
    QUORUM_SESSION_SECRET: validProductionSecret,
  }),
  validProductionSecret,
);

const token = createSessionToken(walletAddress);
const session = readSessionToken(token);
assert.equal(session?.walletAddress, walletAddress);

const now = Date.now();
const expiredToken = createSessionToken(walletAddress, now - SESSION_MAX_AGE_MS - 1);
const futureToken = createSessionToken(walletAddress, now + 60 * 60 * 1000);
assert.equal(readSessionToken(expiredToken, now), null);
assert.equal(readSessionToken(futureToken, now), null);

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "reject-missing-production-session-secret",
        "reject-placeholder-production-session-secret",
        "reject-local-fallback-production-session-secret",
        "reject-short-production-session-secret",
        "accept-valid-production-session-secret",
        "local-session-token-roundtrip",
        "reject-expired-session-token",
        "reject-future-session-token",
      ],
    },
    null,
    2,
  ),
);
