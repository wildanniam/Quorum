import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileKey2,
  Fingerprint,
  QrCode,
  ShieldCheck,
  TicketCheck,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { QrCodeCard } from "@/components/qr-code-card";
import { ProofSurface } from "@/components/ui/proof-surface";
import { QuorumButton } from "@/components/ui/quorum-button";
import { StatusPill } from "@/components/ui/status-pill";
import { listResources } from "@/lib/events/repository";
import { eventCoverStyle } from "@/lib/events/theme";
import {
  getPassReceipt,
  type ReceiptProofKind,
  type ReceiptProofRow,
  type ReceiptProofStatus,
} from "@/lib/passes/receipt";
import { cn } from "@/lib/ui";

type PassPageProps = {
  params: Promise<{
    tokenId: string;
  }>;
};

type ProofKindMeta = {
  Icon: LucideIcon;
  label: string;
};

const PROOF_KIND_META: Record<ReceiptProofKind, ProofKindMeta> = {
  check_in: {
    Icon: CheckCircle2,
    label: "Door proof",
  },
  metadata: {
    Icon: FileKey2,
    label: "Fingerprint",
  },
  mint: {
    Icon: TicketCheck,
    label: "Pass mint",
  },
  payment: {
    Icon: CircleDollarSign,
    label: "Checkout",
  },
  publish: {
    Icon: BadgeCheck,
    label: "Event publish",
  },
};

const PROOF_STATUS_CLASS: Record<ReceiptProofStatus, string> = {
  live: "border-quorum-cyan/50 bg-quorum-cyan/12 text-quorum-cyan-soft",
  local: "border-amber/45 bg-amber/10 text-amber",
  metadata: "border-cyan/45 bg-cyan/10 text-cyan",
  pending: "border-white/10 bg-white/[0.045] text-muted",
};

export const dynamic = "force-dynamic";

function shorten(value: string) {
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function sourceLabel(source: string) {
  return source === "free_claim" ? "Free claim" : "Purchase";
}

function statusLabel(status: ReceiptProofStatus) {
  if (status === "live") return "Live tx";
  if (status === "local") return "Local proof";
  if (status === "metadata") return "Metadata";

  return "Pending";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function ProofRow({ row }: { row: ReceiptProofRow }) {
  const meta = PROOF_KIND_META[row.kind];
  const Icon = meta.Icon;

  return (
    <article className="grid gap-3 rounded-[12px] border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
      <div className="grid h-11 w-11 place-items-center rounded-full border border-quorum-cyan/35 bg-quorum-cyan/10 text-quorum-cyan-soft">
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-product text-sm font-medium">{row.label}</p>
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 font-product text-[11px] font-medium leading-none",
              PROOF_STATUS_CLASS[row.status],
            )}
          >
            {statusLabel(row.status)}
          </span>
          <span className="rounded-full border border-white/10 bg-quorum-grey-800 px-2.5 py-1 font-product text-[11px] leading-none text-muted">
            {meta.label}
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">{row.description}</p>
        <p className="mt-2 break-all font-mono text-xs leading-5 text-foreground/88">
          {row.value ?? "Waiting for proof"}
        </p>
      </div>
      {row.explorerUrl ? (
        <Link
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-quorum-cyan/35 px-3 font-product text-sm text-quorum-cyan-soft transition hover:bg-quorum-cyan/10"
          href={row.explorerUrl}
          target="_blank"
        >
          Explorer <ExternalLink size={13} />
        </Link>
      ) : null}
    </article>
  );
}

export default async function PassPage({ params }: PassPageProps) {
  const { tokenId } = await params;
  const receipt = await getPassReceipt(decodeURIComponent(tokenId));

  if (!receipt) {
    notFound();
  }

  const { checkIn, event, pass, purchase, rows } = receipt;
  const resources = await listResources(event.id);

  return (
    <AppShell>
      <section className="quorum-proof-shell border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <Link
            href="/passes"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-quorum-cyan-soft"
          >
            <ArrowLeft size={15} /> Back to passes
          </Link>

          <div className="mt-6 grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start">
            <ProofSurface className="quorum-cyan-ring p-5" elevated>
              <div className="flex items-start justify-between gap-4">
                <StatusPill icon={ShieldCheck} tone="cyan">
                  Wallet-bound pass
                </StatusPill>
                <BadgeCheck className="text-quorum-cyan-soft" size={26} />
              </div>

              <div className="mt-8">
                <p className="font-product text-sm text-muted">Receipt</p>
                <h1 className="mt-2 font-product text-4xl font-medium leading-[1.08] tracking-normal text-foreground">
                  Attendee pass
                </h1>
                <p className="mt-4 text-sm leading-6 text-muted">{event.title}</p>
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-[12px] border border-white/10 bg-quorum-grey-800 p-3">
                  <p className="font-product text-xs text-muted">Token ID</p>
                  <p className="mt-2 font-mono text-xs leading-5 text-quorum-cyan-soft">
                    {shorten(pass.tokenId ?? pass.id)}
                  </p>
                </div>
                {[
                  {
                    Icon: WalletCards,
                    label: "Owner",
                    value: shorten(pass.ownerWallet),
                  },
                  {
                    Icon: ShieldCheck,
                    label: "Source",
                    value: sourceLabel(pass.source),
                  },
                  {
                    Icon: Fingerprint,
                    label: "Check-in",
                    value: pass.checkedIn ? "Checked in" : "Not checked in",
                  },
                  {
                    Icon: CalendarDays,
                    label: "Issued",
                    value: formatDate(pass.createdAt),
                  },
                ].map((item) => {
                  const Icon = item.Icon;

                  return (
                    <div
                      className="grid grid-cols-[auto_1fr] gap-3 rounded-[12px] border border-white/10 bg-white/[0.035] p-3"
                      key={item.label}
                    >
                      <Icon className="mt-0.5 text-quorum-cyan-soft" size={17} />
                      <div>
                        <p className="font-product text-xs text-muted">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm text-foreground">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {receipt.checkInQrPayload ? (
                <QrCodeCard
                  className="mt-5"
                  label="Door QR"
                  value={receipt.checkInQrPayload}
                />
              ) : null}

              <div className="mt-5 grid gap-3">
                <QuorumButton href={receipt.resourceUrl}>
                  Open resources
                </QuorumButton>
                <QuorumButton
                  href={receipt.checkInUrl ?? `/check-in/${event.id}`}
                  icon={<QrCode size={17} />}
                  variant="secondary"
                >
                  Verify check-in
                </QuorumButton>
              </div>
            </ProofSurface>

            <div className="grid gap-5">
              <ProofSurface className="overflow-hidden p-0" elevated>
                <div
                  className="event-cover min-h-[430px] p-5 lg:p-6"
                  style={eventCoverStyle(event)}
                >
                  <div className="flex h-full flex-col justify-between gap-10">
                    <div className="flex items-start justify-between gap-4">
                      <StatusPill tone={pass.checkedIn ? "success" : "cyan"}>
                        {pass.checkedIn ? "Checked in" : "Active"}
                      </StatusPill>
                      <StatusPill tone={purchase?.amountUsdc === "0" ? "muted" : "cyan"}>
                        {purchase ? `${purchase.amountUsdc} USDC` : "No payment"}
                      </StatusPill>
                    </div>
                    <div>
                      <p className="max-w-2xl break-all font-mono text-xs text-quorum-cyan-soft">
                        {receipt.receiptNumber}
                      </p>
                      <h2 className="mt-3 max-w-2xl font-product text-4xl font-medium leading-[1.05] tracking-normal text-white md:text-6xl">
                        {event.title}
                      </h2>
                      <p className="mt-4 max-w-2xl text-sm leading-6 text-white/76">
                        This receipt ties the holder wallet, non-transferable pass,
                        checkout proof, metadata fingerprint, and door check-in
                        evidence into one event record.
                      </p>
                    </div>
                  </div>
                </div>
              </ProofSurface>

              <ProofSurface>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <StatusPill icon={FileKey2} tone="cyan">
                      Receipt proof path
                    </StatusPill>
                    <h2 className="mt-4 font-product text-2xl font-medium tracking-normal">
                      Evidence attached to this pass
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                      Local proofs are intentionally labeled. Live Stellar
                      transactions expose explorer links when a valid testnet hash is
                      available.
                    </p>
                  </div>
                  <QuorumButton
                    className="whitespace-nowrap sm:w-auto"
                    href={receipt.eventProofUrl}
                    icon={<ArrowUpRight size={16} />}
                    variant="secondary"
                  >
                    Event proof
                  </QuorumButton>
                </div>

                <div className="mt-5 grid gap-3">
                  {rows.map((row) => (
                    <ProofRow key={row.kind} row={row} />
                  ))}
                </div>
              </ProofSurface>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <ProofSurface>
          <div className="grid gap-5 md:grid-cols-[0.72fr_1.28fr] md:items-start">
            <div>
              <StatusPill icon={FileKey2} tone="muted">
                Included resources
              </StatusPill>
              <h2 className="mt-4 font-product text-2xl font-medium tracking-normal">
                Access unlocked by this pass
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Resource access remains tied to the connected wallet that owns
                this pass. The receipt stays useful after the event as proof of
                ownership and check-in.
              </p>
              {checkIn ? (
                <p className="mt-4 rounded-[12px] border border-success/35 bg-success/10 p-3 text-sm leading-6 text-success">
                  Checked in by organizer wallet {shorten(checkIn.checkedInByWallet)}.
                </p>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {resources.length > 0 ? (
                resources.map((resource) => (
                  <div
                    className="rounded-[12px] border border-white/10 bg-white/[0.035] p-4"
                    key={resource.id}
                  >
                    <FileKey2 className="text-quorum-cyan-soft" size={18} />
                    <p className="mt-3 font-product font-medium">
                      {resource.title}
                    </p>
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.08em] text-muted">
                      {resource.type}
                    </p>
                    {resource.description ? (
                      <p className="mt-2 text-xs leading-5 text-muted">
                        {resource.description}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[12px] border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-muted md:col-span-3">
                  No gated resources have been attached to this event yet.
                </div>
              )}
            </div>
          </div>
        </ProofSurface>
      </section>
    </AppShell>
  );
}
