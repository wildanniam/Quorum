import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const CHALLENGE_COOKIE = "quorum_challenge";
export const SESSION_COOKIE = "quorum_session";
export const CHALLENGE_MAX_AGE_SECONDS = 60 * 5;
export const CHALLENGE_MAX_AGE_MS = CHALLENGE_MAX_AGE_SECONDS * 1000;
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

const SESSION_CLOCK_SKEW_MS = 5 * 60 * 1000;
const CHALLENGE_CLOCK_SKEW_MS = 60 * 1000;
const CHALLENGE_HEADER = "Quorum wallet login";
const CHALLENGE_NETWORK = "Network: Stellar Testnet";

type SessionPayload = {
  walletAddress: string;
  issuedAt: number;
};

const LOCAL_SESSION_SECRET = "quorum-local-dev-session-secret";
const SESSION_SECRET_PLACEHOLDERS = new Set([
  "replace-with-a-long-random-secret",
  LOCAL_SESSION_SECRET,
]);

type SessionSecretEnv = {
  NODE_ENV?: string;
  QUORUM_SESSION_SECRET?: string;
};

export function resolveSessionSecret(env: SessionSecretEnv = process.env) {
  const secret = env.QUORUM_SESSION_SECRET?.trim();

  if (env.NODE_ENV !== "production") {
    return secret || LOCAL_SESSION_SECRET;
  }

  if (!secret || SESSION_SECRET_PLACEHOLDERS.has(secret) || secret.length < 32) {
    throw new Error(
      "QUORUM_SESSION_SECRET must be set to a non-placeholder value with at least 32 characters in production.",
    );
  }

  return secret;
}

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function decodeBase64Url(value: string) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  return Buffer.from(padded.replaceAll("-", "+").replaceAll("_", "/"), "base64");
}

function sign(value: string) {
  return encodeBase64Url(
    createHmac("sha256", resolveSessionSecret()).update(value).digest(),
  );
}

export function createChallenge(walletAddress: string, issuedAt = new Date()) {
  const nonce = randomUUID();

  return [
    CHALLENGE_HEADER,
    `Wallet: ${walletAddress}`,
    CHALLENGE_NETWORK,
    `Nonce: ${nonce}`,
    `Issued: ${issuedAt.toISOString()}`,
  ].join("\n");
}

export function isChallengeValidForWallet(
  challenge: string,
  walletAddress: string,
  now = Date.now(),
) {
  const lines = challenge.split("\n");

  if (lines.length !== 5) return false;
  if (lines[0] !== CHALLENGE_HEADER) return false;
  if (lines[1] !== `Wallet: ${walletAddress}`) return false;
  if (lines[2] !== CHALLENGE_NETWORK) return false;
  if (!/^Nonce: [0-9a-f-]{36}$/.test(lines[3] ?? "")) return false;

  const issuedAtValue = lines[4]?.startsWith("Issued: ")
    ? lines[4].slice("Issued: ".length)
    : "";
  const issuedAt = Date.parse(issuedAtValue);

  if (Number.isNaN(issuedAt)) return false;

  return (
    issuedAt <= now + CHALLENGE_CLOCK_SKEW_MS &&
    now - issuedAt <= CHALLENGE_MAX_AGE_MS
  );
}

export function createSessionToken(walletAddress: string, issuedAt = Date.now()) {
  const payload: SessionPayload = {
    walletAddress,
    issuedAt,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readSessionToken(
  token?: string | null,
  now = Date.now(),
): SessionPayload | null {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload).toString());
    if (
      typeof payload.walletAddress !== "string" ||
      typeof payload.issuedAt !== "number" ||
      !Number.isFinite(payload.issuedAt)
    ) {
      return null;
    }

    if (
      payload.issuedAt > now + SESSION_CLOCK_SKEW_MS ||
      now - payload.issuedAt > SESSION_MAX_AGE_MS
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
