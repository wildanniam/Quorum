"use client";

import { AlertTriangle, BadgeCheck, RadioTower, ShieldCheck } from "lucide-react";
import { useWallet } from "@/components/wallet-provider";

export function WalletReadiness() {
  const { error, network, networkPassphrase, sessionWalletAddress, status } =
    useWallet();
  const isTestnet =
    networkPassphrase?.toLowerCase().includes("testnet") ||
    network?.toLowerCase().includes("test");

  const rows = [
    {
      icon: ShieldCheck,
      label: "Session",
      value: sessionWalletAddress ? "Signed" : "Unsigned",
      active: Boolean(sessionWalletAddress),
    },
    {
      icon: RadioTower,
      label: "Network",
      value: network ?? "Not connected",
      active: Boolean(network),
    },
    {
      icon: BadgeCheck,
      label: "Testnet",
      value: isTestnet ? "Ready" : "Pending",
      active: Boolean(isTestnet),
    },
  ];

  return (
    <div className="border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-normal text-muted">
            Wallet readiness
          </p>
          <p className="mt-2 text-xl font-semibold">
            {status === "checking" ? "Checking wallet" : "Freighter first"}
          </p>
        </div>
        {error ? (
          <AlertTriangle className="text-coral" size={22} />
        ) : (
          <ShieldCheck className="text-accent" size={22} />
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border border-line bg-background/35 p-3"
              key={row.label}
            >
              <Icon className={row.active ? "text-accent" : "text-muted"} size={17} />
              <span className="text-sm text-muted">{row.label}</span>
              <span className="font-mono text-xs">{row.value}</span>
            </div>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm leading-6 text-coral">{error}</p> : null}
    </div>
  );
}
