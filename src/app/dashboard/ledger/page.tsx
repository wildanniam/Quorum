import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  ArrowUpRight,
  BanknoteArrowUp,
  CircleAlert,
  CircleCheck,
  CircleDollarSign,
  Clock3,
  Handshake,
  Landmark,
  RadioTower,
  Send,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AnchorPayoutButton } from "@/components/anchor/anchor-payout-button";
import { AnchorPayoutSyncButton } from "@/components/anchor/anchor-payout-sync-button";
import { Alert } from "@/components/ui/feedback-primitives";
import {
  EmptyState,
  ProductPage,
  SectionHeader,
  WalletGate,
} from "@/components/ui/product-layout";
import { ProofSurface } from "@/components/ui/proof-surface";
import { CompactPageHeader, DataRow, TaskPanel } from "@/components/ui/product-primitives";
import { StatusPill } from "@/components/ui/status-pill";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import type { LedgerEntryRecord } from "@/lib/db/models";
import {
  getAnchorPayoutMoneyGramState,
  listAnchorPayoutOpportunities,
  listAnchorPayoutsWithEventsByWallet,
  type AnchorPayoutWithEvent,
} from "@/lib/anchor/payouts";
import {
  getCollaboratorLedgerSummary,
  listCollaboratorLedger,
} from "@/lib/ledger/repository";
import { stellarExpertTransactionUrl } from "@/lib/stellar/explorer";
import { getAnchorProviderName } from "@/lib/anchor/config";
import {
  canStartAnchorPayout,
  getAnchorProviderPresentation,
  hasLiveStellarProof,
} from "@/lib/capability-presentation";

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

function ledgerCopy(entry: LedgerEntryRecord) {
  if (entry.kind === "credit") {
    return {
      amount: `+${entry.amountUsdc} ${entry.asset}`,
      detail: "Ticket checkout revenue allocated to this collaborator wallet.",
      label: "Credit",
      tone: "success" as const,
    };
  }

  return {
    amount: `-${entry.amountUsdc} ${entry.asset}`,
    detail: "Settled from the event contract into this collaborator wallet.",
    label: "Wallet settlement",
    tone: "cyan" as const,
  };
}

function cashOutStatus(
  payout: AnchorPayoutWithEvent,
  moneyGramStatus: string | null,
) {
  const provider = getAnchorProviderPresentation(payout.provider);

  if (payout.status === "completed") {
    return {
      description: `${provider.providerLabel} marked this cash-out complete.`,
      icon: CircleCheck,
      label:
        payout.provider === "moneygram" ? "Cash-out complete" : "Demo complete",
      tone: "success" as const,
    };
  }

  if (payout.status === "ready_for_pickup") {
    return {
      description:
        payout.provider === "moneygram"
          ? "The pickup reference is ready in MoneyGram."
          : "The mock provider issued a demo reference. No external cash pickup was created.",
      icon: Landmark,
      label:
        payout.provider === "moneygram"
          ? "Ready for pickup"
          : "Demo reference ready",
      tone: payout.provider === "moneygram" ? ("ready" as const) : ("cyan" as const),
    };
  }

  if (payout.status === "failed" || payout.status === "cancelled") {
    return {
      description:
        payout.failureReason ??
        `${provider.providerLabel} could not continue this cash-out. Review the details before retrying.`,
      icon: CircleAlert,
      label: payout.status === "failed" ? "Cash-out failed" : "Cash-out cancelled",
      tone: "danger" as const,
    };
  }

  if (
    payout.provider === "moneygram" &&
    moneyGramStatus === "pending_user_transfer_start"
  ) {
    return {
      description: "MoneyGram is ready for the exact wallet transfer shown below.",
      icon: Send,
      label: "Wallet transfer required",
      tone: "cyan" as const,
    };
  }

  if (payout.status === "requested") {
    return {
      description:
        payout.provider === "moneygram"
          ? "Complete the MoneyGram identity and pickup details to continue."
          : "The mock provider request is recorded for product-flow testing.",
      icon: Clock3,
      label:
        payout.provider === "moneygram"
          ? "Details required"
          : "Demo request recorded",
      tone: "pending" as const,
    };
  }

  return {
    description: `${provider.providerLabel} is processing the latest cash-out state.`,
    icon: Clock3,
    label: "Processing",
    tone: "pending" as const,
  };
}

function TransactionProofRow({
  emptyLabel,
  hash,
  label,
}: {
  emptyLabel: string;
  hash: string | null;
  label: string;
}) {
  const explorerUrl = stellarExpertTransactionUrl(hash);

  return (
    <div className="grid min-w-0 gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
      <p className="text-xs text-muted">{label}</p>
      {hash ? (
        explorerUrl ? (
          <Link
            className="inline-flex min-w-0 items-center gap-1 break-all font-mono text-xs text-quorum-cyan-soft transition hover:text-foreground"
            href={explorerUrl}
            rel="noreferrer"
            target="_blank"
          >
            {shorten(hash)} <ArrowUpRight className="shrink-0" size={12} />
          </Link>
        ) : (
          <span className="break-all font-mono text-xs text-muted">{hash}</span>
        )
      ) : (
        <span className="text-xs text-muted">{emptyLabel}</span>
      )}
    </div>
  );
}

export default async function CollaboratorLedgerPage() {
  const anchorProvider = getAnchorProviderName();
  const anchorPresentation = getAnchorProviderPresentation(anchorProvider);
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
      <ProductPage className="space-y-8" spacing="default">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-quorum-cyan-soft"
        >
          <ArrowLeft size={15} /> Back to Studio
        </Link>

        <CompactPageHeader
          description={
            session
              ? `Showing settlement and cash-out activity for ${shorten(session.walletAddress)}.`
              : "Connect the collaborator wallet to see only its related settlement activity."
          }
          eyebrow="Collaborator ledger"
          icon={Handshake}
          title="Earnings, settlement, and cash-out."
        />

        {session ? (
          <TaskPanel tone={Number(summary.withdrawableUsdc) > 0 ? "ready" : "default"}>
            <div className="grid gap-1 sm:grid-cols-2">
              <DataRow icon={CircleDollarSign} label="Earned from ticket splits" value={`${summary.totalEarnedUsdc} USDC`} />
              <DataRow icon={BanknoteArrowUp} label="Settled to your wallet" value={`${summary.totalWithdrawnUsdc} USDC`} />
              <DataRow icon={Handshake} label="Available for the next action" value={`${summary.withdrawableUsdc} USDC`} />
              <DataRow icon={WalletCards} label="Events involved" value={summary.eventCount} />
            </div>
          </TaskPanel>
        ) : null}

        {session ? (
          <section className="mt-12" aria-label="Anchor cash-out">
            <SectionHeader
              description={anchorPresentation.description}
              eyebrow={
                <span className="inline-flex items-center gap-2">
                  <RadioTower size={14} /> {anchorPresentation.eyebrow}
                </span>
              }
              title={anchorPresentation.title}
            />

            <Alert
              className="mt-5"
              title={anchorPresentation.accessTitle}
              tone={anchorProvider === "moneygram" ? "warning" : "info"}
            >
              {anchorPresentation.accessDescription}
            </Alert>

            <ol
              aria-label="Cash-out path"
              className="mt-6 grid border-y border-white/10 md:grid-cols-3"
            >
              {[
                {
                  detail: "Event contract confirms the collaborator withdrawal.",
                  icon: WalletCards,
                  label: "Settle to wallet",
                },
                {
                  detail:
                    anchorProvider === "moneygram"
                      ? "After provider access, the same wallet sends exact testnet USDC with memo."
                      : "The mock provider records the intended transfer step without moving funds.",
                  icon: Send,
                  label:
                    anchorProvider === "moneygram"
                      ? "Transfer to MoneyGram"
                      : "Simulate provider transfer",
                },
                {
                  detail:
                    anchorProvider === "moneygram"
                      ? "When accepted, MoneyGram returns the reference for cash pickup."
                      : "Quorum returns a clearly labeled mock reference for the demo.",
                  icon: Landmark,
                  label:
                    anchorProvider === "moneygram"
                      ? "Collect with reference"
                      : "Inspect demo reference",
                },
              ].map((step, index) => {
                const Icon = step.icon;

                return (
                  <li
                    className="grid grid-cols-[auto_1fr] gap-3 border-b border-white/10 py-4 last:border-b-0 md:border-b-0 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0"
                    key={step.label}
                  >
                    <span className="inline-flex size-9 items-center justify-center rounded-full border border-quorum-cyan/35 bg-quorum-cyan/10 text-quorum-cyan-soft">
                      <Icon size={15} />
                    </span>
                    <div>
                      <p className="font-product text-sm font-medium">
                        {index + 1}. {step.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-7 grid gap-3">
              {anchorOpportunities.length > 0 ? (
                anchorOpportunities.map((item) => {
                  const liveSettlement = hasLiveStellarProof({
                    ledger: null,
                    txHash: item.settlementTxHash,
                  });
                  const canStart = canStartAnchorPayout({
                    provider: anchorProvider,
                    settlementTxHash: item.settlementTxHash,
                  });

                  return (
                    <article
                      className="grid gap-5 rounded-[8px] border border-white/10 bg-quorum-grey-700/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                      key={item.withdrawalId}
                    >
                      <div className="min-w-0">
                        <StatusPill
                          icon={liveSettlement ? CircleCheck : CircleAlert}
                          tone={liveSettlement ? "success" : "local"}
                        >
                          {liveSettlement
                            ? "Explorer-verified settlement"
                            : "Quorum settlement record"}
                        </StatusPill>
                        <h3 className="mt-4 font-product text-xl font-medium">
                          {item.eventTitle}
                        </h3>
                        <p className="mt-2 font-mono text-2xl text-quorum-cyan-soft">
                          {item.settlementAmountUsdc} USDC
                        </p>
                        <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
                          <TransactionProofRow
                            emptyLabel="Settlement proof pending"
                            hash={item.settlementTxHash}
                            label="Contract to wallet"
                          />
                          <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
                            <p className="text-xs text-muted">Settled</p>
                            <p className="text-xs text-foreground">
                              {formatDate(item.settledAt)} UTC
                            </p>
                          </div>
                        </div>
                        <Link
                          className="mt-4 inline-flex items-center gap-1 text-sm text-muted transition hover:text-quorum-cyan-soft"
                          href={`/events/${item.eventSlug}/proof`}
                        >
                          Event proof <ArrowUpRight size={13} />
                        </Link>
                      </div>
                      <div className="md:w-64">
                        {canStart ? (
                          <AnchorPayoutButton
                            actionLabel={
                              anchorProvider === "moneygram"
                                ? "Start MoneyGram flow"
                                : "Start cash-out demo"
                            }
                            amountUsdc={item.settlementAmountUsdc}
                            eventId={item.eventId}
                            withdrawalId={item.withdrawalId}
                          />
                        ) : (
                          <Alert title="Live settlement required" tone="warning">
                            MoneyGram cannot start from a local proof record.
                          </Alert>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <EmptyState
                  description="Withdraw a collaborator balance from an event first. The resulting settlement record will appear here automatically."
                  icon={WalletCards}
                  title="No settled funds ready"
                />
              )}
            </div>

            {anchorPayouts.length > 0 ? (
              <div className="mt-12">
                <SectionHeader
                  description={anchorPresentation.historyDescription}
                  eyebrow="Provider request history"
                  title="Follow each request without mixing proof sources."
                />
                <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
                  {anchorPayouts.map((payout) => {
                    const moneyGram = getAnchorPayoutMoneyGramState(payout);
                    const status = cashOutStatus(
                      payout,
                      moneyGram.moneyGramStatus,
                    );

                    return (
                      <article
                        className="rounded-[8px] border border-white/10 bg-quorum-grey-700/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        key={payout.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <StatusPill icon={status.icon} tone={status.tone}>
                            {status.label}
                          </StatusPill>
                          <span className="font-mono text-xs uppercase text-muted">
                            {getAnchorProviderPresentation(payout.provider).providerLabel}
                          </span>
                        </div>
                        <h3 className="mt-4 font-product text-xl font-medium">
                          {payout.eventTitle}
                        </h3>
                        <p className="mt-2 font-mono text-2xl text-foreground">
                          {payout.amountUsdc} {payout.asset}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-muted">
                          {status.description}
                        </p>

                        <div className="mt-4 divide-y divide-white/10 border-y border-white/10">
                          <TransactionProofRow
                            emptyLabel="Settlement proof unavailable"
                            hash={payout.settlementTxHash}
                            label="Contract to wallet"
                          />
                          <TransactionProofRow
                            emptyLabel="Waiting for wallet transfer"
                            hash={payout.stellarTransactionId}
                            label={
                              payout.provider === "moneygram"
                                ? "Wallet to MoneyGram"
                                : "Mock provider transfer"
                            }
                          />
                          <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
                            <p className="text-xs text-muted">Pickup reference</p>
                            <p className="break-all font-mono text-xs text-foreground">
                              {payout.status === "ready_for_pickup" ||
                              payout.status === "completed"
                                ? payout.referenceNumber ?? "Waiting for MoneyGram"
                                : "Not issued yet"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {payout.pickupUrl ? (
                            <Link
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-quorum-cyan px-3 text-xs font-semibold text-accent-ink transition hover:bg-foreground"
                              href={payout.pickupUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {payout.status === "requested"
                                ? "Continue MoneyGram"
                                : "View MoneyGram details"}{" "}
                              <ArrowUpRight size={13} />
                            </Link>
                          ) : null}
                          <Link
                            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-white/12 px-3 text-xs text-muted transition hover:border-quorum-cyan/45 hover:text-quorum-cyan-soft"
                            href={`/events/${payout.eventSlug}/proof`}
                          >
                            Event proof <ArrowUpRight size={13} />
                          </Link>
                          {(payout.status === "failed" ||
                            payout.status === "cancelled") &&
                          payout.withdrawalId ? (
                            <div className="w-full sm:w-auto sm:min-w-44">
                              <AnchorPayoutButton
                                actionLabel="Retry cash-out"
                                amountUsdc={payout.amountUsdc}
                                eventId={payout.eventId}
                                withdrawalId={payout.withdrawalId}
                              />
                            </div>
                          ) : null}
                        </div>

                        {payout.provider === "moneygram" &&
                        payout.status !== "completed" &&
                        payout.status !== "cancelled" ? (
                          <div className="mt-4 border-t border-white/10 pt-4">
                            <AnchorPayoutSyncButton
                              initialMoneyGramStatus={moneyGram.moneyGramStatus}
                              initialTransferInstructions={
                                moneyGram.transferInstructions
                              }
                              payoutId={payout.id}
                            />
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="mt-14">
          <SectionHeader
            description={
              session
                ? "Only entries tied to the connected collaborator wallet are shown here. Event-level proof remains available from each row."
                : "Connect a collaborator wallet to resolve its event relationships and credit/debit history."
            }
            eyebrow="Wallet-scoped ledger"
            title="Event revenue and contract settlements for this wallet."
          />
        </div>

        {session ? (
          entries.length > 0 ? (
            <ProofSurface className="mt-5 overflow-hidden" elevated variant="table">
              {entries.map((entry) => {
                const copy = ledgerCopy(entry);

                return (
                  <article
                    className="grid gap-4 border-b border-white/10 bg-white/[0.026] p-4 transition hover:bg-white/[0.045] last:border-b-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-5"
                    key={entry.id}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill
                          icon={
                            entry.kind === "credit"
                              ? CircleDollarSign
                              : BanknoteArrowUp
                          }
                          tone={copy.tone}
                        >
                          {copy.label}
                        </StatusPill>
                        <span className="rounded-full border border-white/10 bg-background/40 px-2.5 py-1 font-mono text-xs text-foreground">
                          {copy.amount}
                        </span>
                        <span className="rounded-full border border-white/10 bg-background/40 px-2.5 py-1 font-mono text-xs text-muted">
                          balance {entry.balanceAfterUsdc} USDC
                        </span>
                      </div>
                      <h2 className="mt-3 truncate font-product text-xl font-medium">
                        {entry.eventTitle}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-muted">
                        {copy.detail}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
                        <span>{formatDate(entry.occurredAt)} UTC</span>
                        <span>{shorten(entry.walletAddress)}</span>
                      </div>
                      <details className="mt-3 rounded-[6px] border border-white/10 bg-background/34 p-3">
                        <summary className="cursor-pointer text-xs font-medium text-muted">Technical details</summary>
                        <div className="mt-3 grid gap-2 text-xs text-muted md:grid-cols-2">
                          <p className="min-w-0 break-all font-mono">source: {entry.txHash ?? entry.sourceId}</p>
                          <p className="min-w-0 break-all font-mono">type: {entry.sourceLabel}</p>
                          {entry.tokenId ? <p className="break-all font-mono">token: {entry.tokenId}</p> : null}
                        </div>
                      </details>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Link
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-white/12 px-3 text-sm text-muted transition hover:border-quorum-cyan/45 hover:text-quorum-cyan-soft"
                        href={`/events/${entry.eventSlug}/proof`}
                      >
                        Event proof <ArrowUpRight size={13} />
                      </Link>
                      {entry.explorerUrl ? (
                        <Link
                          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-quorum-cyan px-3 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
                          href={entry.explorerUrl}
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
          ) : (
            <EmptyState
              className="mt-5"
              description="Checkout split credits and withdrawal debits will appear here when this wallet is a collaborator on a paid event."
              icon={Handshake}
              title="No collaborator ledger yet"
            />
          )
        ) : (
          <WalletGate
            className="mt-5"
            description="Connect the collaborator wallet to resolve its event relationships and ledger entries."
          />
        )}
      </ProductPage>
    </AppShell>
  );
}
