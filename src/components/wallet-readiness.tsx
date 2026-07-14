"use client";

import { AlertTriangle, BadgeCheck, RadioTower, ShieldCheck } from "lucide-react";
import { useWallet } from "@/components/wallet-provider";
import { ProofSurface } from "@/components/ui/proof-surface";
import { StatusPill } from "@/components/ui/status-pill";

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
      value: sessionWalletAddress ? "Authenticated" : "Not authenticated",
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
      value: isTestnet ? "Detected" : "Not detected",
      active: Boolean(isTestnet),
    },
  ];

  return (
    <ProofSurface>
      <div className="flex items-center justify-between gap-4">
        <div>
          <StatusPill icon={ShieldCheck} tone={sessionWalletAddress ? "ready" : "pending"}>
            Wallet
          </StatusPill>
          <p className="mt-4 font-product text-xl font-medium">
            {status === "checking" ? "Checking wallet" : "Freighter session"}
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
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[10px] border border-white/10 bg-background/36 p-3"
              key={row.label}
            >
              <Icon
                className={row.active ? "text-quorum-cyan-soft" : "text-muted"}
                size={17}
              />
              <span className="text-sm text-muted">{row.label}</span>
              <span className="font-mono text-xs">{row.value}</span>
            </div>
          );
        })}
      </div>

      {error ? <p className="mt-4 text-sm leading-6 text-coral">{error}</p> : null}
    </ProofSurface>
  );
}
