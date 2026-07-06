"use client";

import type { MoneyGramSep10Challenge } from "@/lib/anchor/moneygram/sep10";

type Sep10ChallengeResponse = {
  challenge?: MoneyGramSep10Challenge;
  error?: string;
};

type Sep10TokenResponse = {
  error?: string;
  token?: string;
};

function normalizeError(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  if (error && typeof error === "object" && "error" in error) {
    return normalizeError((error as { error: unknown }).error);
  }
  if (error && typeof error === "object" && "errorMessage" in error) {
    return String((error as { errorMessage: unknown }).errorMessage);
  }
  return "MoneyGram wallet authorization failed.";
}

function normalizeWalletAddress(value: unknown): string | null {
  if (typeof value === "string" && value.startsWith("G")) return value;
  if (!value || typeof value !== "object") return null;

  for (const key of [
    "address",
    "publicKey",
    "public_key",
    "signerAddress",
    "accountId",
  ]) {
    if (key in value) {
      const normalized = normalizeWalletAddress(
        (value as Record<string, unknown>)[key],
      );
      if (normalized) return normalized;
    }
  }

  return null;
}

async function signMoneyGramChallenge(challenge: MoneyGramSep10Challenge) {
  const freighter = await import("@stellar/freighter-api");
  const networkDetails = await freighter.getNetworkDetails();

  if (networkDetails.error) {
    throw new Error(normalizeError(networkDetails.error));
  }

  if (networkDetails.networkPassphrase !== challenge.networkPassphrase) {
    throw new Error("Switch Freighter to Stellar Testnet before signing.");
  }

  const signed = await freighter.signTransaction(challenge.transactionXdr, {
    address: challenge.account,
    networkPassphrase: challenge.networkPassphrase,
  });

  if (signed.error) {
    throw new Error(normalizeError(signed.error));
  }

  const signerAddress = normalizeWalletAddress(signed.signerAddress);

  if (signerAddress !== challenge.account) {
    throw new Error("Freighter signed with a different wallet.");
  }

  if (!signed.signedTxXdr) {
    throw new Error("Freighter did not return signed XDR.");
  }

  return signed.signedTxXdr;
}

export async function requestMoneyGramAuthToken() {
  const challengeResponse = await fetch("/api/anchor/moneygram/auth/challenge", {
    method: "POST",
  });
  const challengePayload = (await challengeResponse
    .json()
    .catch(() => ({}))) as Sep10ChallengeResponse;

  if (!challengeResponse.ok || !challengePayload.challenge) {
    throw new Error(
      challengePayload.error ?? "Could not prepare MoneyGram wallet challenge.",
    );
  }

  const signedTransactionXdr = await signMoneyGramChallenge(
    challengePayload.challenge,
  );
  const tokenResponse = await fetch("/api/anchor/moneygram/auth/token", {
    body: JSON.stringify({
      networkPassphrase: challengePayload.challenge.networkPassphrase,
      signedTransactionXdr,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const tokenPayload = (await tokenResponse
    .json()
    .catch(() => ({}))) as Sep10TokenResponse;

  if (!tokenResponse.ok || !tokenPayload.token) {
    throw new Error(
      tokenPayload.error ?? "Could not authenticate MoneyGram wallet challenge.",
    );
  }

  return tokenPayload.token;
}
