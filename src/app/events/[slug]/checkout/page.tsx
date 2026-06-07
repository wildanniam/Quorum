import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileKey2,
  MapPin,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CheckoutPanel } from "@/components/events/checkout-panel";
import type { EventRecord } from "@/lib/db/models";
import {
  countPassesForEvent,
  getEventBySlug,
  listCollaborators,
  listResources,
} from "@/lib/events/repository";

type CheckoutPageProps = {
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
    backgroundImage: `linear-gradient(135deg, rgba(16, 18, 15, 0.38), rgba(16, 18, 15, 0.84)), url("${imageUrl}")`,
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event || event.status !== "published") {
    notFound();
  }

  const collaborators = listCollaborators(event.id);
  const resources = listResources(event.id);
  const mintedCount = countPassesForEvent(event.id);
  const remainingCapacity = Math.max(event.capacity - mintedCount, 0);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
        >
          <ArrowLeft size={15} /> Event
        </Link>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.72fr]">
          <div className="border border-line bg-panel">
            <div
              className="event-cover min-h-[310px] border-b border-line p-6"
              style={coverStyle(event)}
            >
              <div className="flex h-full flex-col justify-between">
                <span className="w-fit border border-accent bg-accent px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-normal text-accent-ink">
                  {priceLabel(event)}
                </span>
                <div>
                  <p className="font-mono text-xs uppercase tracking-normal text-accent">
                    Quorum checkout
                  </p>
                  <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                    {event.title}
                  </h1>
                </div>
              </div>
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-2">
              <div className="flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted">
                <CalendarDays className="text-accent" size={17} />
                {formatDate(event)}
              </div>
              <div className="flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted">
                <MapPin className="text-accent" size={17} />
                {event.locationText ?? event.locationType}
              </div>
              <div className="flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted">
                <Scale className="text-accent" size={17} />
                Split locked after publish
              </div>
              <div className="flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted">
                <ShieldCheck className="text-accent" size={17} />
                NFT pass proof
              </div>
            </div>
          </div>

          <CheckoutPanel
            capacity={event.capacity}
            eventId={event.id}
            isFree={event.isFree}
            priceUsdc={event.priceUsdc}
            remainingCapacity={remainingCapacity}
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="border border-line bg-panel p-5">
            <p className="font-mono text-xs uppercase tracking-normal text-muted">
              Revenue split
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
          </div>

          <div className="border border-line bg-panel p-5">
            <p className="font-mono text-xs uppercase tracking-normal text-muted">
              Resources after pass
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
