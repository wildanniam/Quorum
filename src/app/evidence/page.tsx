import { RadioTower } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EvidenceTimeline } from "@/components/evidence-timeline";
import {
  MetricTile,
  ProductPage,
  ProductPageHeader,
} from "@/components/ui/product-layout";
import { QuorumButton } from "@/components/ui/quorum-button";
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
  const eventCount = new Set(
    records
      .map((record) => record.eventId)
      .filter((eventId): eventId is string => Boolean(eventId)),
  ).size;

  return (
    <AppShell>
      <ProductPage>
        <ProductPageHeader
          actions={<QuorumButton href="/discover">Browse events</QuorumButton>}
          description="A judge-safe timeline of Quorum publish, checkout, check-in, anchor payout, withdrawal, and indexed Stellar contract events with external explorer links when a transaction hash is available."
          eyebrow="Live evidence"
          icon={RadioTower}
          title="Public proof for Quorum settlement."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "proof rows", value: records.length, icon: RadioTower },
              { label: "tx hashes", value: liveCount, icon: RadioTower },
              { label: "events", value: eventCount || indexedCount, icon: RadioTower },
            ].map((item) => (
              <MetricTile
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

        <div className="mt-5">
          <EvidenceTimeline records={records} />
        </div>
      </ProductPage>
    </AppShell>
  );
}
