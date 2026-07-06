"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BanknoteArrowUp, Loader2 } from "lucide-react";
import { QuorumButton } from "@/components/ui/quorum-button";

type AnchorPayoutButtonProps = {
  amountUsdc: string;
  eventId: string;
};

type AnchorPayoutResponse = {
  error?: string;
  payout?: {
    referenceNumber: string | null;
    status: string;
  };
};

export function AnchorPayoutButton({
  amountUsdc,
  eventId,
}: AnchorPayoutButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const disabled = isSubmitting || Number(amountUsdc) <= 0 || Boolean(referenceNumber);

  async function handleRequestPayout() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/anchor-payouts`, {
        body: JSON.stringify({ amountUsdc }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as AnchorPayoutResponse;

      if (!response.ok || !payload.payout) {
        setError(payload.error ?? "Could not request anchor payout.");
        return;
      }

      setReferenceNumber(payload.payout.referenceNumber);
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
          isSubmitting ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <BanknoteArrowUp size={16} />
          )
        }
        onClick={handleRequestPayout}
        type="button"
      >
        {referenceNumber ? "Payout requested" : "Request payout"}
      </QuorumButton>
      {referenceNumber ? (
        <p className="text-xs leading-5 text-quorum-cyan-soft">
          Reference {referenceNumber}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs leading-5 text-coral" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
