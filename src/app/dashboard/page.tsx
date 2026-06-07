import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowUpRight,
  BadgeCheck,
  BanknoteArrowUp,
  CalendarDays,
  Handshake,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ContractReadiness } from "@/components/contract-readiness";
import { WalletReadiness } from "@/components/wallet-readiness";
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

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const organizerEvents = session
    ? listOrganizerEvents(session.walletAddress)
    : [];
  const collaborations = session
    ? listCollaborationsByWallet(session.walletAddress)
    : [];
  const attendeePasses = session
    ? listPassesByOwner(session.walletAddress).map((pass) => ({
        event: getEventById(pass.eventId),
        pass,
      }))
    : [];
  const organizerRevenue = organizerEvents.reduce(
    (total, event) => total + getEventRevenueUsdc(event.id),
    0,
  );
  const withdrawableUsdc = collaborations.reduce((total, collaboration) => {
    const available = Math.max(
      collaboration.earnedUsdc - collaboration.withdrawnUsdc,
      0,
    );
    return total + available;
  }, 0);
  const cards = [
    {
      icon: CalendarDays,
      label: "Organizer events",
      value: String(organizerEvents.length),
      detail: `${organizerEvents.filter((event) => event.status === "published").length} published`,
    },
    {
      icon: Handshake,
      label: "Collaborator roles",
      value: String(collaborations.length),
      detail: `${formatUsdc(withdrawableUsdc)} USDC withdrawable`,
    },
    {
      icon: TicketCheck,
      label: "Owned passes",
      value: String(attendeePasses.length),
      detail: `${attendeePasses.filter(({ pass }) => pass.checkedIn).length} checked in`,
    },
    {
      icon: BanknoteArrowUp,
      label: "Organizer routed",
      value: `${formatUsdc(organizerRevenue)} USDC`,
      detail: "from local proof records",
    },
  ];
  const proofRows = [
    {
      label: "Wallet session",
      status: session ? "ready" : "connect",
    },
    {
      label: "Event publish",
      status: organizerEvents.some((event) => event.status === "published")
        ? "ready"
        : "pending",
    },
    {
      label: "Checkout + mint",
      status: attendeePasses.length > 0 || organizerRevenue > 0 ? "ready" : "pending",
    },
    {
      label: "Resource unlock",
      status: attendeePasses.length > 0 ? "ready" : "pending",
    },
    {
      label: "Withdraw",
      status: withdrawableUsdc > 0 ? "queued" : "pending",
    },
  ];

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="flex flex-col gap-4 border border-line bg-panel p-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-normal text-accent">
              Role-aware dashboard
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Transparency console</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              {session
                ? shorten(session.walletAddress)
                : "Connect a wallet to resolve organizer, collaborator, and attendee views."}
            </p>
          </div>
          <Link
            href="/dashboard/events/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
          >
            Create event <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div className="border border-line bg-panel p-5" key={card.label}>
                <Icon className="text-accent" size={20} />
                <p className="mt-4 text-sm text-muted">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold leading-tight">
                  {card.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">{card.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="grid gap-5">
            <div className="border border-line bg-panel p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-xs uppercase tracking-normal text-muted">
                  Organizer events
                </p>
                <Link
                  href="/dashboard/events/new"
                  className="text-sm text-muted transition hover:text-accent"
                >
                  New event
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                {organizerEvents.length > 0 ? (
                  organizerEvents.map((event) => {
                    const metrics = getEventDashboardMetrics(event.id);

                    return (
                      <div
                        className="border border-line bg-background/30 p-4"
                        key={event.id}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="mt-1 font-mono text-xs uppercase tracking-normal text-muted">
                              {event.status} · {event.capacity} capacity
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={
                                event.status === "draft"
                                  ? `/dashboard/events/new?eventId=${event.id}`
                                  : `/events/${event.slug}`
                              }
                              className="inline-flex min-h-9 items-center justify-center gap-2 border border-line px-3 text-sm transition hover:border-accent hover:text-accent"
                            >
                              {event.status === "draft" ? "Edit" : "Open"}
                              <ArrowUpRight size={13} />
                            </Link>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-4">
                          <div className="border border-line bg-panel p-3">
                            <p className="font-mono text-xl text-accent">
                              {metrics.passCount}
                            </p>
                            <p className="mt-1 text-xs text-muted">passes</p>
                          </div>
                          <div className="border border-line bg-panel p-3">
                            <p className="font-mono text-xl text-cyan">
                              {metrics.capacityRemaining}
                            </p>
                            <p className="mt-1 text-xs text-muted">left</p>
                          </div>
                          <div className="border border-line bg-panel p-3">
                            <p className="font-mono text-xl text-amber">
                              {metrics.checkedInCount}
                            </p>
                            <p className="mt-1 text-xs text-muted">checked in</p>
                          </div>
                          <div className="border border-line bg-panel p-3">
                            <p className="font-mono text-xl text-coral">
                              {formatUsdc(metrics.revenueUsdc)}
                            </p>
                            <p className="mt-1 text-xs text-muted">USDC</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="border border-line bg-background/30 p-4 text-sm leading-6 text-muted">
                    No organizer events for the connected wallet yet.
                  </div>
                )}
              </div>
            </div>

            <div className="border border-line bg-panel p-5">
              <p className="font-mono text-xs uppercase tracking-normal text-muted">
                Collaborator balances
              </p>
              <div className="mt-4 grid gap-3">
                {collaborations.length > 0 ? (
                  collaborations.map((entry) => {
                    const available = Math.max(
                      entry.earnedUsdc - entry.withdrawnUsdc,
                      0,
                    );

                    return (
                      <div
                        className="grid gap-4 border border-line bg-background/30 p-4 md:grid-cols-[1fr_auto]"
                        key={entry.collaborator.id}
                      >
                        <div>
                          <p className="font-medium">{entry.event.title}</p>
                          <p className="mt-1 text-sm text-muted">
                            {entry.collaborator.displayName} · {entry.collaborator.role}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-right">
                          <div>
                            <p className="font-mono text-lg text-accent">
                              {entry.collaborator.splitPercentage}%
                            </p>
                            <p className="mt-1 text-xs text-muted">split</p>
                          </div>
                          <div>
                            <p className="font-mono text-lg text-cyan">
                              {formatUsdc(entry.earnedUsdc)}
                            </p>
                            <p className="mt-1 text-xs text-muted">earned</p>
                          </div>
                          <div>
                            <p className="font-mono text-lg text-amber">
                              {formatUsdc(available)}
                            </p>
                            <p className="mt-1 text-xs text-muted">available</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="border border-line bg-background/30 p-4 text-sm leading-6 text-muted">
                    No collaborator roles for the connected wallet yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid content-start gap-5">
            <WalletReadiness />
            <ContractReadiness />

            <div className="border border-line bg-panel p-5">
              <p className="font-mono text-xs uppercase tracking-normal text-muted">
                Attendee passes
              </p>
              <div className="mt-4 grid gap-3">
                {attendeePasses.length > 0 ? (
                  attendeePasses.map(({ event, pass }) => (
                    <Link
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border border-line bg-background/30 p-3 transition hover:border-accent"
                      href={pass.tokenId ? `/passes/${pass.tokenId}` : "/passes"}
                      key={pass.id}
                    >
                      <BadgeCheck className="text-accent" size={19} />
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="mt-1 font-mono text-xs text-muted">
                          {pass.tokenId}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-accent">
                        {pass.checkedIn ? "checked" : "active"}
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="border border-line bg-background/30 p-4 text-sm leading-6 text-muted">
                    No owned passes for the connected wallet yet.
                  </div>
                )}
              </div>
            </div>

            <div className="border border-line bg-panel p-5">
              <p className="font-mono text-xs uppercase tracking-normal text-muted">
                Proof queue
              </p>
              <div className="mt-4 overflow-hidden border border-line">
                {proofRows.map((item, index) => (
                  <div
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-line bg-background/30 p-3 last:border-b-0"
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
            </div>

            <div className="border border-line bg-panel p-5">
              <div className="flex items-center gap-3 text-muted">
                <ShieldCheck className="text-accent" size={18} />
                <p className="text-sm leading-6">
                  Local proof records mirror the contract flow until live
                  testnet contract IDs are configured.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
