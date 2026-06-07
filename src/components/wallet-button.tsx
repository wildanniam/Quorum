"use client";

import { Loader2, LogOut, WalletCards } from "lucide-react";
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
        <div className="hidden border border-line bg-panel px-3 py-2 text-right sm:block">
          <p className="font-mono text-xs text-accent">
            {shorten(connectedAddress)}
          </p>
          <p className="mt-1 text-[11px] text-muted">{network ?? "Session"}</p>
        </div>
        <button
          aria-label="Disconnect wallet"
          className="inline-flex min-h-10 items-center gap-2 border border-line bg-panel px-3 text-sm font-medium text-foreground transition hover:border-coral hover:text-coral"
          onClick={disconnect}
          type="button"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error ? (
        <span className="hidden max-w-48 truncate border border-coral/50 bg-coral/10 px-3 py-2 text-xs text-coral md:inline">
          {error}
        </span>
      ) : null}
      <button
        className="inline-flex min-h-10 items-center gap-2 border border-line bg-panel px-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-70"
        disabled={isBusy}
        onClick={connectAndSignIn}
        type="button"
      >
        {isBusy ? <Loader2 className="animate-spin" size={16} /> : <WalletCards size={16} />}
        <span className="hidden sm:inline">
          {isBusy ? "Checking" : "Connect wallet"}
        </span>
      </button>
    </div>
  );
}
