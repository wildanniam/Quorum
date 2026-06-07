"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BanknoteArrowUp, Loader2 } from "lucide-react";
import { ProofDisplay } from "@/components/proof-display";
import { executeLiveBrowserContractAction } from "@/lib/stellar/live-browser-flow";

type WithdrawButtonProps = {
  amountUsdc: string;
  eventId: string;
};

type WithdrawalResponse = {
  executionMode?: "local_proof" | "live_required";
  error?: string;
  result?: {
    withdrawal?: {
      txHash: string;
    };
  };
  txHash?: string;
  withdrawal?: {
    txHash: string;
  };
};

export function WithdrawButton({ amountUsdc, eventId }: WithdrawButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleWithdraw() {
    setError(null);
    setTxHash(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/withdrawals`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as WithdrawalResponse;

      if (response.status === 501 && payload.executionMode === "live_required") {
        const liveResult = await executeLiveBrowserContractAction({
          action: "withdraw_balance",
          eventId,
        });
        const livePayload = liveResult.submission as WithdrawalResponse;
        const liveTxHash =
          livePayload.withdrawal?.txHash ??
          livePayload.result?.withdrawal?.txHash ??
          livePayload.txHash;

        if (!liveTxHash) {
          setError("Live transaction completed without withdrawal proof.");
          return;
        }

        setTxHash(liveTxHash);
        router.refresh();
        return;
      }

      if (!response.ok || !payload.withdrawal) {
        setError(payload.error ?? "Could not withdraw balance.");
        return;
      }

      setTxHash(payload.withdrawal.txHash);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not withdraw balance.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 bg-accent px-3 text-sm font-semibold text-accent-ink transition hover:bg-foreground disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || amountUsdc === "0"}
        onClick={handleWithdraw}
        type="button"
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin" size={15} />
        ) : (
          <BanknoteArrowUp size={15} />
        )}
        Withdraw
      </button>
      {error ? (
        <p className="text-right text-xs leading-5 text-coral">{error}</p>
      ) : null}
      {txHash ? (
        <ProofDisplay align="right" compact label="Withdraw proof" value={txHash} />
      ) : null}
    </div>
  );
}
