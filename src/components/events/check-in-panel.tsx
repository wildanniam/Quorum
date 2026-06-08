"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { ProofDisplay } from "@/components/proof-display";
import { useWallet } from "@/components/wallet-provider";
import { executeLiveBrowserContractAction } from "@/lib/stellar/live-browser-flow";

type CheckInPanelProps = {
  eventId: string;
};

type CheckInResponse = {
  checkIn?: {
    txHash: string | null;
  };
  executionMode?: "local_proof" | "live_required";
  error?: string;
  result?: {
    checkIn?: {
      txHash: string | null;
    };
  };
  txHash?: string;
};

function shorten(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-5)}`;
}

export function CheckInPanel({ eventId }: CheckInPanelProps) {
  const router = useRouter();
  const {
    connectAndSignIn,
    error: walletError,
    sessionWalletAddress,
    status: walletStatus,
  } = useWallet();
  const [tokenId, setTokenId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isConnected = Boolean(sessionWalletAddress);
  const isBusy = isSubmitting || walletStatus === "checking";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckInError(null);
    setTxHash(null);

    if (!isConnected) {
      await connectAndSignIn();
      return;
    }

    if (tokenId.trim().length < 1) {
      setCheckInError("Enter a token ID.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/check-ins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: tokenId.trim() }),
      });
      const payload = (await response.json().catch(() => ({}))) as CheckInResponse;

      if (response.status === 501 && payload.executionMode === "live_required") {
        const liveResult = await executeLiveBrowserContractAction({
          action: "check_in_pass",
          eventId,
          tokenId: tokenId.trim(),
        });
        const livePayload = liveResult.submission as CheckInResponse;
        const liveTxHash =
          livePayload.checkIn?.txHash ??
          livePayload.result?.checkIn?.txHash ??
          livePayload.txHash;

        if (!liveTxHash) {
          setCheckInError("Live transaction completed without check-in proof.");
          return;
        }

        setTxHash(liveTxHash);
        setTokenId("");
        router.refresh();
        return;
      }

      if (!response.ok || !payload.checkIn) {
        setCheckInError(payload.error ?? "Could not check in pass.");
        return;
      }

      setTxHash(payload.checkIn.txHash);
      setTokenId("");
      router.refresh();
    } catch (error) {
      setCheckInError(
        error instanceof Error ? error.message : "Could not check in pass.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-[8px] border border-line bg-panel p-5"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Verify token</p>
          <h2 className="mt-2 text-2xl font-semibold">Check in pass</h2>
          <p className="mt-2 hidden text-sm leading-6 text-muted sm:block">
            Paste a Quorum pass token, then confirm with the organizer wallet.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-[8px] border border-line bg-background/32 px-3 py-2 text-xs text-muted">
            <WalletCards className="text-accent" size={15} />
            {sessionWalletAddress
              ? shorten(sessionWalletAddress)
              : "Organizer wallet required"}
          </div>
        </div>
        <ShieldCheck className="text-accent" size={24} />
      </div>

      <label
        className="mt-4 flex items-center gap-3 rounded-[8px] border border-line bg-background/32 p-3 sm:mt-5 sm:p-4"
        htmlFor="check-in-token"
      >
        <Search className="text-accent" size={18} />
        <input
          className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted"
          id="check-in-token"
          onChange={(event) => setTokenId(event.target.value)}
          placeholder="qpass-event-0001-abcdef"
          value={tokenId}
        />
      </label>

      {checkInError ?? walletError ? (
        <div
          className="mt-4 rounded-[8px] border border-coral/55 bg-coral/10 p-3 text-sm text-coral"
          role="alert"
        >
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 shrink-0" size={16} />
            <p>{checkInError ?? walletError}</p>
          </div>
        </div>
      ) : null}

      {txHash ? (
        <ProofDisplay
          className="mt-4"
          compact
          label="Check-in proof"
          value={txHash}
        />
      ) : null}

      <button
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground disabled:cursor-wait disabled:opacity-70"
        disabled={isBusy}
        type="submit"
      >
        {isBusy ? <Loader2 className="animate-spin" size={16} /> : null}
        {!isConnected ? "Connect organizer wallet" : "Mark checked in"}
      </button>
    </form>
  );
}
