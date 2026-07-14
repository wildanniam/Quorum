import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  BanknoteArrowUp,
  CircleDollarSign,
  Fingerprint,
  RadioTower,
  ScanLine,
  TicketCheck,
  type LucideIcon,
} from "lucide-react";
import type { EvidenceKind, EvidenceRecord } from "@/lib/db/models";
import { getEvidenceProofPresentation } from "@/lib/capability-presentation";
import { cn } from "@/lib/ui";
import { ProofSurface } from "@/components/ui/proof-surface";
import { StatusPill } from "@/components/ui/status-pill";

type EvidenceTimelineProps = {
  className?: string;
  description?: string;
  emptyDescription?: string;
  emptyTitle?: string;
  records: EvidenceRecord[];
  showEventLink?: boolean;
  title?: string;
};

const KIND_META: Record<
  EvidenceKind,
  { Icon: LucideIcon; label: string; rail: string; tone: string }
> = {
  anchor_payout: {
    Icon: BanknoteArrowUp,
    label: "Anchor payout",
    rail: "bg-quorum-cyan/70 shadow-[0_0_24px_rgba(38,198,218,0.28)]",
    tone: "text-quorum-cyan-soft",
  },
  check_in: {
    Icon: ScanLine,
    label: "Check-in",
    rail: "bg-success/70 shadow-[0_0_24px_rgba(149,201,138,0.22)]",
    tone: "text-success",
  },
  free_claim: {
    Icon: TicketCheck,
    label: "Free claim",
    rail: "bg-cyan/70 shadow-[0_0_24px_rgba(38,198,218,0.22)]",
    tone: "text-cyan",
  },
  indexed_event: {
    Icon: RadioTower,
    label: "Indexed",
    rail: "bg-muted/70",
    tone: "text-muted",
  },
  paid_checkout: {
    Icon: CircleDollarSign,
    label: "Paid checkout",
    rail: "bg-amber/70 shadow-[0_0_24px_rgba(217,168,92,0.22)]",
    tone: "text-amber",
  },
  publish: {
    Icon: BadgeCheck,
    label: "Publish",
    rail: "bg-accent/70 shadow-[0_0_24px_rgba(38,198,218,0.24)]",
    tone: "text-accent",
  },
  withdrawal: {
    Icon: Fingerprint,
    label: "Withdrawal",
    rail: "bg-coral/70 shadow-[0_0_24px_rgba(217,133,113,0.22)]",
    tone: "text-coral",
  },
};

function shorten(value: string | null) {
  if (!value) return "system";
  if (value.length <= 18) return value;

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function amountLabel(record: EvidenceRecord) {
  if (!record.amountUsdc || !record.asset) return null;

  return `${record.amountUsdc} ${record.asset}`;
}

export function EvidenceTimeline({
  className,
  description,
  emptyDescription = "Recorded publish, checkout, check-in, anchor payout, withdrawal, or indexed contract events will appear here after they are persisted.",
  emptyTitle = "No evidence recorded yet",
  records,
  showEventLink = true,
  title,
}: EvidenceTimelineProps) {
  if (records.length === 0) {
    return (
      <ProofSurface className={className} elevated>
        <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
          <div className="grid h-12 w-12 place-items-center rounded-[12px] border border-quorum-cyan/35 bg-quorum-cyan/10 text-quorum-cyan-soft">
            <RadioTower size={23} />
          </div>
          <div>
            <h2 className="font-product text-2xl font-medium">{emptyTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              {emptyDescription}
            </p>
          </div>
        </div>
      </ProofSurface>
    );
  }

  return (
    <ProofSurface className={cn("overflow-hidden", className)} elevated variant="table">
      {title || description ? (
        <div className="border-b border-white/10 bg-white/[0.025] p-5">
          {title ? (
            <h2 className="font-product text-2xl font-medium">{title}</h2>
          ) : null}
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {records.map((record) => {
        const meta = KIND_META[record.kind];
        const Icon = meta.Icon;
        const amount = amountLabel(record);
        const mode = getEvidenceProofPresentation(record);

        return (
          <article
            className="group grid gap-4 border-b border-white/10 bg-white/[0.026] p-4 transition hover:bg-white/[0.045] last:border-b-0 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:p-5"
            key={record.id}
          >
            <div className="flex items-center gap-3 lg:block">
              <div className="relative grid h-12 w-12 place-items-center rounded-[12px] border border-white/10 bg-background/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <span
                  className={cn(
                    "absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full",
                    meta.rail,
                  )}
                />
                <Icon className={meta.tone} size={21} />
              </div>
              <div className="lg:hidden">
                <p className="font-product text-base font-medium">
                  {meta.label}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatDate(record.occurredAt)} UTC
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.045] px-2.5 py-1 font-product text-xs font-medium text-foreground">
                  {meta.label}
                </span>
                <StatusPill className="min-h-7 px-2.5" tone={mode.tone}>
                  {mode.label}
                </StatusPill>
                <span className="rounded-full border border-white/10 bg-background/40 px-2.5 py-1 font-mono text-xs text-muted">
                  {record.status}
                </span>
                {amount ? (
                  <span className="rounded-full border border-quorum-cyan/30 bg-quorum-cyan/10 px-2.5 py-1 font-mono text-xs text-quorum-cyan-soft">
                    {amount}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 truncate font-product text-xl font-medium">
                {record.eventTitle ?? record.sourceLabel}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted">{mode.helper}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
                <span>{formatDate(record.occurredAt)} UTC</span>
              </div>
              <details className="mt-3 rounded-[6px] border border-white/10 bg-background/34 p-3">
                <summary className="cursor-pointer text-xs font-medium text-muted">
                  Technical details
                </summary>
                <div className="mt-3 grid gap-2 text-xs text-muted md:grid-cols-2">
                  <p className="min-w-0 break-all font-mono">
                    <span className="text-foreground/70">source:</span>{" "}
                    {record.txHash ?? record.sourceLabel}
                  </p>
                  <p className="min-w-0 break-all font-mono">
                    <span className="text-foreground/70">actor:</span>{" "}
                    {shorten(record.actorWallet)}
                  </p>
                  {record.tokenId ? <p className="break-all font-mono">token: {record.tokenId}</p> : null}
                  {record.ledger !== null ? <p className="font-mono">ledger: {record.ledger}</p> : null}
                </div>
              </details>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {showEventLink && record.eventSlug ? (
                <Link
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-white/12 px-3 text-sm text-muted transition hover:border-quorum-cyan/45 hover:text-quorum-cyan-soft"
                  href={`/events/${record.eventSlug}/proof`}
                >
                  Event proof <ArrowUpRight size={13} />
                </Link>
              ) : null}
              {record.explorerUrl ? (
                <Link
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-quorum-cyan px-3 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
                  href={record.explorerUrl}
                  target="_blank"
                >
                  Explorer <ArrowUpRight size={13} />
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
    </ProofSurface>
  );
}
