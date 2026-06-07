import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  FileKey2,
  MapPin,
  ShieldCheck,
  TicketCheck,
  WalletCards,
} from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import type { EventRecord } from "@/lib/db/models";
import {
  getEventBySlug,
  listCollaborators,
  listResources,
} from "@/lib/events/repository";

type EventPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

function priceLabel(event: EventRecord) {
  return event.isFree ? "Free" : `${event.priceUsdc} USDC`;
}

function formatDate(event: EventRecord) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: event.timezone,
  }).format(new Date(event.startDateTime));
}

function coverStyle(event: EventRecord) {
  const imageUrl =
    event.coverImageUrl ??
    "https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1600&q=80";

  return {
    backgroundImage: `linear-gradient(135deg, rgba(16, 18, 15, 0.36), rgba(16, 18, 15, 0.78)), url("${imageUrl}")`,
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event || event.status !== "published") {
    notFound();
  }

  const collaborators = listCollaborators(event.id);
  const resources = listResources(event.id);
  const eventFacts = [
    { icon: CalendarDays, label: formatDate(event) },
    { icon: MapPin, label: event.locationText ?? event.locationType },
    { icon: WalletCards, label: "Freighter demo wallet" },
    { icon: ShieldCheck, label: "Escrow + NFT proof" },
    { icon: TicketCheck, label: "Single pass per wallet" },
  ];

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
        >
          <ArrowLeft size={15} /> Marketplace
        </Link>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border border-line bg-panel">
            <div
              className="event-cover min-h-[340px] border-b border-line p-6"
              style={coverStyle(event)}
            >
              <span className="border border-accent bg-accent px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-normal text-accent-ink">
                {priceLabel(event)}
              </span>
            </div>
            <div className="p-6">
              <p className="font-mono text-sm uppercase tracking-normal text-accent">
                {event.eventType}
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">
                {event.title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
                {event.shortDescription}
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {eventFacts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div
                      className="flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted"
                      key={fact.label}
                    >
                      <Icon className="text-accent" size={17} />
                      {fact.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="border border-line bg-panel p-5">
            <p className="font-mono text-xs uppercase tracking-normal text-muted">
              Split locked after publish
            </p>
            <div className="mt-4 grid gap-3">
              {collaborators.map((split) => (
                <div
                  className="grid grid-cols-[1fr_auto] border border-line bg-background/35 p-4"
                  key={split.id}
                >
                  <div>
                    <p className="font-medium">{split.displayName}</p>
                    <p className="mt-1 text-sm text-muted">{split.role}</p>
                  </div>
                  <p className="font-mono text-2xl text-accent">
                    {split.splitPercentage}%
                  </p>
                </div>
              ))}
            </div>
            <Link
              href={`/events/${event.slug}/checkout`}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
            >
              {event.isFree ? "Claim pass" : "Buy pass"} <ArrowUpRight size={16} />
            </Link>
          </aside>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border border-line bg-panel p-5" id="checkout">
            <p className="font-mono text-xs uppercase tracking-normal text-muted">
              Checkout
            </p>
            <p className="mt-3 text-4xl font-semibold">{priceLabel(event)}</p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {event.capacity} capacity · one non-transferable pass per wallet
            </p>
            <Link
              href={`/events/${event.slug}/checkout`}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 border border-accent bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-transparent hover:text-accent"
            >
              {event.isFree ? "Claim pass" : "Buy pass"} <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="border border-line bg-panel p-5">
            <p className="font-mono text-xs uppercase tracking-normal text-muted">
              Resource preview
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {resources.map((resource) => (
                <div
                  className="border border-line bg-background/35 p-4"
                  key={resource.id}
                >
                  <FileKey2 className="text-accent" size={18} />
                  <p className="mt-3 font-medium">{resource.title}</p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-normal text-muted">
                    {resource.type}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
