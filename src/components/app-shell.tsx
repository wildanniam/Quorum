import Link from "next/link";
import { ArrowUpRight, RadioTower } from "lucide-react";
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

      <header className="sticky top-0 z-20 border-b border-line/70 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:px-8">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3"
            aria-label="Quorum marketplace"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-accent/55 bg-accent text-accent-ink shadow-[0_0_32px_rgba(111,233,255,0.18)] transition group-hover:shadow-[0_0_42px_rgba(111,233,255,0.28)]">
              <span className="font-mono text-sm font-black">Q</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-none">
                Quorum
              </p>
              <p className="mt-1 hidden truncate font-mono text-[11px] uppercase tracking-normal text-muted sm:block">
                Stellar event checkout
              </p>
            </div>
          </Link>

          <DesktopNavigation />

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-[8px] border border-line/70 bg-panel/58 px-3 py-2 text-xs text-muted backdrop-blur-xl xl:flex">
              <span
                className={`h-2 w-2 rounded-full ${
                  liveConfigured ? "bg-success" : "bg-amber"
                }`}
              />
              <RadioTower size={14} />
              <span className="font-medium text-foreground">
                {liveConfigured ? "Testnet ready" : "Local proof"}
              </span>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <MobileNavigation />
      <main id="main-content">{children}</main>
      <footer className="border-t border-line/70 bg-background/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between lg:px-8">
          <p>
            {liveConfigured
              ? "Live testnet contracts configured. Browser signing remains manual."
              : "Local proof mode until live contract configuration is complete."}
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
