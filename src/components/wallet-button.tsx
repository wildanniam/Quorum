"use client";

import { CheckCircle2, Loader2, LogOut, WalletCards } from "lucide-react";
import { useWallet } from "@/components/wallet-provider";

function shorten(address: string) {
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const {
    connectAndSignIn,
    disconnect,
    error,
    network,
    sessionWalletAddress,
    status,
    walletAddress,
  } = useWallet();

  const isBusy = status === "checking";
  const connectedAddress = sessionWalletAddress ?? walletAddress;

  if (connectedAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex min-h-10 items-center gap-2 rounded-[8px] border border-success/35 bg-success/10 px-3 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <CheckCircle2 className="hidden text-success sm:block" size={16} />
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold text-foreground">
              {shorten(connectedAddress)}
            </p>
            <p className="hidden text-[11px] leading-none text-muted sm:block">
              {network ?? "Signed session"}
            </p>
          </div>
        </div>
        <button
          aria-label="Disconnect wallet"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-line/80 bg-panel/70 text-muted transition hover:border-coral/70 hover:text-coral"
          onClick={disconnect}
          type="button"
        >
          <LogOut size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      {error ? (
        <span
          className="hidden max-w-56 truncate rounded-[8px] border border-coral/45 bg-coral/10 px-3 py-2 text-xs text-coral md:inline"
          role="alert"
        >
          {error}
        </span>
      ) : null}
      <button
        className="inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-line/80 bg-panel/72 px-3 text-sm font-semibold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-accent/70 hover:bg-accent/10 hover:text-accent disabled:cursor-wait disabled:opacity-70"
        disabled={isBusy}
        onClick={connectAndSignIn}
        type="button"
      >
        {isBusy ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <WalletCards size={16} />
        )}
        <span className="hidden sm:inline">
          {isBusy ? "Checking" : "Connect wallet"}
        </span>
        <span className="sm:hidden">{isBusy ? "Check" : "Wallet"}</span>
      </button>
    </div>
  );
}
