import Link from "next/link";
import {
  CalendarDays,
  CircleDollarSign,
  Filter,
  Search,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EventCard, type EventCardData } from "@/components/discover/event-card";
import { FeaturedEventsCarousel } from "@/components/discover/featured-events-carousel";
import {
  EmptyState,
  MetricTile,
  ProductPage,
  ProductPageHeader,
  SectionHeader,
} from "@/components/ui/product-layout";
import { QuorumButton } from "@/components/ui/quorum-button";
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

type EventStats = {
  collaborators: Awaited<ReturnType<typeof listCollaborators>>;
  minted: number;
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

function seatsLeft(event: EventRecord, minted: number) {
  return Math.max(event.capacity - minted, 0);
}

function seatsLabel(event: EventRecord, minted: number) {
  return `${seatsLeft(event, minted)} seats left`;
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

function cardDataForEvent(event: EventRecord, stats: EventStats): EventCardData {
  return {
    capacityLabel: String(event.capacity),
    coverStyle: eventCoverStyle(event),
    dateLabel: formatDate(event),
    eventType: event.eventType,
    location: locationLabel(event),
    mintedLabel: String(stats.minted),
    priceLabel: priceLabel(event),
    seatsLabel: seatsLabel(event, stats.minted),
    shortDescription: event.shortDescription,
    slug: event.slug,
    splitLabel: splitLabel(stats.collaborators),
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
  const eventTypes = Array.from(
    new Set(publishedEvents.map((event) => event.eventType)),
  ).slice(0, 6);
  const cardEvents = filteredEvents.map((event) =>
    cardDataForEvent(event, eventStats.get(event.id) ?? { collaborators: [], minted: 0 }),
  );
  const featuredEvents = cardEvents.slice(0, 3);
  const totalSeatsLeft = publishedEvents.reduce((total, event) => {
    const minted = eventStats.get(event.id)?.minted ?? 0;

    return total + seatsLeft(event, minted);
  }, 0);

  return (
    <AppShell>
      <ProductPage spacing="loose">
        <ProductPageHeader
          actions={
            <QuorumButton href="/dashboard/events/new" variant="secondary">
              Create event
            </QuorumButton>
          }
          description="Browse community events with the important parts up front: date, place, price, available seats, and the proof trail behind each pass."
          eyebrow="Discover"
          icon={Search}
          title="Find events worth showing up for."
        >
          <form action="/discover" className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="discover-search">
              Search events
            </label>
            <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-full border border-white/10 bg-quorum-grey-900/52 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <Search className="shrink-0 text-quorum-cyan-soft" size={18} />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                defaultValue={query}
                id="discover-search"
                name="q"
                placeholder="Search by event, city, format, or category"
              />
              {query ? (
                <Link
                  aria-label="Clear search"
                  className="shrink-0 text-muted transition hover:text-foreground"
                  href="/discover"
                >
                  <X size={16} />
                </Link>
              ) : null}
            </div>
            <QuorumButton className="w-full lg:w-auto" type="submit">
              Search
            </QuorumButton>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-9 items-center rounded-full border border-quorum-cyan/45 bg-quorum-cyan/12 px-3 text-xs font-medium text-quorum-cyan-soft transition hover:border-quorum-cyan-soft hover:bg-quorum-cyan/18"
              href="/discover"
            >
              All events
            </Link>
            {eventTypes.map((type) => {
              const isActive = query.toLowerCase() === type.toLowerCase();

              return (
                <Link
                  className={
                    isActive
                      ? "inline-flex min-h-9 items-center rounded-full border border-quorum-cyan/45 bg-quorum-cyan/12 px-3 text-xs font-medium text-quorum-cyan-soft"
                      : "inline-flex min-h-9 items-center rounded-full border border-white/10 bg-white/[0.035] px-3 text-xs font-medium text-muted transition hover:border-quorum-cyan/45 hover:text-quorum-cyan-soft"
                  }
                  href={`/discover?q=${encodeURIComponent(type)}`}
                  key={type}
                >
                  {type}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricTile
              detail="Published and ready to browse."
              icon={CalendarDays}
              label="events"
              value={publishedEvents.length}
            />
            <MetricTile
              detail="Across all published events."
              icon={TicketCheck}
              label="seats left"
              value={totalSeatsLeft}
            />
            <MetricTile
              detail="Filter by the event format."
              icon={Filter}
              label="categories"
              value={eventTypes.length}
            />
          </div>
        </ProductPageHeader>
      </ProductPage>

      <ProductPage spacing="compact">
        {featuredEvents.length > 0 ? (
          <>
            <SectionHeader
              description="Larger cards are reserved for events where visuals help someone decide quickly. The proof layer stays visible, but it does not fight the event story."
              eyebrow="Featured"
              title="Happening soon"
            />
            <div className="mt-6">
              <FeaturedEventsCarousel events={featuredEvents} />
            </div>
          </>
        ) : (
          <EmptyState
            action={
              query ? (
                <QuorumButton href="/discover" variant="secondary">
                  Clear search
                </QuorumButton>
              ) : (
                <QuorumButton href="/dashboard/events/new" variant="secondary">
                  Create the first event
                </QuorumButton>
              )
            }
            description={
              query
                ? "Try a broader keyword or clear the search to browse every published event."
                : "Once an organizer publishes an event, it will appear here with pricing, pass, and proof details."
            }
            icon={Search}
            title={query ? `No events matched "${query}".` : "No published events yet."}
          />
        )}
      </ProductPage>

      {cardEvents.length > 0 ? (
        <ProductPage spacing="compact">
          <SectionHeader
            actions={
              <QuorumButton href="/dashboard/events/new" variant="subtle">
                Create event
              </QuorumButton>
            }
            description="Compare the essentials quickly, then open the event for the complete split, resource, and checkout context."
            eyebrow="All events"
            title={query ? `Results for "${query}"` : "Upcoming events"}
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cardEvents.map((event) => (
              <EventCard event={event} key={event.slug} />
            ))}
          </div>
        </ProductPage>
      ) : null}

      <ProductPage spacing="compact">
        <div className="grid gap-3 lg:grid-cols-3">
          {[
            {
              body: "The event stays first. Proof details appear where they help someone trust the checkout.",
              icon: Sparkles,
              label: "Event-first browsing",
            },
            {
              body: "Prices, capacity, and collaborator splits are visible before anyone signs a wallet action.",
              icon: CircleDollarSign,
              label: "Readable money flow",
            },
            {
              body: "Each purchase leads to a wallet pass that can unlock resources and check-in evidence.",
              icon: ShieldCheck,
              label: "Access after purchase",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <article
                className="rounded-[14px] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                key={item.label}
              >
                <Icon className="text-quorum-cyan-soft" size={20} />
                <h3 className="mt-5 font-product text-xl font-medium tracking-normal">
                  {item.label}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">{item.body}</p>
              </article>
            );
          })}
        </div>
      </ProductPage>
    </AppShell>
  );
}
