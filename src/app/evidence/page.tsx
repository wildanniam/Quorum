import {
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EvidenceTimeline } from "@/components/evidence-timeline";
import { ProductPage } from "@/components/ui/product-layout";
import { CompactPageHeader, TaskPanel } from "@/components/ui/product-primitives";
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
  return (
    <AppShell>
      <ProductPage className="space-y-8" spacing="default">
        <CompactPageHeader
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
          description="A readable record of what happened in Quorum. Stellar transactions, indexed contract events, and app proof remain clearly labeled."
          eyebrow="Live evidence"
          icon={ShieldCheck}
          title="Trace Quorum settlement from checkout to payout."
        />

        {evidenceUnavailable ? (
            <TaskPanel tone="muted" className="border-coral/25 bg-coral/10 text-coral">
              Evidence data is temporarily unavailable. The page shell is ready,
              but the database connection did not respond in this local session.
            </TaskPanel>
        ) : null}

        <EvidenceTimeline
          description="Newest activity first. Open a row's technical details only when you need its source, actor, or ledger reference."
          records={records}
          title="Proof timeline"
        />
      </ProductPage>
    </AppShell>
  );
}
