"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCcw } from "lucide-react";
import { requestMoneyGramAuthToken } from "@/lib/anchor/moneygram/browser-auth";

type AnchorPayoutSyncButtonProps = {
  payoutId: string;
};

type AnchorPayoutSyncResponse = {
  error?: string;
  payout?: {
    status: string;
  };
};

export function AnchorPayoutSyncButton({
  payoutId,
}: AnchorPayoutSyncButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSync() {
    setError(null);
    setIsSyncing(true);

    try {
      const moneyGramAuthToken = await requestMoneyGramAuthToken();
      const response = await fetch(
        `/api/anchor/moneygram/payouts/${payoutId}/sync`,
        {
          body: JSON.stringify({ moneyGramAuthToken }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      const payload = (await response
        .json()
        .catch(() => ({}))) as AnchorPayoutSyncResponse;

      if (!response.ok || !payload.payout) {
        setError(payload.error ?? "Could not sync payout status.");
        return;
      }

      setStatus(payload.payout.status.replaceAll("_", " "));
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sync payout.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        className="inline-flex min-h-8 items-center justify-center gap-2 rounded-full border border-white/10 px-3 text-xs text-muted transition hover:border-quorum-cyan/45 hover:text-quorum-cyan-soft disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSyncing}
        onClick={handleSync}
        type="button"
      >
        {isSyncing ? (
          <Loader2 className="animate-spin" size={13} />
        ) : (
          <RefreshCcw size={13} />
        )}
        Sync status
      </button>
      {status ? (
        <p className="text-xs leading-5 text-quorum-cyan-soft">Synced: {status}</p>
      ) : null}
      {error ? (
        <p className="text-xs leading-5 text-coral" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
