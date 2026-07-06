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

type EvidenceTimelineProps = {
  records: EvidenceRecord[];
};

const KIND_META: Record<
  EvidenceKind,
  { Icon: LucideIcon; label: string; tone: string }
> = {
  anchor_payout: {
    Icon: BanknoteArrowUp,
    label: "Anchor payout",
    tone: "text-quorum-cyan-soft",
  },
  check_in: {
    Icon: ScanLine,
    label: "Check-in",
    tone: "text-success",
  },
  free_claim: {
    Icon: TicketCheck,
    label: "Free claim",
    tone: "text-cyan",
  },
  indexed_event: {
    Icon: RadioTower,
    label: "Indexed",
    tone: "text-muted",
  },
  paid_checkout: {
    Icon: CircleDollarSign,
    label: "Paid checkout",
    tone: "text-amber",
  },
  publish: {
    Icon: BadgeCheck,
    label: "Publish",
    tone: "text-accent",
  },
  withdrawal: {
    Icon: Fingerprint,
    label: "Withdrawal",
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

export function EvidenceTimeline({ records }: EvidenceTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-6">
        <RadioTower className="text-accent" size={24} />
        <h2 className="mt-4 text-2xl font-semibold">No evidence recorded yet</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          Live publish, checkout, check-in, anchor payout, withdrawal, or
          indexed contract events will appear here after they are persisted.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[8px] border border-foreground/10">
      {records.map((record) => {
        const meta = KIND_META[record.kind];
        const Icon = meta.Icon;
        const amount = amountLabel(record);

        return (
          <article
            className="grid gap-4 border-b border-foreground/10 bg-foreground/[0.045] p-4 last:border-b-0 lg:grid-cols-[auto_1fr_auto] lg:items-center"
            key={record.id}
          >
            <div
              className={`grid h-11 w-11 place-items-center rounded-[8px] border border-foreground/10 bg-background/42 ${meta.tone}`}
            >
              <Icon size={20} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-[6px] border border-foreground/10 bg-background/32 px-2.5 py-1 font-mono text-xs uppercase tracking-normal ${meta.tone}`}
                >
                  {meta.label}
                </span>
                <span className="rounded-[6px] border border-foreground/10 bg-background/32 px-2.5 py-1 font-mono text-xs text-muted">
                  {record.status}
                </span>
                {amount ? (
                  <span className="rounded-[6px] border border-foreground/10 bg-background/32 px-2.5 py-1 font-mono text-xs text-foreground">
                    {amount}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 truncate text-lg font-semibold">
                {record.eventTitle ?? record.sourceLabel}
              </h3>
              <p className="mt-1 break-all font-mono text-xs leading-5 text-muted">
                {record.txHash ?? record.sourceLabel}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
                <span>{formatDate(record.occurredAt)} UTC</span>
                <span>{shorten(record.actorWallet)}</span>
                {record.tokenId ? <span>token {record.tokenId}</span> : null}
                {record.ledger !== null ? <span>ledger {record.ledger}</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {record.eventSlug ? (
                <Link
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-foreground/10 px-3 text-sm text-muted transition hover:border-accent/45 hover:text-accent"
                  href={`/events/${record.eventSlug}/proof`}
                >
                  Event proof <ArrowUpRight size={13} />
                </Link>
              ) : null}
              {record.explorerUrl ? (
                <Link
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-accent px-3 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
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
    </div>
  );
}
