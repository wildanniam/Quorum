"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, ShieldCheck, WalletCards } from "lucide-react";
import { useWallet } from "@/components/wallet-provider";

type CheckoutPanelProps = {
  capacity: number;
  eventId: string;
  isFree: boolean;
  priceUsdc: string;
  remainingCapacity: number;
};

type CheckoutResponse = {
  pass?: {
    tokenId: string | null;
  };
  error?: string;
};

function shorten(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-5)}`;
}

export function CheckoutPanel({
  capacity,
  eventId,
  isFree,
  priceUsdc,
  remainingCapacity,
}: CheckoutPanelProps) {
  const router = useRouter();
  const {
    connectAndSignIn,
    error: walletError,
    sessionWalletAddress,
    status: walletStatus,
  } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isConnected = Boolean(sessionWalletAddress);
  const isBusy = isSubmitting || walletStatus === "checking";
  const isSoldOut = remainingCapacity <= 0;
  const priceLabel = isFree ? "Free claim" : `${priceUsdc} USDC`;

  async function handleCheckout() {
    setCheckoutError(null);

    if (!isConnected) {
      await connectAndSignIn();
      return;
    }

    if (isSoldOut) {
      setCheckoutError("Event capacity is sold out.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/events/${eventId}/passes`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as CheckoutResponse;

      if (!response.ok || !payload.pass?.tokenId) {
        setCheckoutError(payload.error ?? "Could not create event pass.");
        return;
      }

      router.push(`/passes/${payload.pass.tokenId}`);
      router.refresh();
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Could not create event pass.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="border border-line bg-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-normal text-muted">
            Checkout
          </p>
          <p className="mt-3 text-4xl font-semibold">{priceLabel}</p>
        </div>
        <div className="border border-line bg-background/40 px-3 py-2 text-right">
          <p className="font-mono text-lg text-accent">{remainingCapacity}</p>
          <p className="mt-1 text-xs text-muted">of {capacity} left</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted">
          <WalletCards className="text-accent" size={17} />
          <span>
            {sessionWalletAddress
              ? shorten(sessionWalletAddress)
              : "Wallet session required"}
          </span>
        </div>
        <div className="flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted">
          <ShieldCheck className="text-accent" size={17} />
          <span>One non-transferable pass per wallet</span>
        </div>
      </div>

      {checkoutError ?? walletError ? (
        <div className="mt-4 border border-coral/55 bg-coral/10 p-3 text-sm text-coral">
          {checkoutError ?? walletError}
        </div>
      ) : null}

      <button
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isBusy || isSoldOut}
        onClick={handleCheckout}
        type="button"
      >
        {isBusy ? <Loader2 className="animate-spin" size={16} /> : null}
        {!isConnected
          ? "Connect wallet"
          : isFree
            ? "Claim pass"
            : "Buy pass"}
        {!isBusy ? <ArrowRight size={16} /> : null}
      </button>
    </div>
  );
}
