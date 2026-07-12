"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";
import { ProofDisplay } from "@/components/proof-display";
import { Alert, Spinner } from "@/components/ui/feedback-primitives";
import { executeLiveBrowserContractAction } from "@/lib/stellar/live-browser-flow";

type PublishButtonProps = {
  eventId: string;
};

type PublishResponse = {
  error?: string;
  event?: {
    publishTxHash?: string | null;
  };
  executionMode?: "local_proof" | "live_required";
  result?: {
    event?: {
      publishTxHash?: string | null;
    };
  };
  txHash?: string;
};

export function PublishButton({ eventId }: PublishButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handlePublish() {
    setError(null);
    setTxHash(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/publish`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as PublishResponse;

      if (response.status === 501 && payload.executionMode === "live_required") {
        const liveResult = await executeLiveBrowserContractAction({
          action: "publish_event",
          eventId,
        });
        const livePayload = liveResult.submission as PublishResponse;
        const liveTxHash =
          livePayload.event?.publishTxHash ??
          livePayload.result?.event?.publishTxHash ??
          livePayload.txHash;

        if (!liveTxHash) {
          setError("Live transaction completed without publish proof.");
          return;
        }

        setTxHash(liveTxHash);
        router.refresh();
        return;
      }

      if (!response.ok) {
        setError(payload.error ?? "Could not publish event.");
        return;
      }

      const localTxHash = payload.event?.publishTxHash;
      if (localTxHash) setTxHash(localTxHash);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not publish event.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-foreground/10 px-3 text-sm transition hover:border-accent/45 hover:text-accent disabled:cursor-wait disabled:opacity-60"
        disabled={isSubmitting}
        onClick={handlePublish}
        type="button"
      >
        {isSubmitting ? (
          <Spinner label="Publishing event" size={14} />
        ) : (
          <Rocket size={14} />
        )}
        {isSubmitting ? "Publishing" : "Publish"}
      </button>
      {error ? (
        <Alert className="text-left text-xs" title="Publish needs attention" tone="danger">
          {error}
        </Alert>
      ) : null}
      {txHash ? (
        <ProofDisplay align="right" compact label="Publish proof" value={txHash} />
      ) : null}
    </div>
  );
}
