import Link from "next/link";
import { ArrowRight, RadioTower } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EvidenceTimeline } from "@/components/evidence-timeline";
import { listEvidence } from "@/lib/evidence/repository";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const records = await listEvidence({ limit: 150 });
  const liveCount = records.filter((record) => record.txHash).length;
  const indexedCount = records.filter(
    (record) => record.kind === "indexed_event",
  ).length;
  const eventCount = new Set(
    records
      .map((record) => record.eventId)
      .filter((eventId): eventId is string => Boolean(eventId)),
  ).size;

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-accent/45 bg-accent/10 px-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent">
                <RadioTower size={14} />
                Live evidence
              </div>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
                Public proof for Quorum settlement.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
                A judge-safe timeline of Quorum publish, checkout, check-in,
                withdrawal, and indexed Stellar contract events with external
                explorer links when a transaction hash is available.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
              href="/discover"
            >
              Browse events <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              { label: "proof rows", value: records.length },
              { label: "tx hashes", value: liveCount },
              { label: "events", value: eventCount || indexedCount },
            ].map((item) => (
              <div
                className="rounded-[8px] border border-foreground/10 bg-background/32 p-4"
                key={item.label}
              >
                <p className="font-mono text-3xl text-accent">{item.value}</p>
                <p className="mt-2 text-sm text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <EvidenceTimeline records={records} />
        </div>
      </section>
    </AppShell>
  );
}
