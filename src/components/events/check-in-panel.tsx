"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  Search,
  ShieldCheck,
  ScanLine,
  WalletCards,
} from "lucide-react";
import { ProofDisplay } from "@/components/proof-display";
import { QuorumButton } from "@/components/ui/quorum-button";
import { StatusPill } from "@/components/ui/status-pill";
import { useWallet } from "@/components/wallet-provider";
import { executeLiveBrowserContractAction } from "@/lib/stellar/live-browser-flow";

type CheckInPanelProps = {
  eventSlug: string;
  eventId: string;
  initialTokenId?: string | null;
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

export function CheckInPanel({
  eventId,
  eventSlug,
  initialTokenId = null,
}: CheckInPanelProps) {
  const router = useRouter();
  const {
    connectAndSignIn,
    error: walletError,
    sessionWalletAddress,
    status: walletStatus,
  } = useWallet();
  const [tokenId, setTokenId] = useState(initialTokenId ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const [checkedInTokenId, setCheckedInTokenId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isConnected = Boolean(sessionWalletAddress);
  const isBusy = isSubmitting || walletStatus === "checking";
  const hasCompletedCheckIn = Boolean(txHash);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasCompletedCheckIn) return;

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

    const submittedTokenId = tokenId.trim();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/check-ins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: submittedTokenId }),
      });
      const payload = (await response.json().catch(() => ({}))) as CheckInResponse;

      if (response.status === 501 && payload.executionMode === "live_required") {
        const liveResult = await executeLiveBrowserContractAction({
          action: "check_in_pass",
          eventId,
          tokenId: submittedTokenId,
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
        setCheckedInTokenId(submittedTokenId);
        setTokenId("");
        router.refresh();
        return;
      }

      if (!response.ok || !payload.checkIn) {
        setCheckInError(payload.error ?? "Could not check in pass.");
        return;
      }

      setTxHash(payload.checkIn.txHash);
      setCheckedInTokenId(submittedTokenId);
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
      className="rounded-[16px] border border-quorum-cyan/24 bg-quorum-grey-700/76 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <StatusPill icon={ScanLine} tone="cyan">
            Verify token
          </StatusPill>
          <h2 className="mt-3 font-product text-2xl font-medium tracking-normal">
            Check in pass
          </h2>
          <p className="mt-2 hidden text-sm leading-6 text-muted sm:block">
            Paste a token or open this page from a pass QR. The organizer wallet
            records the check-in proof.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs text-muted">
            <WalletCards className="text-accent" size={15} />
            {sessionWalletAddress
              ? shorten(sessionWalletAddress)
              : "Organizer wallet required"}
          </div>
        </div>
        <ShieldCheck className="text-accent" size={24} />
      </div>

      <label
        className="mt-4 flex items-center gap-3 rounded-[14px] border border-white/10 bg-quorum-grey-800 p-3 focus-within:border-quorum-cyan/55 focus-within:shadow-[0_0_0_1px_rgba(38,198,218,0.24)] sm:mt-5 sm:p-4"
        htmlFor="check-in-token"
      >
        <Search className="text-quorum-cyan-soft" size={18} />
        <input
          className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted"
          id="check-in-token"
          onChange={(event) => setTokenId(event.target.value)}
          placeholder="qpass-event-0001-abcdef"
          value={tokenId}
        />
      </label>

      {initialTokenId ? (
        <p className="mt-3 rounded-[12px] border border-quorum-cyan/35 bg-quorum-cyan/10 p-3 text-sm leading-6 text-quorum-cyan-soft">
          Token loaded from QR. Review it before recording the door check-in.
        </p>
      ) : null}

      {checkInError ?? walletError ? (
        <div
          className="mt-4 rounded-[12px] border border-coral/55 bg-coral/10 p-3 text-sm text-coral"
          role="alert"
        >
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 shrink-0" size={16} />
            <p>{checkInError ?? walletError}</p>
          </div>
        </div>
      ) : null}

      {txHash ? (
        <div className="mt-4 grid gap-3">
          <ProofDisplay compact label="Check-in proof" value={txHash} />
          <div className="grid gap-2 sm:grid-cols-2">
            <QuorumButton
              className="w-full"
              href={`/events/${eventSlug}/proof`}
              variant="secondary"
            >
              Event proof
            </QuorumButton>
            {checkedInTokenId ? (
              <QuorumButton
                className="w-full"
                href={`/passes/${encodeURIComponent(checkedInTokenId)}`}
                variant="ghost"
              >
                Pass receipt
              </QuorumButton>
            ) : null}
          </div>
          <button
            className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-white/10 px-4 text-sm font-semibold transition hover:border-quorum-cyan/45 hover:text-quorum-cyan-soft"
            onClick={() => {
              setCheckInError(null);
              setCheckedInTokenId(null);
              setTxHash(null);
            }}
            type="button"
          >
            Check another pass
          </button>
        </div>
      ) : null}

      <QuorumButton
        className="mt-3 w-full disabled:cursor-wait"
        disabled={isBusy || hasCompletedCheckIn}
        icon={isBusy ? <Loader2 className="animate-spin" size={16} /> : <ScanLine size={16} />}
        type="submit"
      >
        {!isConnected
          ? "Connect organizer wallet"
          : hasCompletedCheckIn
            ? "Checked in"
            : "Mark checked in"}
      </QuorumButton>
    </form>
  );
}
