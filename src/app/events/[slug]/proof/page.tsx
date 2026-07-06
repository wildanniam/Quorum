import Link from "next/link";
import { ArrowLeft, ExternalLink, RadioTower } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EvidenceTimeline } from "@/components/evidence-timeline";
import { getEvidenceEvent, listEvidence } from "@/lib/evidence/repository";
import { eventThemeStyle } from "@/lib/events/theme";

type EventProofPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EventProofPage({ params }: EventProofPageProps) {
  const { slug } = await params;
  const event = await getEvidenceEvent(decodeURIComponent(slug));

  if (!event) {
    notFound();
  }

  const records = await listEvidence({ eventId: event.id, limit: 100 });
  const liveCount = records.filter((record) => record.txHash).length;

  return (
    <AppShell>
      <section
        className="border-b border-foreground/8"
        style={eventThemeStyle(event)}
      >
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
          >
            <ArrowLeft size={15} /> Back to event
          </Link>

          <div className="mt-6 rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-accent/45 bg-accent/10 px-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent">
                  <RadioTower size={14} />
                  Event proof
                </div>
                <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
                  {event.title}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
                  Settlement proof for this event only: publish, checkout,
                  check-in, withdrawal, and indexed contract events that map
                  back to this Quorum event.
                </p>
              </div>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
                href="/evidence"
              >
                Global evidence <ExternalLink size={16} />
              </Link>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { label: "proof rows", value: records.length },
                { label: "tx hashes", value: liveCount },
                { label: "event id", value: event.id },
              ].map((item) => (
                <div
                  className="rounded-[8px] border border-foreground/10 bg-background/32 p-4"
                  key={item.label}
                >
                  <p className="break-all font-mono text-xl text-accent">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-muted">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <EvidenceTimeline records={records} />
      </section>
    </AppShell>
  );
}
