import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  ArrowUpRight,
  BanknoteArrowUp,
  CircleDollarSign,
  Handshake,
  RadioTower,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AnchorPayoutButton } from "@/components/anchor/anchor-payout-button";
import { AnchorPayoutSyncButton } from "@/components/anchor/anchor-payout-sync-button";
import { ProofSurface } from "@/components/ui/proof-surface";
import { StatusPill } from "@/components/ui/status-pill";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import {
  listAnchorPayoutOpportunities,
  listAnchorPayoutsWithEventsByWallet,
} from "@/lib/anchor/payouts";
import {
  getCollaboratorLedgerSummary,
  listCollaboratorLedger,
} from "@/lib/ledger/repository";

export const dynamic = "force-dynamic";

function shorten(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function CollaboratorLedgerPage() {
  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const entries = session
    ? await listCollaboratorLedger(session.walletAddress)
    : [];
  const anchorOpportunities = session
    ? await listAnchorPayoutOpportunities(session.walletAddress)
    : [];
  const anchorPayouts = session
    ? await listAnchorPayoutsWithEventsByWallet(session.walletAddress)
    : [];
  const summary = session
    ? await getCollaboratorLedgerSummary(session.walletAddress)
    : {
        entryCount: 0,
        eventCount: 0,
        totalEarnedUsdc: "0",
        totalWithdrawnUsdc: "0",
        withdrawableUsdc: "0",
      };

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
        >
          <ArrowLeft size={15} /> Back to Studio
        </Link>

        <ProofSurface className="mt-6 lg:p-6" elevated>
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <StatusPill icon={Handshake} tone="cyan">
                Collaborator ledger
              </StatusPill>
              <h1 className="mt-5 max-w-4xl font-product text-5xl font-medium leading-[1.05] tracking-normal md:text-7xl">
                Credits and withdrawals, tied to proof.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
                {session
                  ? shorten(session.walletAddress)
                  : "Connect the collaborator wallet to see only its related event ledger."}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.045] px-4 py-3 text-sm text-muted">
              <WalletCards className="text-quorum-cyan-soft" size={18} />
              {summary.entryCount} ledger rows
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              {
                icon: CircleDollarSign,
                label: "earned",
                value: `${summary.totalEarnedUsdc} USDC`,
              },
              {
                icon: BanknoteArrowUp,
                label: "withdrawn",
                value: `${summary.totalWithdrawnUsdc} USDC`,
              },
              {
                icon: Handshake,
                label: "withdrawable",
                value: `${summary.withdrawableUsdc} USDC`,
              },
              {
                icon: WalletCards,
                label: "events",
                value: String(summary.eventCount),
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="rounded-[12px] border border-white/10 bg-white/[0.035] p-4"
                  key={item.label}
                >
                  <Icon className="text-quorum-cyan-soft" size={18} />
                  <p className="mt-4 break-all font-mono text-xl text-foreground">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-muted">{item.label}</p>
                </div>
              );
            })}
          </div>
        </ProofSurface>

        {session ? (
          <ProofSurface className="mt-5">
            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <StatusPill icon={RadioTower} tone="cyan">
                  Anchor payout rail
                </StatusPill>
                <h2 className="mt-4 font-product text-2xl font-medium">
                  Request anchor payouts from withdrawable USDC.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  MoneyGram payouts start with wallet authorization, then open
                  the anchor-hosted flow for pickup details. Local mock payouts
                  stay available for development and still produce ledger proof.
                </p>
              </div>

              <div className="grid gap-3">
                {anchorOpportunities.length > 0 ? (
                  anchorOpportunities.map((item) => (
                    <article
                      className="grid gap-4 rounded-[12px] border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_auto] md:items-center"
                      key={item.eventId}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-quorum-cyan/35 bg-quorum-cyan/10 px-2.5 py-1 font-mono text-xs text-quorum-cyan-soft">
                            {item.availableUsdc} USDC available
                          </span>
                          <span className="rounded-full border border-white/10 bg-quorum-grey-800 px-2.5 py-1 font-mono text-xs text-muted">
                            earned {item.earnedUsdc}
                          </span>
                          <span className="rounded-full border border-white/10 bg-quorum-grey-800 px-2.5 py-1 font-mono text-xs text-muted">
                            withdrawn {item.withdrawnUsdc}
                          </span>
                        </div>
                        <h3 className="mt-3 truncate font-product text-lg font-medium">
                          {item.eventTitle}
                        </h3>
                        <Link
                          className="mt-2 inline-flex text-sm text-muted transition hover:text-quorum-cyan-soft"
                          href={`/events/${item.eventSlug}/proof`}
                        >
                          Event proof <ArrowUpRight size={13} />
                        </Link>
                      </div>
                      <div className="md:min-w-48">
                        <AnchorPayoutButton
                          amountUsdc={item.availableUsdc}
                          eventId={item.eventId}
                        />
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[12px] border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-muted">
                    No payout opportunities for this wallet yet.
                  </div>
                )}
              </div>
            </div>

            {anchorPayouts.length > 0 ? (
              <div className="mt-5 border-t border-white/10 pt-5">
                <h3 className="font-product text-lg font-medium">
                  Anchor payout history
                </h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {anchorPayouts.map((payout) => (
                    <article
                      className="rounded-[12px] border border-white/10 bg-quorum-grey-800 p-4"
                      key={payout.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full border border-quorum-cyan/35 bg-quorum-cyan/10 px-2.5 py-1 font-mono text-xs text-quorum-cyan-soft">
                          {payout.status.replaceAll("_", " ")}
                        </span>
                        <span className="font-mono text-xs text-muted">
                          {payout.provider}
                        </span>
                      </div>
                      <p className="mt-3 font-product font-medium">
                        {payout.eventTitle}
                      </p>
                      <p className="mt-2 font-mono text-sm text-foreground">
                        {payout.amountUsdc} {payout.asset}
                      </p>
                      <p className="mt-2 break-all font-mono text-xs leading-5 text-muted">
                        {payout.referenceNumber ?? payout.anchorTransactionId}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {payout.pickupUrl ? (
                          <Link
                            className="inline-flex min-h-8 items-center justify-center gap-2 rounded-full bg-quorum-cyan px-3 text-xs font-semibold text-background transition hover:bg-foreground"
                            href={payout.pickupUrl}
                            target="_blank"
                          >
                            MoneyGram <ArrowUpRight size={13} />
                          </Link>
                        ) : null}
                        {payout.provider === "moneygram" ? (
                          <AnchorPayoutSyncButton payoutId={payout.id} />
                        ) : null}
                      </div>
                      <Link
                        className="mt-3 inline-flex text-sm text-quorum-cyan-soft transition hover:text-foreground"
                        href={`/events/${payout.eventSlug}/proof`}
                      >
                        Proof timeline <ArrowUpRight size={13} />
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </ProofSurface>
        ) : null}

        {session ? (
          entries.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-[8px] border border-foreground/10">
              {entries.map((entry) => (
                <article
                  className="grid gap-4 border-b border-foreground/10 bg-foreground/[0.045] p-4 last:border-b-0 lg:grid-cols-[1fr_auto] lg:items-center"
                  key={entry.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-[6px] border border-foreground/10 bg-background/32 px-2.5 py-1 font-mono text-xs uppercase tracking-normal ${
                          entry.kind === "credit"
                            ? "text-success"
                            : "text-coral"
                        }`}
                      >
                        {entry.kind}
                      </span>
                      <span className="rounded-[6px] border border-foreground/10 bg-background/32 px-2.5 py-1 font-mono text-xs text-foreground">
                        {entry.amountUsdc} {entry.asset}
                      </span>
                      <span className="rounded-[6px] border border-foreground/10 bg-background/32 px-2.5 py-1 font-mono text-xs text-muted">
                        balance {entry.balanceAfterUsdc} USDC
                      </span>
                    </div>
                    <h2 className="mt-3 truncate text-lg font-semibold">
                      {entry.eventTitle}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {entry.sourceLabel} / {formatDate(entry.occurredAt)} UTC
                    </p>
                    <p className="mt-2 break-all font-mono text-xs leading-5 text-muted">
                      {entry.txHash ?? entry.sourceId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-foreground/10 px-3 text-sm text-muted transition hover:border-accent/45 hover:text-accent"
                      href={`/events/${entry.eventSlug}/proof`}
                    >
                      Proof <ArrowUpRight size={13} />
                    </Link>
                    {entry.explorerUrl ? (
                      <Link
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-accent px-3 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
                        href={entry.explorerUrl}
                        target="_blank"
                      >
                        Explorer <ArrowUpRight size={13} />
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-6">
              <Handshake className="text-accent" size={24} />
              <h2 className="mt-4 text-2xl font-semibold">
                No collaborator ledger yet
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                Checkout split credits and withdrawal debits will appear here
                when this wallet is a collaborator on a paid event.
              </p>
            </div>
          )
        ) : (
          <div className="mt-5 rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-6">
            <WalletCards className="text-accent" size={24} />
            <h2 className="mt-4 text-2xl font-semibold">
              Wallet session required
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Connect the collaborator wallet to resolve its event relationships
              and ledger entries.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
