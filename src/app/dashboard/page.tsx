import Link from "next/link";
import { cookies } from "next/headers";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BanknoteArrowUp,
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
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
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
  const cards = [
    {
      icon: CalendarDays,
      label: "Hosted events",
      value: String(organizerEvents.length),
      detail: `${organizerEvents.filter((event) => event.status === "published").length} published`,
      tone: "text-accent",
    },
    {
      icon: Handshake,
      label: "Collaborations",
      value: String(collaborations.length),
      detail: `${formatUsdc(withdrawableUsdc)} USDC withdrawable`,
      tone: "text-cyan",
    },
    {
      icon: TicketCheck,
      label: "Attendee passes",
      value: String(attendeePasses.length),
      detail: `${attendeePasses.filter(({ pass }) => pass.checkedIn).length} checked in`,
      tone: "text-success",
    },
    {
      icon: BanknoteArrowUp,
      label: "Revenue routed",
      value: `${formatUsdc(organizerRevenue)} USDC`,
      detail: "from completed checkouts",
      tone: "text-amber",
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
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-accent/45 bg-accent/10 px-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent">
                  <LayoutDashboard size={14} />
                  Studio
                </span>
                <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-foreground/10 bg-background/42 px-3 text-xs text-muted">
                  <WalletCards size={14} />
                  {walletLabel}
                </span>
              </div>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
                Run your events from one calm workspace.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
                Track hosted events, collaborator payouts, attendee passes, and
                wallet readiness without turning the product into a transaction
                monitor.
              </p>
            </div>
            <Link
              href="/dashboard/events/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
            >
              Create event <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {roleBadges.map((role) => (
              <div
                className="flex items-center justify-between gap-3 rounded-full border border-foreground/10 bg-background/32 px-4 py-3"
                key={role.label}
              >
                <span className="text-sm text-muted">{role.label}</span>
                <span
                  className={`font-mono text-sm ${
                    role.active ? "text-accent" : "text-muted"
                  }`}
                >
                  {role.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5"
                key={card.label}
              >
                <div className="flex items-center justify-between gap-4">
                  <Icon className={card.tone} size={20} />
                  <Activity className="text-muted/50" size={16} />
                </div>
                <p className="mt-4 text-sm text-muted">{card.label}</p>
                <p className={`mt-2 text-2xl font-semibold leading-tight ${card.tone}`}>
                  {card.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">{card.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 xl:items-start xl:grid-cols-[minmax(0,1.18fr)_0.82fr]">
          <div className="grid gap-5">
            <section className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">Hosted events</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Events you control
                  </h2>
                </div>
                <Link
                  href="/dashboard/events/new"
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-foreground/10 px-3 text-sm text-muted transition hover:border-accent/45 hover:text-accent"
                >
                  New event <ArrowUpRight size={13} />
                </Link>
              </div>
              <div className="mt-5 grid gap-3">
                {organizerEvents.length > 0 ? (
                  organizerEvents.map((event) => {
                    const metrics = organizerEventMetrics.get(event.id) ?? {
                      capacityRemaining: event.capacity,
                      checkedInCount: 0,
                      passCount: 0,
                      revenueUsdc: 0,
                    };
                    const metricCards = [
                      { label: "passes", value: metrics.passCount, tone: "text-accent" },
                      { label: "left", value: metrics.capacityRemaining, tone: "text-cyan" },
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
                        className="rounded-[8px] border border-foreground/10 bg-background/32 p-4"
                        key={event.id}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-lg font-semibold">{event.title}</p>
                            <p className="mt-1 font-mono text-xs uppercase tracking-normal text-muted">
                              {event.status} / {event.capacity} capacity
                            </p>
                          </div>
                          {event.status === "draft" ? (
                            <PublishButton eventId={event.id} />
                          ) : (
                            <Link
                              href={`/events/${event.slug}`}
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-foreground/10 px-3 text-sm transition hover:border-accent/45 hover:text-accent"
                            >
                              Open <ArrowUpRight size={13} />
                            </Link>
                          )}
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {metricCards.map((metric) => (
                            <div
                              className="rounded-[8px] border border-foreground/10 bg-foreground/[0.035] p-3"
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
                  <div className="rounded-[8px] border border-foreground/10 bg-background/32 p-4 text-sm leading-6 text-muted">
                    No organizer events for the connected wallet yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">Collaborator payouts</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    Balances ready for withdrawal
                  </h2>
                </div>
                <Link
                  href="/dashboard/ledger"
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-foreground/10 px-3 text-sm text-muted transition hover:border-accent/45 hover:text-accent"
                >
                  Ledger <ArrowUpRight size={13} />
                </Link>
              </div>
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
                        tone: "text-accent",
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
                        className="grid gap-4 rounded-[8px] border border-foreground/10 bg-background/32 p-4 lg:grid-cols-[1fr_auto]"
                        key={entry.collaborator.id}
                      >
                        <div>
                          <p className="text-lg font-semibold">{entry.event.title}</p>
                          <p className="mt-1 text-sm text-muted">
                            {entry.collaborator.displayName} /{" "}
                            {entry.collaborator.role}
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {balanceRows.map((row) => (
                              <div
                                className="rounded-[8px] border border-foreground/10 bg-foreground/[0.035] p-3"
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
                  <div className="rounded-[8px] border border-foreground/10 bg-background/32 p-4 text-sm leading-6 text-muted">
                    No collaborator roles for the connected wallet yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="grid content-start gap-5">
            <WalletReadiness />
            <ContractReadiness />

            <section className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5">
              <p className="eyebrow">Attendee passes</p>
              <div className="mt-5 grid gap-3">
                {attendeePasses.length > 0 ? (
                  attendeePasses.map(({ event, pass }) => (
                    <Link
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[8px] border border-foreground/10 bg-background/32 p-3 transition hover:border-accent/45"
                      href={pass.tokenId ? `/passes/${pass.tokenId}` : "/passes"}
                      key={pass.id}
                    >
                      <BadgeCheck className="text-accent" size={19} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{event.title}</p>
                        <p className="mt-1 truncate font-mono text-xs text-muted">
                          {pass.tokenId}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-accent">
                        {pass.checkedIn ? "checked" : "active"}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[8px] border border-foreground/10 bg-background/32 p-4 text-sm leading-6 text-muted">
                    No owned passes for the connected wallet yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5">
              <p className="eyebrow">Launch checklist</p>
              <div className="mt-5 overflow-hidden rounded-[8px] border border-foreground/10">
                {proofRows.map((item, index) => (
                  <div
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-foreground/10 bg-background/32 p-3 last:border-b-0"
                    key={item.label}
                  >
                    <span className="font-mono text-xs text-muted">
                      0{index + 1}
                    </span>
                    <span>{item.label}</span>
                    <span
                      className={`font-mono text-xs ${
                        item.status === "ready"
                          ? "text-accent"
                          : item.status === "queued"
                            ? "text-amber"
                            : "text-muted"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5">
              <div className="flex items-start gap-3 text-muted">
                <CheckCircle2 className="mt-0.5 text-accent" size={18} />
                <p className="text-sm leading-6">
                  Studio keeps the product flow visible while wallet approval
                  remains explicit on Stellar testnet.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
