import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WalletReadiness } from "@/components/wallet-readiness";
import { dashboardCards, demoEvent } from "@/lib/demo-data";

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 border border-line bg-panel p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-normal text-accent">
              Role-aware dashboard
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Transparency console</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Organizer, collaborator, and attendee surfaces will resolve from
              the connected wallet address.
            </p>
          </div>
          <Link
            href="/dashboard/events/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
          >
            Create event <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <div className="border border-line bg-panel p-5" key={card.label}>
                <Icon className="text-accent" size={20} />
                <p className="mt-4 text-sm text-muted">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold leading-tight">
                  {card.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">{card.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border border-line bg-panel p-5">
            <p className="font-mono text-xs uppercase tracking-normal text-muted">
              Collaborator balances
            </p>
            <div className="mt-4 grid gap-3">
              {demoEvent.split.map((split) => (
                <div
                  className="grid grid-cols-[1fr_auto] items-center border border-line bg-background/30 p-3"
                  key={split.role}
                >
                  <div>
                    <p className="text-sm font-medium">{split.name}</p>
                    <p className="mt-1 text-xs text-muted">{split.role}</p>
                  </div>
                  <p className="font-mono text-lg text-accent">
                    {split.percent}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <WalletReadiness />
            <div className="border border-line bg-panel p-5">
              <p className="font-mono text-xs uppercase tracking-normal text-muted">
                Proof queue
              </p>
              <div className="mt-4 overflow-hidden border border-line">
                {["publish", "purchase", "mint", "check-in", "withdraw"].map(
                  (item, index) => (
                    <div
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line bg-background/30 p-3 last:border-b-0"
                      key={item}
                    >
                      <span className="font-mono text-xs text-muted">
                        0{index + 1}
                      </span>
                      <span className="capitalize">{item}</span>
                      <span className="font-mono text-xs text-accent">
                        pending
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
