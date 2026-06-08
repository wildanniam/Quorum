import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import {
  DesktopNavigation,
  MobileNavigation,
} from "@/components/app-navigation";
import { WalletButton } from "@/components/wallet-button";
import { getContractReadiness } from "@/lib/stellar/contracts";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const readiness = getContractReadiness();
  const liveConfigured = readiness.proofMode === "live";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground quorum-grid">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[8px] focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-ink"
        href="#main-content"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-foreground/8 bg-background/72 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:px-8">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3"
            aria-label="Quorum marketplace"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/12 text-accent shadow-[0_0_38px_var(--event-glow)] transition group-hover:border-accent/70 group-hover:bg-accent/18">
              <span className="font-display text-xl font-semibold leading-none">
                Q
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-none tracking-tight">
                Quorum
              </p>
              <p className="mt-1 hidden truncate text-[11px] font-medium text-muted sm:block">
                Events with wallet-native access
              </p>
            </div>
          </Link>

          <DesktopNavigation />

          <div className="flex items-center gap-2">
            <div className="hidden min-h-10 items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.045] px-3 text-xs text-muted backdrop-blur-xl xl:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  liveConfigured ? "bg-success" : "bg-amber"
                }`}
              />
              <Sparkles size={14} />
              <span className="font-medium text-foreground">
                {liveConfigured ? "Testnet live" : "Preview mode"}
              </span>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <MobileNavigation />
      <main id="main-content">{children}</main>
      <footer className="border-t border-foreground/8 bg-background/84">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            {liveConfigured
              ? "Quorum is running on Stellar testnet with explicit wallet approval."
              : "Preview mode keeps the product flow available while live proofs are configured."}
          </p>
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2 text-foreground transition hover:text-accent"
          >
            Create event <ArrowUpRight size={14} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
