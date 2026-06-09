import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  FeaturedEventsCarousel,
  type FeaturedEventSlide,
} from "@/components/discover/featured-events-carousel";
import { HoverCard } from "@/components/motion/hover-card";
import {
  countPassesForEvent,
  listCollaborators,
  listPublishedEvents,
} from "@/lib/events/repository";
import { eventCoverStyle, eventThemeStyle } from "@/lib/events/theme";
import type { EventRecord } from "@/lib/db/models";

export const dynamic = "force-dynamic";

type DiscoverPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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

function seatsLabel(event: EventRecord, minted: number) {
  return `${Math.max(event.capacity - minted, 0)} seats left`;
}

function splitLabel(collaborators: Awaited<ReturnType<typeof listCollaborators>>) {
  return collaborators.length > 0
    ? collaborators.map((split) => split.splitPercentage).join(" / ")
    : "100";
}

function eventMatchesQuery(event: EventRecord, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    event.title,
    event.shortDescription,
    event.eventType,
    event.locationText,
    event.locationType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function slideForEvent({
  event,
  minted,
}: {
  event: EventRecord;
  minted: number;
}): FeaturedEventSlide {
  return {
    coverStyle: eventCoverStyle(event),
    dateLabel: formatDate(event),
    location: locationLabel(event),
    priceLabel: priceLabel(event),
    seatsLabel: seatsLabel(event, minted),
    shortDescription: event.shortDescription,
    slug: event.slug,
    themeStyle: eventThemeStyle(event),
    timeLabel: formatTime(event),
    title: event.title,
  };
}

export default async function DiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = searchParams ? await searchParams : {};
  const query = (firstParam(params.q) ?? "").trim();
  const publishedEvents = await listPublishedEvents();
  const eventStats = new Map(
    await Promise.all(
      publishedEvents.map(
        async (event) =>
          [
            event.id,
            {
              collaborators: await listCollaborators(event.id),
              minted: await countPassesForEvent(event.id),
            },
          ] as const,
      ),
    ),
  );
  const filteredEvents = publishedEvents.filter((event) =>
    eventMatchesQuery(event, query),
  );
  const featuredSlides = filteredEvents.slice(0, 3).map((event) =>
    slideForEvent({
      event,
      minted: eventStats.get(event.id)?.minted ?? 0,
    }),
  );
  const eventTypes = Array.from(
    new Set(publishedEvents.map((event) => event.eventType)),
  ).slice(0, 6);

  return (
    <AppShell>
      <section className="border-b border-foreground/8">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="eyebrow">Discover</p>
              <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
                Find events worth showing up for.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted">
                Browse workshops, meetups, and community sessions with clear
                pricing, available seats, and wallet-based access before you
                open the event page.
              </p>
            </div>

            <form
              action="/discover"
              className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-2 shadow-[0_20px_80px_rgba(0,0,0,0.2)]"
            >
              <label className="sr-only" htmlFor="discover-search">
                Search events
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-h-12 flex-1 items-center gap-3 rounded-full border border-foreground/10 bg-background/58 px-4">
                  <Search className="text-muted" size={18} />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                    defaultValue={query}
                    id="discover-search"
                    name="q"
                    placeholder="Search by event, city, or format"
                  />
                  {query ? (
                    <Link
                      aria-label="Clear search"
                      className="text-muted transition hover:text-foreground"
                      href="/discover"
                    >
                      <X size={16} />
                    </Link>
                  ) : null}
                </div>
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
                  type="submit"
                >
                  Search <ArrowRight size={15} />
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-accent/40 bg-accent/12 px-3 py-1.5 text-xs font-semibold text-accent"
              href="/discover"
            >
              All events
            </Link>
            {eventTypes.map((type) => (
              <Link
                className="rounded-full border border-foreground/10 bg-foreground/[0.035] px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-accent"
                href={`/discover?q=${encodeURIComponent(type)}`}
                key={type}
              >
                {type}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        {featuredSlides.length > 0 ? (
          <>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Featured</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  Happening soon
                </h2>
              </div>
              <p className="hidden max-w-sm text-right text-sm leading-6 text-muted md:block">
                Event visuals lead. Proof details stay readable when they help
                someone decide.
              </p>
            </div>
            <FeaturedEventsCarousel events={featuredSlides} />
          </>
        ) : (
          <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-8">
            <p className="eyebrow">No matches</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Nothing matched “{query}”.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
              Try a broader search, or clear the search to browse every
              published event.
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
              href="/discover"
            >
              Clear search <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>

      <section className="border-t border-foreground/8">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="eyebrow">All events</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                {query ? `Results for “${query}”` : "Upcoming events"}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Compare the essentials quickly: when it happens, where it is,
                how much it costs, and what the pass unlocks.
              </p>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.045] px-4 text-sm font-semibold transition hover:border-accent/45 hover:text-accent"
              href="/dashboard/events/new"
            >
              Create event <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <HoverCard
                className="overflow-hidden rounded-[8px] border border-foreground/10 bg-foreground/[0.045]"
                key={event.id}
                style={eventThemeStyle(event)}
              >
                <Link className="group block h-full" href={`/events/${event.slug}`}>
                  <div
                    className="event-cover min-h-64"
                    style={eventCoverStyle(event)}
                  />
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-full border border-foreground/10 px-2.5 py-1">
                        {priceLabel(event)}
                      </span>
                      <span className="rounded-full border border-foreground/10 px-2.5 py-1">
                        {seatsLabel(event, eventStats.get(event.id)?.minted ?? 0)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight group-hover:text-accent">
                      {event.title}
                    </h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
                      {event.shortDescription}
                    </p>

                    <div className="mt-5 grid gap-2 text-sm text-muted">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="text-accent" size={15} />
                        {formatDate(event)}, {formatTime(event)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="text-accent" size={15} />
                        {locationLabel(event)}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-2">
                      {[
                        {
                          icon: Users,
                          label: `${splitLabel(
                            eventStats.get(event.id)?.collaborators ?? [],
                          )} split`,
                        },
                        {
                          icon: WalletCards,
                          label: "Wallet pay",
                        },
                        {
                          icon: ShieldCheck,
                          label: "Pass gate",
                        },
                      ].map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            className="rounded-[8px] border border-foreground/10 bg-background/32 p-3"
                            key={item.label}
                          >
                            <Icon className="text-accent" size={15} />
                            <p className="mt-2 text-xs leading-4 text-muted">
                              {item.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Link>
              </HoverCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/8">
        <div className="mx-auto grid max-w-7xl gap-3 px-5 py-10 lg:grid-cols-3 lg:px-8">
          {[
            {
              icon: Sparkles,
              label: "Event-first pages",
              body: "The event stays the hero. Blockchain proof stays supportive.",
            },
            {
              icon: CircleDollarSign,
              label: "Readable money flow",
              body: "Prices and splits are visible before anyone signs.",
            },
            {
              icon: TicketCheck,
              label: "Access after purchase",
              body: "Pass ownership unlocks resources and check-in proof.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                className="rounded-[8px] border border-foreground/10 bg-foreground/[0.035] p-5"
                key={item.label}
              >
                <Icon className="text-accent" size={18} />
                <h3 className="mt-5 text-xl font-semibold tracking-tight">
                  {item.label}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
