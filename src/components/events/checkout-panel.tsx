"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  TicketCheck,
} from "lucide-react";
import { QuorumButton } from "@/components/ui/quorum-button";
import { Alert, Spinner } from "@/components/ui/feedback-primitives";
import { StickyActionBar, TaskPanel } from "@/components/ui/product-primitives";
import { StatusPill } from "@/components/ui/status-pill";
import { useWallet } from "@/components/wallet-provider";
import { executeLiveBrowserContractAction } from "@/lib/stellar/live-browser-flow";

type CheckoutPanelProps = {
  capacity: number;
  eventId: string;
  isFree: boolean;
  priceUsdc: string;
  remainingCapacity: number;
};

type CheckoutResponse = {
  executionMode?: "local_proof" | "live_required";
  pass?: {
    tokenId: string | null;
  };
  error?: string;
  result?: {
    pass?: {
      tokenId: string | null;
    };
  };
  tokenId?: string;
};

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
    network,
    sessionWalletAddress,
    status: walletStatus,
  } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const isConnected = Boolean(sessionWalletAddress);
  const isCheckingWallet = walletStatus === "checking";
  const isBusy = isSubmitting || isCheckingWallet;
  const isSoldOut = remainingCapacity <= 0;
  const priceLabel = isFree ? "Free claim" : `${priceUsdc} USDC`;
  const activeError = checkoutError ?? walletError;
  const checkoutState = isSoldOut
    ? "Sold out"
    : isSubmitting
      ? "Submitting"
      : isConnected
        ? "Ready"
        : "Wallet required";

  const buttonLabel = isSoldOut
    ? "Sold out"
    : isBusy
      ? isSubmitting
        ? "Preparing pass"
        : "Checking wallet"
      : !isConnected
        ? "Connect wallet"
        : isFree
          ? "Claim pass"
          : "Confirm checkout";
  const nextStep = isSoldOut
    ? "This event has reached capacity."
    : isSubmitting
      ? "Freighter approval and pass creation are in progress."
      : isConnected
        ? "Confirm the final approval in Freighter to receive the pass."
        : "Connect the wallet that should own this pass.";

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

      if (response.status === 501 && payload.executionMode === "live_required") {
        const liveResult = await executeLiveBrowserContractAction({
          action: "checkout_pass",
          eventId,
        });
        const livePayload = liveResult.submission as CheckoutResponse;
        const tokenId =
          livePayload.pass?.tokenId ??
          livePayload.result?.pass?.tokenId ??
          livePayload.tokenId;

        if (!tokenId) {
          setCheckoutError("Live transaction completed without a pass token ID.");
          return;
        }

        router.push(`/passes/${tokenId}`);
        router.refresh();
        return;
      }

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
    <TaskPanel className="p-5" tone={isSoldOut ? "muted" : isConnected ? "ready" : "default"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <StatusPill
            icon={isSoldOut ? AlertTriangle : TicketCheck}
            tone={isSoldOut ? "blocked" : isConnected ? "ready" : "muted"}
          >
            {checkoutState}
          </StatusPill>
          <p className="mt-5 font-mono text-4xl leading-none text-quorum-cyan-soft">
            {priceLabel}
          </p>
          <p className="mt-2 text-sm text-muted">
            {remainingCapacity} of {capacity} seats left
          </p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-full border border-quorum-cyan/45 bg-quorum-cyan/10 text-quorum-cyan-soft">
          <TicketCheck size={23} />
        </div>
      </div>

      <div className="mt-6 text-sm">
        {[
          { label: "Amount", value: priceLabel },
          { label: "Network", value: network ?? "Stellar testnet" },
          {
            label: "Result",
            value: "Wallet-bound event pass",
          },
        ].map((item) => (
          <div className="grid grid-cols-[auto_1fr] gap-4 border-b border-white/10 py-3 last:border-b-0" key={item.label}>
            <p className="text-muted">{item.label}</p>
            <p className="text-right font-medium text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <p className="text-sm font-medium text-foreground">What happens next</p>
        <p className="mt-2 text-sm leading-6 text-muted">{nextStep}</p>
      </div>

      {activeError ? (
        <Alert
          className="mt-4"
          icon={AlertTriangle}
          title="Checkout needs attention"
          tone="danger"
        >
          <p>{activeError}</p>
          <p>Reconnect the wallet or try the action again after Freighter is ready.</p>
        </Alert>
      ) : null}

      <StickyActionBar className="mt-5">
        <QuorumButton
          aria-busy={isBusy}
          className="w-full"
          disabled={isBusy || isSoldOut}
          icon={
            isBusy ? (
              <Spinner label={buttonLabel} size={16} />
            ) : !isSoldOut ? (
              <ArrowRight size={16} />
            ) : null
          }
          onClick={handleCheckout}
          type="button"
        >
          {buttonLabel}
        </QuorumButton>
      </StickyActionBar>

      <p className="mt-3 text-center text-xs leading-5 text-muted">
        Live testnet actions still ask for explicit Freighter approval.
      </p>
    </TaskPanel>
  );
}
