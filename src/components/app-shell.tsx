import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  DesktopNavigation,
  EvidenceUtilityLink,
  MobileNavigation,
} from "@/components/app-navigation";
import { ProductMark } from "@/components/ui/product-layout";
import { WalletButton } from "@/components/wallet-button";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return <ProductShell>{children}</ProductShell>;
}

export function ProductShell({ children }: AppShellProps) {
  return (
    <div className="quorum-product-shell">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[8px] focus:bg-quorum-cyan focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-ink"
        href="#main-content"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0b0b]/72 shadow-[0_18px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-5 lg:min-h-[5.25rem] lg:gap-5 lg:px-8">
          <ProductMark imageClassName="h-9 sm:h-10" />

          <DesktopNavigation />

          <div className="flex items-center gap-2">
            <EvidenceUtilityLink />
            <WalletButton />
          </div>
        </div>
      </header>

      <MobileNavigation />
      <main id="main-content" className="relative z-0 pb-24 lg:pb-0">
        {children}
      </main>
      <footer className="border-t border-white/10 bg-[#0c0b0b]/84 pb-24 lg:pb-0">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Quorum uses Stellar Testnet. Wallet approval remains explicit for every action.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-foreground transition hover:text-quorum-cyan-soft"
          >
            Open Studio <ArrowUpRight size={14} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
