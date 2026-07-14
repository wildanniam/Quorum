import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Handshake,
  LayoutDashboard,
  TicketCheck,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ContractReadiness } from "@/components/contract-readiness";
import { WalletReadiness } from "@/components/wallet-readiness";
import { PublishButton } from "@/components/events/publish-button";
import { WithdrawButton } from "@/components/events/withdraw-button";
import { WalletButton } from "@/components/wallet-button";
import {
  EmptyState,
  ProductPage,
  SectionHeader,
} from "@/components/ui/product-layout";
import { ProofSurface } from "@/components/ui/proof-surface";
import { CompactPageHeader, DataRow, ProductSection, TaskPanel } from "@/components/ui/product-primitives";
import { QuorumButton } from "@/components/ui/quorum-button";
import { StatusPill } from "@/components/ui/status-pill";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import {
  eventLifecycleLabel,
  getEventLifecycle,
  hasEventEnded,
} from "@/lib/events/lifecycle";
import {
  getEventById,
  getEventDashboardMetrics,
  getEventRevenueUsdc,
  listCollaborationsByWallet,
  listOrganizerEvents,
  listPassesByOwner,
} from "@/lib/events/repository";

export const dynamic = "force-dynamic";

function formatUsdc(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value > 0 && value < 1 ? 2 : 0,
  });
}

function shorten(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function amountForAction(value: number) {
  return value > 0 ? value.toFixed(7).replace(/\.?0+$/, "") : "0";
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return (
      <AppShell>
        <ProductPage className="space-y-8" spacing="default">
          <CompactPageHeader
            actions={<WalletButton />}
            description="Connect the wallet you use for events. Studio will then show the work that belongs to that wallet."
            eyebrow="Studio"
            icon={LayoutDashboard}
            title="Your event workspace starts with your wallet."
          />

          <TaskPanel className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center" tone="ready">
            <div>
              <p className="text-lg font-medium text-foreground">Connect to continue</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                After a wallet session is confirmed, Quorum can show the events you host, the revenue shares you can withdraw, and the passes you own.
              </p>
            </div>
            <WalletButton />
          </TaskPanel>

          <ProductSection
            description="One Studio adapts to the event roles already attached to your wallet."
            eyebrow="What Studio organizes"
            title="Work, not system status"
          >
            <div>
              <DataRow
                icon={CalendarDays}
                label="Hosting"
                detail="Create a draft, publish an event, and monitor check-in."
              />
              <DataRow
                icon={Handshake}
                label="Collaborating"
                detail="See your revenue share and withdraw when funds are settled."
              />
              <DataRow
                icon={TicketCheck}
                label="Attending"
                detail="Keep wallet-bound passes, resources, and receipt proof together."
              />
            </div>
          </ProductSection>
        </ProductPage>
      </AppShell>
    );
  }

  const organizerEvents = session
    ? await listOrganizerEvents(session.walletAddress)
    : [];
  const collaborations = session
    ? await listCollaborationsByWallet(session.walletAddress)
    : [];
  const attendeePasses = session
    ? await Promise.all(
        (await listPassesByOwner(session.walletAddress)).map(async (pass) => ({
          event: await getEventById(pass.eventId),
          pass,
        })),
      )
    : [];
  const organizerRevenueParts = await Promise.all(
    organizerEvents.map((event) => getEventRevenueUsdc(event.id)),
  );
  const organizerRevenue = organizerRevenueParts.reduce(
    (total, revenue) => total + revenue,
    0,
  );
  const organizerEventMetrics = new Map(
    await Promise.all(
      organizerEvents.map(
        async (event) =>
          [event.id, await getEventDashboardMetrics(event.id)] as const,
      ),
    ),
  );
  const withdrawableUsdc = collaborations.reduce((total, collaboration) => {
    const available = Math.max(
      collaboration.earnedUsdc - collaboration.withdrawnUsdc,
      0,
    );
    return total + available;
  }, 0);
  const hasWithdrawalProof = collaborations.some(
    (collaboration) => collaboration.withdrawnUsdc > 0,
  );
  const walletLabel = session
    ? shorten(session.walletAddress)
    : "Connect wallet to resolve roles";
  const roleBadges = [
    {
      label: "Organizer",
      value: organizerEvents.length,
      active: organizerEvents.length > 0,
    },
    {
      label: "Collaborator",
      value: collaborations.length,
      active: collaborations.length > 0,
    },
    {
      label: "Attendee",
      value: attendeePasses.length,
      active: attendeePasses.length > 0,
    },
  ];
  const proofRows = [
    {
      label: "Wallet",
      status: session ? "ready" : "connect",
    },
    {
      label: "Publish",
      status: organizerEvents.some((event) => event.status === "published")
        ? "ready"
        : "pending",
    },
    {
      label: "Checkout",
      status: attendeePasses.length > 0 || organizerRevenue > 0 ? "ready" : "pending",
    },
    {
      label: "Resources",
      status: attendeePasses.length > 0 ? "ready" : "pending",
    },
    {
      label: "Withdraw",
      status: hasWithdrawalProof
        ? "ready"
        : withdrawableUsdc > 0
          ? "queued"
          : "pending",
    },
  ];

  return (
    <AppShell>
      <ProductPage className="space-y-8" spacing="default">
        <CompactPageHeader
          actions={
            <QuorumButton href="/dashboard/events/new" icon={<ArrowRight size={16} />}>
              Create event
            </QuorumButton>
          }
          description="Track hosted events, collaborator payouts, attendee passes, and readiness without turning the product into a transaction monitor."
          eyebrow="Studio"
          icon={LayoutDashboard}
          meta={
            <StatusPill icon={WalletCards} tone={session ? "ready" : "pending"}>
              {walletLabel}
            </StatusPill>
          }
          title="Run your events from one calm workspace."
        />

        <TaskPanel className="p-5 sm:p-6" tone="default">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{walletLabel}</p>
              <p className="mt-1 text-sm text-muted">Your wallet roles shape the work shown below.</p>
            </div>
            {withdrawableUsdc > 0 ? (
              <span className="font-mono text-sm text-amber">
                {formatUsdc(withdrawableUsdc)} USDC ready to withdraw
              </span>
            ) : null}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {roleBadges.map((role) => (
              <div
                className="flex items-center justify-between gap-3 rounded-[6px] border border-white/10 bg-background/36 px-4 py-3"
                key={role.label}
              >
                <span className="text-sm text-muted">{role.label}</span>
                <span
                  className={`font-mono text-sm ${
                    role.active ? "text-quorum-cyan-soft" : "text-muted"
                  }`}
                >
                  {role.value}
                </span>
              </div>
            ))}
          </div>
        </TaskPanel>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_0.82fr] xl:items-start">
          <div className="grid gap-5">
            <ProofSurface elevated>
              <SectionHeader
                actions={
                  <Link
                    href="/dashboard/events/new"
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-white/12 px-3 text-sm text-muted transition hover:border-quorum-cyan/45 hover:text-quorum-cyan-soft"
                  >
                    New event <ArrowUpRight size={13} />
                  </Link>
                }
                description="Draft, publish, and inspect event proof without leaving Studio."
                eyebrow="Hosted events"
                title="Events you control"
              />

              <div className="mt-5 grid gap-3">
                {organizerEvents.length > 0 ? (
                  organizerEvents.map((event) => {
                    const metrics = organizerEventMetrics.get(event.id) ?? {
                      capacityRemaining: event.capacity,
                      checkedInCount: 0,
                      passCount: 0,
                      revenueUsdc: 0,
                    };
                    const expiredDraft =
                      event.status === "draft" && hasEventEnded(event);
                    const lifecycle = getEventLifecycle(event);
                    const lifecycleLabel = expiredDraft
                      ? "Expired draft"
                      : eventLifecycleLabel(lifecycle);
                    const lifecycleTone = expiredDraft || lifecycle === "ended"
                      ? "muted"
                      : lifecycle === "live"
                        ? "live"
                        : lifecycle === "upcoming"
                          ? "cyan"
                          : "pending";
                    const metricCards = [
                      {
                        label: "passes",
                        value: metrics.passCount,
                        tone: "text-quorum-cyan-soft",
                      },
                      {
                        label: "left",
                        value: metrics.capacityRemaining,
                        tone: "text-cyan",
                      },
                      {
                        label: "checked in",
                        value: metrics.checkedInCount,
                        tone: "text-success",
                      },
                      {
                        label: "USDC",
                        value: formatUsdc(metrics.revenueUsdc),
                        tone: "text-amber",
                      },
                    ];

                    return (
                      <article
                        className="rounded-[12px] border border-white/10 bg-background/38 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                        key={event.id}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill tone={lifecycleTone}>
                                {lifecycleLabel}
                              </StatusPill>
                              <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 font-mono text-xs text-muted">
                                {event.capacity} capacity
                              </span>
                            </div>
                            <p className="mt-3 truncate font-product text-xl font-medium">
                              {event.title}
                            </p>
                          </div>
                          {event.status === "draft" && !expiredDraft ? (
                            <PublishButton eventId={event.id} />
                          ) : expiredDraft ? (
                            <QuorumButton href="/dashboard/events/new" variant="subtle">
                              Create replacement
                            </QuorumButton>
                          ) : (
                            <Link
                              href={`/events/${event.slug}`}
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-white/12 px-3 text-sm transition hover:border-quorum-cyan/45 hover:text-quorum-cyan-soft"
                            >
                              Open <ArrowUpRight size={13} />
                            </Link>
                          )}
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {metricCards.map((metric) => (
                            <div
                              className="rounded-[10px] border border-white/10 bg-white/[0.035] p-3"
                              key={metric.label}
                            >
                              <p className={`font-mono text-xl ${metric.tone}`}>
                                {metric.value}
                              </p>
                              <p className="mt-1 text-xs text-muted">
                                {metric.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <EmptyState
                    description="Create a draft event to configure checkout, collaborators, and gated resources."
                    icon={CalendarDays}
                    title="No organizer events yet"
                  />
                )}
              </div>
            </ProofSurface>

            <ProofSurface elevated>
              <SectionHeader
                actions={
                  <Link
                    href="/dashboard/ledger"
                    className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-white/12 px-3 text-sm text-muted transition hover:border-quorum-cyan/45 hover:text-quorum-cyan-soft"
                  >
                    Ledger <ArrowUpRight size={13} />
                  </Link>
                }
                description="See the collaborator roles where this wallet can receive revenue share."
                eyebrow="Collaborator payouts"
                title="Balances ready for withdrawal"
              />

              <div className="mt-5 grid gap-3">
                {collaborations.length > 0 ? (
                  collaborations.map((entry) => {
                    const available = Math.max(
                      entry.earnedUsdc - entry.withdrawnUsdc,
                      0,
                    );
                    const balanceRows = [
                      {
                        label: "split",
                        value: `${entry.collaborator.splitPercentage}%`,
                        tone: "text-quorum-cyan-soft",
                      },
                      {
                        label: "earned",
                        value: formatUsdc(entry.earnedUsdc),
                        tone: "text-cyan",
                      },
                      {
                        label: "withdrawn",
                        value: formatUsdc(entry.withdrawnUsdc),
                        tone: "text-coral",
                      },
                      {
                        label: "available",
                        value: formatUsdc(available),
                        tone: "text-amber",
                      },
                    ];

                    return (
                      <article
                        className="grid gap-4 rounded-[12px] border border-white/10 bg-background/38 p-4 lg:grid-cols-[1fr_auto]"
                        key={entry.collaborator.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-product text-xl font-medium">
                            {entry.event.title}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {entry.collaborator.displayName} /{" "}
                            {entry.collaborator.role}
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {balanceRows.map((row) => (
                              <div
                                className="rounded-[10px] border border-white/10 bg-white/[0.035] p-3"
                                key={row.label}
                              >
                                <p className={`font-mono text-lg ${row.tone}`}>
                                  {row.value}
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                  {row.label}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="lg:min-w-36">
                          <WithdrawButton
                            amountUsdc={amountForAction(available)}
                            eventId={entry.event.id}
                          />
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <EmptyState
                    description="Collaborator balances appear here once this wallet is included in a revenue split."
                    icon={Handshake}
                    title="No collaborator roles yet"
                  />
                )}
              </div>
            </ProofSurface>
          </div>

          <aside className="grid content-start gap-5">
            <ProofSurface>
              <p className="eyebrow">Attendee passes</p>
              <div className="mt-5 grid gap-3">
                {attendeePasses.length > 0 ? (
                  attendeePasses.map(({ event, pass }) => (
                    <Link
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[10px] border border-white/10 bg-background/38 p-3 transition hover:border-quorum-cyan/45"
                      href={pass.tokenId ? `/passes/${pass.tokenId}` : "/passes"}
                      key={pass.id}
                    >
                      <BadgeCheck className="text-quorum-cyan-soft" size={19} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{event.title}</p>
                        <p className="mt-1 truncate font-mono text-xs text-muted">
                          {pass.tokenId}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-quorum-cyan-soft">
                        {pass.checkedIn ? "checked" : "active"}
                      </span>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    description="Owned passes appear here after this wallet claims or purchases access."
                    icon={TicketCheck}
                    title="No attendee passes"
                  />
                )}
              </div>
            </ProofSurface>

            <ProofSurface>
              <p className="eyebrow">Launch checklist</p>
              <div className="mt-5 overflow-hidden rounded-[12px] border border-white/10">
                {proofRows.map((item, index) => {
                  const tone =
                    item.status === "ready"
                      ? "success"
                      : item.status === "queued"
                        ? "warning"
                        : "muted";

                  return (
                    <div
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-white/10 bg-background/38 p-3 last:border-b-0"
                      key={item.label}
                    >
                      <span className="font-mono text-xs text-muted">
                        0{index + 1}
                      </span>
                      <span>{item.label}</span>
                      <StatusPill className="min-h-7 px-2.5" tone={tone}>
                        {item.status}
                      </StatusPill>
                    </div>
                  );
                })}
              </div>
            </ProofSurface>

            <details className="rounded-[8px] border border-white/10 bg-white/[0.025] p-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-muted">
                Diagnostics and testnet readiness
              </summary>
              <p className="mt-2 text-sm leading-6 text-muted">
                Open this only when checking wallet session or contract setup.
              </p>
              <div className="mt-4 grid gap-4">
                <WalletReadiness />
                <ContractReadiness />
              </div>
            </details>

            <ProofSurface>
              <div className="flex items-start gap-3 text-muted">
                <CheckCircle2 className="mt-0.5 text-quorum-cyan-soft" size={18} />
                <p className="text-sm leading-6">
                  Studio keeps the product flow visible while wallet approval
                  remains explicit on Stellar testnet.
                </p>
              </div>
            </ProofSurface>
          </aside>
        </div>
      </ProductPage>
    </AppShell>
  );
}
