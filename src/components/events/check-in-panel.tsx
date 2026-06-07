"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, Search, WalletCards } from "lucide-react";
import { useWallet } from "@/components/wallet-provider";

type CheckInPanelProps = {
  eventId: string;
};

type CheckInResponse = {
  checkIn?: {
    txHash: string | null;
  };
  error?: string;
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

    if (tokenId.trim().length < 3) {
      setCheckInError("Enter a valid token ID.");
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
    <form className="border border-line bg-panel p-5" onSubmit={handleSubmit}>
      <p className="font-mono text-xs uppercase tracking-normal text-muted">
        Verify token
      </p>
      <div className="mt-4 flex items-center gap-3 border border-line bg-background/35 p-4">
        <Search className="text-accent" size={18} />
        <input
          className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted"
          onChange={(event) => setTokenId(event.target.value)}
          placeholder="qpass-event-0001-abcdef"
          value={tokenId}
        />
      </div>

      <div className="mt-4 flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted">
        <WalletCards className="text-accent" size={17} />
        {sessionWalletAddress
          ? shorten(sessionWalletAddress)
          : "Organizer wallet session required"}
      </div>

      {checkInError ?? walletError ? (
        <div className="mt-4 border border-coral/55 bg-coral/10 p-3 text-sm text-coral">
          {checkInError ?? walletError}
        </div>
      ) : null}

      {txHash ? (
        <div className="mt-4 flex items-start gap-3 border border-accent/50 bg-accent/10 p-3 text-sm text-accent">
          <BadgeCheck size={18} />
          <span className="break-all font-mono">{txHash}</span>
        </div>
      ) : null}

      <button
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground disabled:cursor-wait disabled:opacity-70"
        disabled={isBusy}
        type="submit"
      >
        {isBusy ? <Loader2 className="animate-spin" size={16} /> : null}
        {!isConnected ? "Connect organizer wallet" : "Mark checked in"}
      </button>
    </form>
  );
}
