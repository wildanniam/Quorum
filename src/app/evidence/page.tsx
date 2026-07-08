import {
  ArrowUpRight,
  BadgeCheck,
  DatabaseZap,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EvidenceTimeline } from "@/components/evidence-timeline";
import {
  MetricTile,
  ProductPage,
  ProductPageHeader,
  SectionHeader,
} from "@/components/ui/product-layout";
import { ProofSurface } from "@/components/ui/proof-surface";
import { QuorumButton } from "@/components/ui/quorum-button";
import { StatusPill } from "@/components/ui/status-pill";
import { listEvidence } from "@/lib/evidence/repository";

export const dynamic = "force-dynamic";

async function loadEvidenceRecords() {
  try {
    return {
      evidenceUnavailable: false,
      records: await listEvidence({ limit: 150 }),
    };
  } catch {
    return {
      evidenceUnavailable: true,
      records: [],
    };
  }
}

export default async function EvidencePage() {
  const { evidenceUnavailable, records } = await loadEvidenceRecords();
  const liveCount = records.filter((record) => record.txHash).length;
  const indexedCount = records.filter(
    (record) => record.kind === "indexed_event",
  ).length;
  const appProofCount = records.filter(
    (record) => !record.txHash && record.ledger === null,
  ).length;
  const eventCount = new Set(
    records
      .map((record) => record.eventId)
      .filter((eventId): eventId is string => Boolean(eventId)),
  ).size;

  return (
    <AppShell>
      <ProductPage className="space-y-5">
        <ProductPageHeader
          actions={
            <>
              <QuorumButton href="/discover" variant="secondary">
                Browse events
              </QuorumButton>
              <QuorumButton
                href="/dashboard/ledger"
                icon={<ArrowUpRight size={16} />}
              >
                Wallet ledger
              </QuorumButton>
            </>
          }
          description="A public, judge-readable proof hub for Quorum activity. Rows with a Stellar transaction hash link out to the explorer; indexed ledger rows and app proof rows are labeled clearly when they are not external transactions."
          eyebrow="Live evidence"
          icon={ShieldCheck}
          title="Trace Quorum settlement from checkout to payout."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                detail: "Everything Quorum can currently show in this proof feed.",
                icon: RadioTower,
                label: "proof rows",
                value: records.length,
              },
              {
                detail: "Rows that can open directly in Stellar Expert.",
                icon: BadgeCheck,
                label: "Stellar tx hashes",
                value: liveCount,
              },
              {
                detail: "Unique Quorum events represented in this feed.",
                icon: DatabaseZap,
                label: "events indexed",
                value: eventCount || indexedCount,
              },
            ].map((item) => (
              <MetricTile
                detail={item.detail}
                icon={item.icon}
                label={item.label}
                key={item.label}
                value={item.value}
              />
            ))}
          </div>

          {evidenceUnavailable ? (
            <div className="mt-5 rounded-[8px] border border-coral/25 bg-coral/10 p-4 text-sm leading-6 text-coral">
              Evidence data is temporarily unavailable. The page shell is ready,
              but the database connection did not respond in this local session.
            </div>
          ) : null}
        </ProductPageHeader>

        <ProofSurface>
          <SectionHeader
            description="This separates external on-chain evidence from Quorum-local proof so reviewers can inspect exactly what has been verified and where."
            eyebrow="Proof coverage"
            title="Every proof row states its evidence level."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[12px] border border-success/20 bg-success/10 p-4">
              <StatusPill icon={BadgeCheck} tone="live">
                Stellar tx
              </StatusPill>
              <p className="mt-4 font-mono text-2xl text-success">
                {liveCount}
              </p>
              <p className="mt-2 text-sm text-muted">
                Explorer-verifiable transaction rows.
              </p>
            </div>
            <div className="rounded-[12px] border border-quorum-cyan/25 bg-quorum-cyan/10 p-4">
              <StatusPill icon={RadioTower} tone="cyan">
                Indexed ledger
              </StatusPill>
              <p className="mt-4 font-mono text-2xl text-quorum-cyan-soft">
                {indexedCount}
              </p>
              <p className="mt-2 text-sm text-muted">
                Contract events observed by the indexer.
              </p>
            </div>
            <div className="rounded-[12px] border border-white/10 bg-white/[0.035] p-4">
              <StatusPill icon={DatabaseZap} tone="local">
                App proof
              </StatusPill>
              <p className="mt-4 font-mono text-2xl text-quorum-cyan-soft">
                {appProofCount}
              </p>
              <p className="mt-2 text-sm text-muted">
                Quorum records without external tx hashes.
              </p>
            </div>
          </div>
        </ProofSurface>

        <EvidenceTimeline
          description="Newest proof rows first, grouped by source type with explorer links where available."
          records={records}
          title="Proof timeline"
        />
      </ProductPage>
    </AppShell>
  );
}
