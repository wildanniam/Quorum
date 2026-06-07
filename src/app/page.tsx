import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { demoEvent, marketplaceStats, proofRail } from "@/lib/demo-data";

const toneClass: Record<string, string> = {
  accent: "text-accent",
  cyan: "text-cyan",
  amber: "text-amber",
  coral: "text-coral",
};

export default function Home() {
  return (
    <AppShell>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl gap-0 px-5 py-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-12">
          <div className="event-cover min-h-[460px] border border-line p-6 md:p-8">
            <div className="flex h-full flex-col justify-between">
              <div className="flex flex-wrap gap-2">
                <span className="border border-accent bg-accent px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-normal text-accent-ink">
                  Published
                </span>
                <span className="border border-foreground/20 bg-background/70 px-2.5 py-1 font-mono text-xs uppercase tracking-normal">
                  One pass / wallet
                </span>
              </div>

              <div className="max-w-3xl">
                <p className="font-mono text-sm uppercase tracking-normal text-accent">
                  Featured event
                </p>
                <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.02] text-foreground md:text-7xl">
                  {demoEvent.title}
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-foreground/82">
                  {demoEvent.type} with escrowed USDC splits, non-transferable
                  NFT passes, gated resources, and check-in proof.
                </p>
              </div>
            </div>
          </div>

          <aside className="border-x border-b border-line bg-panel lg:border-l-0 lg:border-t">
            <div className="grid grid-cols-2 border-b border-line">
              {marketplaceStats.map((stat) => (
                <div className="border-line p-5 odd:border-r" key={stat.label}>
                  <p
                    className={`font-mono text-3xl font-semibold ${toneClass[stat.tone]}`}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-muted">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="p-6">
              <p className="font-mono text-xs uppercase tracking-normal text-muted">
                Proof path
              </p>
              <div className="mt-5 grid gap-3">
                {proofRail.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      className="flex items-center justify-between border border-line bg-background/44 p-4"
                      key={item.label}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="text-accent" size={18} />
                        <span className="text-sm text-muted">{item.label}</span>
                      </div>
                      <span className="text-right font-mono text-sm">
                        {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
                  href={`/events/${demoEvent.slug}`}
                >
                  Open event <ArrowUpRight size={16} />
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-line bg-panel-strong px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
                  href="/dashboard"
                >
                  Dashboard <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-normal text-muted">
              Marketplace
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Published events</h2>
          </div>
          <Link
            href="/dashboard/events/new"
            className="hidden items-center gap-2 text-sm text-muted transition hover:text-accent sm:inline-flex"
          >
            Create event <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <Link
            href={`/events/${demoEvent.slug}`}
            className="group grid border border-line bg-panel transition hover:border-accent md:grid-cols-[0.9fr_1.1fr]"
          >
            <div className="event-cover min-h-64 border-b border-line md:border-b-0 md:border-r" />
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                <span className="border border-line px-2.5 py-1 font-mono text-xs text-muted">
                  {demoEvent.price}
                </span>
                <span className="border border-line px-2.5 py-1 font-mono text-xs text-muted">
                  {demoEvent.sold}/{demoEvent.capacity} sold
                </span>
              </div>
              <h3 className="mt-5 text-3xl font-semibold leading-tight">
                {demoEvent.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                Collaborator splits are locked after publish and visible to every
                wallet involved in the event.
              </p>
              <div className="mt-6 grid gap-2">
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
          </Link>

          <div className="border border-line bg-panel p-5">
            <p className="font-mono text-xs uppercase tracking-normal text-muted">
              Access utility
            </p>
            <div className="mt-5 grid gap-3">
              {demoEvent.resources.map((resource) => (
                <div
                  className="border border-line bg-background/30 p-4"
                  key={resource.title}
                >
                  <p className="font-mono text-xs text-accent">
                    {resource.type}
                  </p>
                  <p className="mt-2 font-medium">{resource.title}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">
              Resources unlock from the Quorum pass page once the connected
              wallet owns the event NFT.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
