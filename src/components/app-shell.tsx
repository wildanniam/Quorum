import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { navItems } from "@/lib/demo-data";
import { WalletButton } from "@/components/wallet-button";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground quorum-grid">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-background/86 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center border border-accent bg-accent text-accent-ink">
              <span className="font-mono text-sm font-black">Q</span>
            </div>
            <div>
              <p className="font-semibold leading-none">Quorum</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-normal text-muted">
                Stellar event checkout
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className="px-3 py-2 text-sm text-muted transition hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <WalletButton />
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-line bg-background/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-muted md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Draft MVP surface · Testnet-only until final verification.</p>
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
