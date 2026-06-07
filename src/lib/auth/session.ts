import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const CHALLENGE_COOKIE = "quorum_challenge";
export const SESSION_COOKIE = "quorum_session";

type SessionPayload = {
  walletAddress: string;
  issuedAt: number;
};

function getSessionSecret() {
  return process.env.QUORUM_SESSION_SECRET ?? "quorum-local-dev-session-secret";
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
    createHmac("sha256", getSessionSecret()).update(value).digest(),
  );
}

export function createChallenge(walletAddress?: string) {
  const nonce = randomUUID();
  const issuedAt = new Date().toISOString();
  const addressLine = walletAddress ? `Wallet: ${walletAddress}` : "Wallet: pending";

  return [
    "Quorum wallet login",
    addressLine,
    "Network: Stellar Testnet",
    `Nonce: ${nonce}`,
    `Issued: ${issuedAt}`,
  ].join("\n");
}

export function createSessionToken(walletAddress: string) {
  const payload: SessionPayload = {
    walletAddress,
    issuedAt: Date.now(),
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readSessionToken(token?: string | null): SessionPayload | null {
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
      typeof payload.issuedAt !== "number"
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
