"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  ShieldCheck,
  TicketCheck,
  WalletCards,
} from "lucide-react";
import { QuorumButton } from "@/components/ui/quorum-button";
import { StatusPill } from "@/components/ui/status-pill";
import { useWallet } from "@/components/wallet-provider";
import { executeLiveBrowserContractAction } from "@/lib/stellar/live-browser-flow";
import { cn } from "@/lib/ui";

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

  const steps = [
    {
      icon: WalletCards,
      label: "Connect wallet",
      value: sessionWalletAddress
        ? `${shorten(sessionWalletAddress)}${network ? ` on ${network}` : ""}`
        : "Connect Freighter to start.",
      state: sessionWalletAddress ? "done" : isCheckingWallet ? "active" : "pending",
    },
    {
      icon: CircleDollarSign,
      label: "Review amount",
      value: isFree
        ? "No USDC payment is required for this claim."
        : `${priceUsdc} USDC will be prepared for this checkout.`,
      state: "done",
    },
    {
      icon: ShieldCheck,
      label: "Approve in Freighter",
      value: "You stay in control before anything is submitted.",
      state: isConnected && !isSubmitting ? "active" : "pending",
    },
    {
      icon: TicketCheck,
      label: "Receive pass",
      value: "Your pass opens resources and check-in.",
      state: isSubmitting ? "active" : "pending",
    },
  ];

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
    <div className="rounded-[16px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl">
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

      <div className="mt-6 grid gap-2 rounded-[12px] border border-white/10 bg-quorum-grey-900/42 p-4 text-sm">
        {[
          { label: "Amount", value: priceLabel },
          { label: "Network", value: network ?? "Stellar testnet" },
          {
            label: "Result",
            value: "Wallet-bound event pass",
          },
        ].map((item) => (
          <div className="grid grid-cols-[auto_1fr] gap-4" key={item.label}>
            <p className="text-muted">{item.label}</p>
            <p className="text-right font-medium text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isDone = step.state === "done";
          const isActive = step.state === "active";

          return (
            <div
              className={cn(
                "grid grid-cols-[auto_1fr] gap-3 rounded-[12px] border p-4",
                isDone || isActive
                  ? "border-quorum-cyan/45 bg-quorum-cyan/10"
                  : "border-white/10 bg-white/[0.035]",
              )}
              key={step.label}
            >
              <div
                className={cn(
                  "mt-0.5 grid h-7 w-7 place-items-center rounded-full border",
                  isDone || isActive
                    ? "border-quorum-cyan/45 text-quorum-cyan-soft"
                    : "border-white/10 text-muted",
                )}
              >
                {isDone ? <CheckCircle2 size={15} /> : <Icon size={15} />}
              </div>
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{step.label}</p>
                  <span className="font-mono text-xs text-muted">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{step.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {activeError ? (
        <div
          className="mt-4 rounded-[8px] border border-coral/55 bg-coral/10 p-3 text-sm text-coral"
          role="alert"
        >
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 shrink-0" size={16} />
            <div>
              <p className="font-semibold">Checkout needs attention</p>
              <p className="mt-1 leading-5">{activeError}</p>
              <p className="mt-1 leading-5">
                Reconnect the wallet or try the action again after Freighter is
                ready.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <QuorumButton
        aria-busy={isBusy}
        className="mt-5 w-full"
        disabled={isBusy || isSoldOut}
        icon={
          isBusy ? (
            <Loader2 className="animate-spin" size={16} />
          ) : !isSoldOut ? (
            <ArrowRight size={16} />
          ) : null
        }
        onClick={handleCheckout}
        type="button"
      >
        {buttonLabel}
      </QuorumButton>

      <p className="mt-3 text-center text-xs leading-5 text-muted">
        Live testnet actions still ask for explicit Freighter approval.
      </p>
    </div>
  );
}
