import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  ShieldCheck,
  TicketCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LandingScrollStory } from "@/components/landing/landing-scroll-story";
import { Reveal } from "@/components/motion/reveal";
import {
  countMintedPasses,
  countPassesForEvent,
  getSucceededPurchaseTotalUsdc,
  listCollaborators,
  listPublishedEvents,
} from "@/lib/events/repository";
import { eventCoverStyle, eventThemeStyle } from "@/lib/events/theme";
import type { EventRecord } from "@/lib/db/models";

export const dynamic = "force-dynamic";

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function formatUsdc(value: number) {
  return value > 0 ? `${numberFormatter.format(value)} USDC` : "0 USDC";
}

function priceLabel(event: EventRecord) {
  return event.isFree ? "Free" : `${event.priceUsdc} USDC`;
}

function formatDate(event: EventRecord) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
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
  return event.locationText ?? (event.locationType === "virtual" ? "Virtual" : "Venue TBA");
}

export default function LandingPage() {
  const publishedEvents = listPublishedEvents();
  const featuredEvent = publishedEvents[0] ?? null;
  const secondaryEvents = publishedEvents.slice(1, 3);
  const mintedPasses = countMintedPasses();
  const routedUsdc = getSucceededPurchaseTotalUsdc();
  const collaboratorCount = publishedEvents.reduce(
    (total, event) => total + listCollaborators(event.id).length,
    0,
  );

  return (
    <AppShell>
      <section
        className="relative overflow-hidden border-b border-foreground/8"
        style={featuredEvent ? eventThemeStyle(featuredEvent) : undefined}
      >
        <div className="mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-7xl gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-8">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">Quorum for paid events</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-tight text-balance md:text-7xl">
              Beautiful event pages with wallet-native access.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              Publish an event, route USDC to collaborators, mint a
              non-transferable pass, and unlock attendee resources without
              making the product feel like a contract console.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink shadow-[0_18px_70px_var(--event-glow)] transition hover:bg-foreground"
                href="/discover"
              >
                Discover events <ArrowRight size={16} />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-foreground/12 bg-foreground/[0.045] px-5 text-sm font-semibold text-foreground transition hover:border-accent/55 hover:text-accent"
                href="/dashboard/events/new"
              >
                Create event <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-10 hidden max-w-xl grid-cols-3 gap-3 sm:grid">
              {[
                { label: "Events", value: String(publishedEvents.length) },
                { label: "Wallets", value: String(collaboratorCount) },
                { label: "Routed", value: formatUsdc(routedUsdc) },
              ].map((stat) => (
                <div
                  className="rounded-[8px] border border-foreground/10 bg-foreground/[0.035] p-3"
                  key={stat.label}
                >
                  <p className="text-xl font-semibold text-accent">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="relative">
            <div className="absolute -inset-x-8 bottom-0 top-14 bg-[linear-gradient(90deg,transparent,rgba(217,168,92,0.08),transparent)]" />
            {featuredEvent ? (
              <div className="relative mx-auto max-w-3xl">
                <Link
                  className="group block overflow-hidden rounded-[8px] border border-foreground/12 bg-panel shadow-[0_34px_120px_rgba(0,0,0,0.42)]"
                  href={`/events/${featuredEvent.slug}`}
                >
                  <div
                    className="event-cover min-h-[420px] p-5 sm:min-h-[520px] sm:p-7"
                    style={eventCoverStyle(featuredEvent)}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">
                          Featured
                        </span>
                        <span className="rounded-full border border-foreground/18 bg-background/70 px-3 py-1 text-xs font-semibold text-foreground">
                          {priceLabel(featuredEvent)}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-accent">
                          {locationLabel(featuredEvent)}
                        </p>
                        <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl">
                          {featuredEvent.title}
                        </h2>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/82">
                          {featuredEvent.shortDescription}
                        </p>
                        <div className="mt-5 grid gap-2 text-sm text-foreground sm:grid-cols-3">
                          <div className="flex min-h-11 items-center gap-2 rounded-full border border-foreground/16 bg-background/70 px-3">
                            <CalendarDays className="text-accent" size={16} />
                            <span>
                              {formatDate(featuredEvent)}, {formatTime(featuredEvent)}
                            </span>
                          </div>
                          <div className="flex min-h-11 items-center gap-2 rounded-full border border-foreground/16 bg-background/70 px-3">
                            <TicketCheck className="text-accent" size={16} />
                            <span>
                              {Math.max(
                                featuredEvent.capacity -
                                  countPassesForEvent(featuredEvent.id),
                                0,
                              )}{" "}
                              seats left
                            </span>
                          </div>
                          <div className="flex min-h-11 items-center gap-2 rounded-full border border-foreground/16 bg-background/70 px-3">
                            <ArrowRight className="text-accent" size={16} />
                            <span>Open event</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                <div className="relative z-10 -mt-8 grid gap-3 px-4 sm:grid-cols-3">
                  {[
                    {
                      icon: WalletCards,
                      label: "Wallet approval",
                      value: "Explicit Freighter sign",
                    },
                    {
                      icon: CircleDollarSign,
                      label: "Split-ready",
                      value: "USDC routing",
                    },
                    {
                      icon: ShieldCheck,
                      label: "Pass access",
                      value: `${mintedPasses} minted`,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        className="rounded-[8px] border border-foreground/10 bg-background/88 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl"
                        key={item.label}
                      >
                        <Icon className="text-accent" size={18} />
                        <p className="mt-3 text-sm font-semibold">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs text-muted">{item.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="relative rounded-[8px] border border-foreground/12 bg-foreground/[0.045] p-8">
                <p className="text-sm text-muted">
                  Create the first published event to preview Quorum here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <LandingScrollStory />

      <section className="border-t border-foreground/8">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[0.72fr_1.28fr] lg:px-8 lg:py-18">
          <div>
            <p className="eyebrow">Discover next</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              A cleaner front door, then a focused marketplace.
            </h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              The homepage now sets the emotional and product context. The
              Discover page can stay focused on browsing, comparison, and event
              selection.
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/12 bg-foreground/[0.045] px-4 text-sm font-semibold transition hover:border-accent/55 hover:text-accent"
              href="/discover"
            >
              View all events <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {secondaryEvents.length > 0
              ? secondaryEvents.map((event) => (
                  <Link
                    className="group overflow-hidden rounded-[8px] border border-foreground/10 bg-foreground/[0.045] transition hover:border-accent/45"
                    href={`/events/${event.slug}`}
                    key={event.id}
                    style={eventThemeStyle(event)}
                  >
                    <div
                      className="event-cover min-h-56"
                      style={eventCoverStyle(event)}
                    />
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2 text-xs text-muted">
                        <span className="inline-flex items-center gap-1 rounded-full border border-foreground/10 px-2.5 py-1">
                          <MapPin size={13} /> {locationLabel(event)}
                        </span>
                        <span className="rounded-full border border-foreground/10 px-2.5 py-1">
                          {priceLabel(event)}
                        </span>
                      </div>
                      <h3 className="mt-4 text-2xl font-semibold tracking-tight group-hover:text-accent">
                        {event.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-muted">
                        {event.shortDescription}
                      </p>
                    </div>
                  </Link>
                ))
              : [
                  {
                    title: "Publish paid workshops",
                    body: "Share collaborator splits before checkout starts.",
                  },
                  {
                    title: "Gate attendee resources",
                    body: "Let owned passes unlock decks, links, and notes.",
                  },
                ].map((item) => (
                  <div
                    className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-6"
                    key={item.title}
                  >
                    <Users className="text-accent" size={20} />
                    <h3 className="mt-6 text-2xl font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {item.body}
                    </p>
                  </div>
                ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
