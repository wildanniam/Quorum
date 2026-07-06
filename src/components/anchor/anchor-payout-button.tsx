"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BanknoteArrowUp, Loader2 } from "lucide-react";
import { QuorumButton } from "@/components/ui/quorum-button";
import type { MoneyGramSep10Challenge } from "@/lib/anchor/moneygram/sep10";

type AnchorPayoutButtonProps = {
  amountUsdc: string;
  eventId: string;
};

type AnchorPayoutResponse = {
  error?: string;
  payout?: {
    pickupUrl: string | null;
    referenceNumber: string | null;
    status: string;
  };
  requiresMoneyGramAuth?: boolean;
};

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

export function AnchorPayoutButton({
  amountUsdc,
  eventId,
}: AnchorPayoutButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [pickupUrl, setPickupUrl] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const disabled =
    isSubmitting ||
    isAuthorizing ||
    Number(amountUsdc) <= 0 ||
    Boolean(referenceNumber);

  async function postPayout(moneyGramAuthToken?: string) {
    const response = await fetch(`/api/events/${eventId}/anchor-payouts`, {
      body: JSON.stringify({ amountUsdc, moneyGramAuthToken }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as AnchorPayoutResponse;

    return { payload, response };
  }

  async function requestMoneyGramAuthToken() {
    setIsAuthorizing(true);

    try {
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
    } finally {
      setIsAuthorizing(false);
    }
  }

  async function handleRequestPayout() {
    setError(null);
    setIsSubmitting(true);

    try {
      let { payload, response } = await postPayout();

      if (response.status === 428 && payload.requiresMoneyGramAuth) {
        const token = await requestMoneyGramAuthToken();
        ({ payload, response } = await postPayout(token));
      }

      if (!response.ok || !payload.payout) {
        setError(payload.error ?? "Could not request anchor payout.");
        return;
      }

      setReferenceNumber(payload.payout.referenceNumber);
      setPickupUrl(payload.payout.pickupUrl);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not request anchor payout.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-2">
      <QuorumButton
        className="w-full"
        disabled={disabled}
        icon={
          isSubmitting || isAuthorizing ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <BanknoteArrowUp size={16} />
          )
        }
        onClick={handleRequestPayout}
        type="button"
      >
        {referenceNumber
          ? "Payout requested"
          : isAuthorizing
            ? "Authorize wallet"
            : "Request payout"}
      </QuorumButton>
      {referenceNumber ? (
        <p className="text-xs leading-5 text-quorum-cyan-soft">
          Reference {referenceNumber}
        </p>
      ) : null}
      {pickupUrl ? (
        <a
          className="inline-flex items-center gap-1 text-xs leading-5 text-quorum-cyan-soft transition hover:text-foreground"
          href={pickupUrl}
          rel="noreferrer"
          target="_blank"
        >
          Continue at MoneyGram <ArrowUpRight size={12} />
        </a>
      ) : null}
      {error ? (
        <p className="text-xs leading-5 text-coral" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
