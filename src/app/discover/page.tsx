import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  FileKey2,
  Handshake,
  MapPin,
  ShieldCheck,
  TicketCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  countMintedPasses,
  countPassesForEvent,
  getSucceededPurchaseTotalUsdc,
  listCollaborators,
  listPublishedEvents,
  listResources,
} from "@/lib/events/repository";
import { eventCoverStyle, eventThemeStyle } from "@/lib/events/theme";
import type { CollaboratorRecord, EventRecord } from "@/lib/db/models";

export const dynamic = "force-dynamic";

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function priceLabel(event: EventRecord) {
  return event.isFree ? "Free" : `${event.priceUsdc} USDC`;
}

function formatDate(event: EventRecord) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: event.timezone,
  }).format(new Date(event.startDateTime));
}

function formatTime(event: EventRecord) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: event.timezone,
  }).format(new Date(event.startDateTime));
}

function locationLabel(event: EventRecord) {
  return event.locationText ?? (event.locationType === "virtual" ? "Virtual" : "Venue to be announced");
}

function splitLabel(collaborators: CollaboratorRecord[]) {
  return collaborators.map((split) => `${split.splitPercentage}`).join(" / ");
}

function formatUsdc(value: number) {
  return value > 0 ? `${numberFormatter.format(value)} USDC` : "0 USDC";
}

export default function Home() {
  const publishedEvents = listPublishedEvents();
  const featuredEvent = publishedEvents[0] ?? null;
  const featuredResources = featuredEvent ? listResources(featuredEvent.id) : [];
  const mintedPasses = countMintedPasses();
  const routedUsdc = getSucceededPurchaseTotalUsdc();
  const collaboratorCount = publishedEvents.reduce(
    (total, event) => total + listCollaborators(event.id).length,
    0,
  );

  const trustLoop = [
    {
      icon: WalletCards,
      label: "Wallet signs",
      value: "Freighter keeps approval explicit.",
    },
    {
      icon: CircleDollarSign,
      label: "USDC routes",
      value: "Checkout value follows the published split.",
    },
    {
      icon: TicketCheck,
      label: "Pass mints",
      value: "One non-transferable proof pass per wallet.",
    },
    {
      icon: FileKey2,
      label: "Access unlocks",
      value: "Resources open only from the owned pass.",
    },
  ];

  const stats = [
    { label: "Published", value: String(publishedEvents.length) },
    { label: "Split wallets", value: String(collaboratorCount) },
    { label: "Passes minted", value: String(mintedPasses) },
    { label: "USDC routed", value: formatUsdc(routedUsdc) },
  ];

  return (
    <AppShell>
      <section
        className="border-b border-line/70"
        style={featuredEvent ? eventThemeStyle(featuredEvent) : undefined}
      >
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <div className="grid gap-5 lg:items-start lg:grid-cols-[minmax(0,1fr)_430px]">
            <article className="overflow-hidden rounded-[8px] border border-line bg-panel shadow-[0_20px_90px_rgba(0,0,0,0.34)]">
              <div
                className="event-cover min-h-[520px] p-5 sm:p-6 lg:p-8"
                style={featuredEvent ? eventCoverStyle(featuredEvent) : undefined}
              >
                <div className="flex h-full flex-col justify-between gap-10">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-[6px] bg-event-accent px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-normal text-event-ink">
                      Featured event
                    </span>
                    <span className="rounded-[6px] border border-foreground/20 bg-background/72 px-2.5 py-1 font-mono text-xs uppercase tracking-normal text-foreground">
                      One pass / wallet
                    </span>
                    <span className="rounded-[6px] border border-foreground/20 bg-background/72 px-2.5 py-1 font-mono text-xs uppercase tracking-normal text-foreground">
                      Split-ready
                    </span>
                  </div>

                  <div className="max-w-3xl">
                    <p className="eyebrow">
                      {featuredEvent ? locationLabel(featuredEvent) : "Quorum marketplace"}
                    </p>
                    <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.02] text-foreground md:text-7xl">
                      {featuredEvent?.title ?? "Publish the next proof-ready event"}
                    </h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground/84">
                      {featuredEvent
                        ? `${featuredEvent.shortDescription} Payments, split payouts, passes, check-in, and gated resources stay connected in one flow.`
                        : "Create a published event with transparent collaborators, wallet-based checkout, pass access, and check-in proof."}
                    </p>

                    {featuredEvent ? (
                      <div className="mt-6 grid gap-2 text-sm text-foreground sm:grid-cols-3">
                        <div className="flex min-h-11 items-center gap-2 rounded-[8px] border border-foreground/16 bg-background/68 px-3">
                          <CalendarDays className="text-event-accent" size={16} />
                          <span>
                            {formatDate(featuredEvent)}, {formatTime(featuredEvent)}
                          </span>
                        </div>
                        <div className="flex min-h-11 items-center gap-2 rounded-[8px] border border-foreground/16 bg-background/68 px-3">
                          <CircleDollarSign className="text-event-accent" size={16} />
                          <span>{priceLabel(featuredEvent)}</span>
                        </div>
                        <div className="flex min-h-11 items-center gap-2 rounded-[8px] border border-foreground/16 bg-background/68 px-3">
                          <Users className="text-event-accent" size={16} />
                          <span>{featuredEvent.capacity} seats</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>

            <aside className="rounded-[8px] border border-line bg-panel/86 p-5 shadow-[0_20px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:p-6">
              <p className="eyebrow">Live event ledger</p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight">
                Choose an event, keep the money trail readable.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Quorum makes the event page, checkout, collaborator split, and
                pass utility feel like one product instead of scattered Web3 steps.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-line bg-line">
                {stats.map((stat) => (
                  <div className="bg-background/78 p-4" key={stat.label}>
                    <p className="font-mono text-2xl font-semibold text-event-accent">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3">
                {trustLoop.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      className="grid grid-cols-[auto_1fr] gap-3 rounded-[8px] border border-line bg-background/42 p-4"
                      key={item.label}
                    >
                      <Icon className="mt-0.5 text-event-accent" size={18} />
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {featuredEvent ? (
                  <Link
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-event-accent px-4 text-sm font-semibold text-event-ink transition hover:bg-foreground"
                    href={`/events/${featuredEvent.slug}`}
                  >
                    Open event <ArrowUpRight size={16} />
                  </Link>
                ) : null}
                <Link
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-line bg-panel-strong px-4 text-sm font-semibold transition hover:border-event-accent hover:text-event-accent"
                  href="/dashboard/events/new"
                >
                  Create event <ChevronRight size={16} />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="eyebrow">Marketplace</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">
              Upcoming proof-ready events
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Browse published events with visible price, capacity, collaborator
              split, and pass utility before a wallet ever signs.
            </p>
          </div>
          <Link
            href="/dashboard/events/new"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] border border-line bg-panel/70 px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
          >
            Create event <ArrowUpRight size={14} />
          </Link>
        </div>

        {featuredEvent ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4">
              {publishedEvents.map((event) => {
                const collaborators = listCollaborators(event.id);
                const minted = countPassesForEvent(event.id);
                const remaining = Math.max(event.capacity - minted, 0);

                return (
                  <Link
                    className="group grid overflow-hidden rounded-[8px] border border-line bg-panel transition hover:border-event-accent hover:shadow-[0_18px_70px_rgba(0,0,0,0.28)] md:grid-cols-[0.88fr_1.12fr]"
                    href={`/events/${event.slug}`}
                    key={event.id}
                    style={eventThemeStyle(event)}
                  >
                    <div
                      className="event-cover min-h-64 border-b border-line md:border-b-0 md:border-r"
                      style={eventCoverStyle(event)}
                    />
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-[6px] border border-line px-2.5 py-1 font-mono text-xs text-muted">
                          {priceLabel(event)}
                        </span>
                        <span className="rounded-[6px] border border-line px-2.5 py-1 font-mono text-xs text-muted">
                          {remaining} seats left
                        </span>
                        <span className="rounded-[6px] border border-line px-2.5 py-1 font-mono text-xs text-muted">
                          {formatDate(event)}
                        </span>
                      </div>
                      <h3 className="mt-5 text-3xl font-semibold leading-tight group-hover:text-event-accent">
                        {event.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-muted">
                        {event.shortDescription}
                      </p>

                      <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[8px] border border-line bg-background/32 p-3">
                          <MapPin className="text-event-accent" size={17} />
                          <p className="mt-2 text-xs leading-5 text-muted">
                            {locationLabel(event)}
                          </p>
                        </div>
                        <div className="rounded-[8px] border border-line bg-background/32 p-3">
                          <Handshake className="text-event-accent" size={17} />
                          <p className="mt-2 font-mono text-xs text-muted">
                            {splitLabel(collaborators) || "100"} split
                          </p>
                        </div>
                        <div className="rounded-[8px] border border-line bg-background/32 p-3">
                          <ShieldCheck className="text-event-accent" size={17} />
                          <p className="mt-2 text-xs leading-5 text-muted">
                            NFT pass + check-in
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <aside className="rounded-[8px] border border-line bg-panel p-5 lg:sticky lg:top-24 lg:self-start">
              <p className="eyebrow">Pass utility</p>
              <h3 className="mt-3 text-xl font-semibold">
                What a holder can unlock
              </h3>
              <div className="mt-5 grid gap-3">
                {featuredResources.map((resource) => (
                  <div
                    className="rounded-[8px] border border-line bg-background/32 p-4"
                    key={resource.id}
                  >
                    <p className="font-mono text-xs uppercase tracking-normal text-event-accent">
                      {resource.type}
                    </p>
                    <p className="mt-2 font-medium">{resource.title}</p>
                    {resource.description ? (
                      <p className="mt-2 text-xs leading-5 text-muted">
                        {resource.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-muted">
                Resources stay locked until the connected wallet owns the event
                pass. That keeps access tied to proof, not screenshots.
              </p>
            </aside>
          </div>
        ) : (
          <div className="mt-6 rounded-[8px] border border-line bg-panel p-6">
            <p className="text-sm leading-6 text-muted">
              No published events yet. Draft events stay private until they are
              ready for checkout.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
