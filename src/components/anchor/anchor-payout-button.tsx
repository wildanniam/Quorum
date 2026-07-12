"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BanknoteArrowUp } from "lucide-react";
import { QuorumButton } from "@/components/ui/quorum-button";
import { Alert, Spinner } from "@/components/ui/feedback-primitives";
import { requestMoneyGramAuthToken as requestMoneyGramBrowserAuthToken } from "@/lib/anchor/moneygram/browser-auth";

type AnchorPayoutButtonProps = {
  actionLabel?: string;
  amountUsdc: string;
  eventId: string;
  withdrawalId: string;
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

function isProviderAccessError(message: string) {
  const normalized = message.toLowerCase();

  return [
    "allowlist",
    "allowlisted",
    "moneygram access",
    "provider access",
    "ramps instant access",
    "temporarily unavailable",
  ].some((fragment) => normalized.includes(fragment));
}

export function AnchorPayoutButton({
  actionLabel = "Start cash-out",
  amountUsdc,
  eventId,
  withdrawalId,
}: AnchorPayoutButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [pickupUrl, setPickupUrl] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [payoutStarted, setPayoutStarted] = useState(false);
  const disabled =
    isSubmitting ||
    isAuthorizing ||
    Number(amountUsdc) <= 0 ||
    payoutStarted;
  const actionText = payoutStarted
    ? "Cash-out started"
    : isAuthorizing
      ? "Authorizing wallet"
      : isSubmitting
        ? "Starting cash-out"
        : actionLabel;

  async function postPayout(moneyGramAuthToken?: string) {
    const response = await fetch(`/api/events/${eventId}/anchor-payouts`, {
      body: JSON.stringify({ moneyGramAuthToken, withdrawalId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json().catch(() => ({}))) as AnchorPayoutResponse;

    return { payload, response };
  }

  async function authorizeMoneyGramWallet() {
    setIsAuthorizing(true);

    try {
      return await requestMoneyGramBrowserAuthToken();
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
        const token = await authorizeMoneyGramWallet();
        ({ payload, response } = await postPayout(token));
      }

      if (!response.ok || !payload.payout) {
        setError(payload.error ?? "Could not request anchor payout.");
        return;
      }

      setReferenceNumber(payload.payout.referenceNumber);
      setPickupUrl(payload.payout.pickupUrl);
      setPayoutStarted(true);
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
            <Spinner label={actionText} size={16} />
          ) : (
            <BanknoteArrowUp size={16} />
          )
        }
        onClick={handleRequestPayout}
        type="button"
      >
        {actionText}
      </QuorumButton>
      {referenceNumber ? (
        <p className="text-xs leading-5 text-quorum-cyan-soft">
          Pickup reference {referenceNumber}
        </p>
      ) : null}
      {pickupUrl ? (
        <a
          className="inline-flex items-center gap-1 text-xs leading-5 text-quorum-cyan-soft transition hover:text-foreground"
          href={pickupUrl}
          rel="noreferrer"
          target="_blank"
        >
          Continue MoneyGram details <ArrowUpRight size={12} />
        </a>
      ) : null}
      {error ? (
        <Alert
          className="text-xs"
          title={
            isProviderAccessError(error)
              ? "MoneyGram access is pending"
              : "Cash-out needs attention"
          }
          tone="danger"
        >
          <p>{error}</p>
          {isProviderAccessError(error) ? (
            <p>
              Your settled Quorum balance is unchanged. Try again after MoneyGram
              enables this wallet domain.
            </p>
          ) : null}
        </Alert>
      ) : null}
    </div>
  );
}
