import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Fingerprint,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EvidenceTimeline } from "@/components/evidence-timeline";
import {
  MetricTile,
  ProductPage,
  ProductPageHeader,
} from "@/components/ui/product-layout";
import { Alert } from "@/components/ui/feedback-primitives";
import { ProofSurface } from "@/components/ui/proof-surface";
import { QuorumButton } from "@/components/ui/quorum-button";
import { StatusPill } from "@/components/ui/status-pill";
import { getEvidenceEvent, listEvidence } from "@/lib/evidence/repository";
import { eventThemeStyle } from "@/lib/events/theme";
import { hasLiveStellarProof } from "@/lib/capability-presentation";

type EventProofPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

function shorten(value: string) {
  if (value.length <= 18) return value;

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default async function EventProofPage({ params }: EventProofPageProps) {
  const { slug } = await params;
  const event = await getEvidenceEvent(decodeURIComponent(slug));

  if (!event) {
    notFound();
  }

  let evidenceUnavailable = false;
  let records = [] as Awaited<ReturnType<typeof listEvidence>>;

  try {
    records = await listEvidence({ eventId: event.id, limit: 100 });
  } catch {
    evidenceUnavailable = true;
  }
  const liveCount = records.filter(hasLiveStellarProof).length;
  const indexedCount = records.filter(
    (record) => record.kind === "indexed_event",
  ).length;
  const actorCount = new Set(
    records
      .map((record) => record.actorWallet)
      .filter((wallet): wallet is string => Boolean(wallet)),
  ).size;

  return (
    <AppShell>
      <div style={eventThemeStyle(event)}>
        <ProductPage className="space-y-5">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
          >
            <ArrowLeft size={15} /> Back to event
          </Link>

          <ProductPageHeader
            actions={
              <QuorumButton href="/evidence" icon={<ArrowUpRight size={16} />}>
                Global evidence
              </QuorumButton>
            }
            description="This page only includes proof rows connected to this Quorum event. It keeps public global evidence separate from event-level proof so organizers, attendees, and judges can inspect the exact settlement trail."
            eyebrow="Event proof"
            icon={ShieldCheck}
            meta={
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill icon={Fingerprint} tone="local">
                  Event scope
                </StatusPill>
                <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-xs text-muted">
                  {shorten(event.id)}
                </span>
              </div>
            }
            title={event.title}
          >
            <div className="grid gap-3 md:grid-cols-3">
              <MetricTile
                detail="Rows mapped directly to this event."
                icon={RadioTower}
                label="proof rows"
                value={records.length}
              />
              <MetricTile
                detail="Rows with explorer-valid Stellar testnet hashes."
                icon={BadgeCheck}
                label="Explorer tx"
                tone="success"
                value={liveCount}
              />
              <MetricTile
                detail={`${indexedCount} indexed event rows included.`}
                icon={Fingerprint}
                label="actors"
                value={actorCount}
              />
            </div>
          </ProductPageHeader>

          {evidenceUnavailable ? (
            <Alert title="Event proof is temporarily unavailable." tone="warning">
              Quorum could not load the recorded activity for this event. No local
              or placeholder rows are shown in its place.
            </Alert>
          ) : null}

          <ProofSurface>
            <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr] md:items-center">
              <div>
                <StatusPill icon={RadioTower} tone="cyan">
                  Scoped feed
                </StatusPill>
                <h2 className="mt-4 font-product text-2xl font-medium">
                  Event-level proof, not a global transaction dump.
                </h2>
              </div>
              <p className="text-sm leading-6 text-muted">
                This protects context: public visitors can inspect the proof for
                this event without mixing it with unrelated Quorum activity.
                Wallet-specific credit/debit history still belongs on the
                collaborator ledger.
              </p>
            </div>
          </ProofSurface>

          <EvidenceTimeline
            description="Only proof rows connected to this event are shown here."
            emptyDescription="Publish, checkout, check-in, withdrawal, anchor payout, or indexed contract rows for this event will appear here after they are persisted."
            emptyTitle="No proof rows for this event yet"
            records={records}
            showEventLink={false}
            title="Event proof timeline"
          />
        </ProductPage>
      </div>
    </AppShell>
  );
}
