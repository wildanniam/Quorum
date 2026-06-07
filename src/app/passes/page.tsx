import Link from "next/link";
import { ArrowUpRight, BadgeCheck, QrCode } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { demoEvent } from "@/lib/demo-data";

export default function PassesPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border border-line bg-panel p-6">
            <p className="font-mono text-xs uppercase tracking-normal text-accent">
              Event pass
            </p>
            <h1 className="mt-2 text-4xl font-semibold">
              Non-transferable NFT access
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted">
              Each purchase or claim creates a unique token in the Quorum pass
              contract. The pass page is the canonical visual surface.
            </p>
          </div>

          <div className="border border-line bg-panel-strong p-5">
            <div className="event-cover min-h-72 border border-line p-5">
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="border border-accent bg-accent px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-normal text-accent-ink">
                    Token #012
                  </span>
                  <BadgeCheck className="text-accent" size={22} />
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-normal text-accent">
                    QuorumPassNFT
                  </p>
                  <h2 className="mt-2 max-w-lg text-4xl font-semibold leading-tight">
                    {demoEvent.title}
                  </h2>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Link
                href={`/events/${demoEvent.slug}/resources`}
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
              >
                Open resources <ArrowUpRight size={16} />
              </Link>
              <Link
                href={`/check-in/${demoEvent.id}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-line bg-panel px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
              >
                <QrCode size={16} /> Verify pass
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
