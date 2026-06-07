import { createHash } from "node:crypto";
import { Keypair, StrKey } from "@stellar/stellar-sdk";

const SIGN_MESSAGE_PREFIX = "Stellar Signed Message:\n";
const ED25519_SIGNATURE_BYTE_LENGTH = 64;

function decodeBase64Signature(signature: string) {
  const normalized = signature.trim().replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(padded)) return null;

  const decoded = Buffer.from(padded, "base64");
  if (decoded.length !== ED25519_SIGNATURE_BYTE_LENGTH) return null;

  return decoded;
}

function decodeHexSignature(signature: string) {
  const normalized = signature.trim();

  if (!/^[a-f0-9]{128}$/i.test(normalized)) return null;

  const decoded = Buffer.from(normalized, "hex");
  if (decoded.length !== ED25519_SIGNATURE_BYTE_LENGTH) return null;

  return decoded;
}

export function decodeStellarSignature(signature: string) {
  return decodeBase64Signature(signature) ?? decodeHexSignature(signature);
}

export function stellarSignedMessageDigest(message: string) {
  return createHash("sha256")
    .update(SIGN_MESSAGE_PREFIX)
    .update(message)
    .digest();
}

export function verifyStellarMessageSignature({
  walletAddress,
  message,
  signedMessage,
}: {
  walletAddress: string;
  message: string;
  signedMessage: string;
}) {
  if (!StrKey.isValidEd25519PublicKey(walletAddress)) return false;

  const signature = decodeStellarSignature(signedMessage);
  if (!signature) return false;

  const digest = stellarSignedMessageDigest(message);
  const keypair = Keypair.fromPublicKey(walletAddress);

  return keypair.verify(digest, signature);
}
