import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { demoEvent, eventFacts } from "@/lib/demo-data";

export default function EventPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
        >
          <ArrowLeft size={15} /> Marketplace
        </Link>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border border-line bg-panel">
            <div className="event-cover min-h-[340px] border-b border-line p-6">
              <span className="border border-accent bg-accent px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-normal text-accent-ink">
                {demoEvent.price}
              </span>
            </div>
            <div className="p-6">
              <p className="font-mono text-sm uppercase tracking-normal text-accent">
                {demoEvent.type}
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">
                {demoEvent.title}
              </h1>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {eventFacts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div
                      className="flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted"
                      key={fact.label}
                    >
                      <Icon className="text-accent" size={17} />
                      {fact.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="border border-line bg-panel p-5">
            <p className="font-mono text-xs uppercase tracking-normal text-muted">
              Split locked after publish
            </p>
            <div className="mt-4 grid gap-3">
              {demoEvent.split.map((split) => (
                <div
                  className="grid grid-cols-[1fr_auto] border border-line bg-background/35 p-4"
                  key={split.role}
                >
                  <div>
                    <p className="font-medium">{split.name}</p>
                    <p className="mt-1 text-sm text-muted">{split.role}</p>
                  </div>
                  <p className="font-mono text-2xl text-accent">
                    {split.percent}%
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/passes"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
            >
              Preview pass <ArrowUpRight size={16} />
            </Link>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
