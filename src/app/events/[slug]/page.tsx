import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
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
  countPassesForEvent,
  getEventBySlug,
  listCollaborators,
  listResources,
} from "@/lib/events/repository";
import { eventCoverStyle, eventThemeStyle } from "@/lib/events/theme";

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

function locationLabel(event: EventRecord) {
  return event.locationText ?? (event.locationType === "virtual" ? "Virtual" : "Venue to be announced");
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event || event.status !== "published") {
    notFound();
  }

  const collaborators = listCollaborators(event.id);
  const resources = listResources(event.id);
  const mintedPasses = countPassesForEvent(event.id);
  const remainingCapacity = Math.max(event.capacity - mintedPasses, 0);
  const checkoutHref = `/events/${event.slug}/checkout`;
  const primaryAction = event.isFree ? "Claim pass" : "Get pass";

  const eventFacts = [
    { icon: CalendarDays, label: "When", value: formatDate(event) },
    { icon: MapPin, label: "Where", value: locationLabel(event) },
    { icon: TicketCheck, label: "Capacity", value: `${remainingCapacity} of ${event.capacity} seats left` },
    { icon: ShieldCheck, label: "Access", value: "Non-transferable pass" },
  ];

  const proofSteps = [
    {
      icon: WalletCards,
      label: "Wallet session",
      value: "Attendee approves the action in Freighter.",
    },
    {
      icon: CircleDollarSign,
      label: "Checkout",
      value: event.isFree
        ? "The claim path mints a pass without payment."
        : "USDC checkout follows the published route.",
    },
    {
      icon: TicketCheck,
      label: "Pass proof",
      value: "A single wallet receives a single event pass.",
    },
    {
      icon: FileKey2,
      label: "Unlocks",
      value: "Resources and check-in proof stay tied to the pass.",
    },
  ];

  return (
    <AppShell>
      <section className="border-b border-line/70" style={eventThemeStyle(event)}>
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-event-accent"
          >
            <ArrowLeft size={15} /> Back to marketplace
          </Link>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
            <article className="overflow-hidden rounded-[8px] border border-line bg-panel">
              <div
                className="event-cover min-h-[430px] p-5 sm:p-6 lg:p-8"
                style={eventCoverStyle(event)}
              >
                <div className="flex h-full flex-col justify-between gap-10">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-[6px] bg-event-accent px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-normal text-event-ink">
                      {priceLabel(event)}
                    </span>
                    <span className="rounded-[6px] border border-foreground/20 bg-background/72 px-2.5 py-1 font-mono text-xs uppercase tracking-normal text-foreground">
                      Published
                    </span>
                    <span className="rounded-[6px] border border-foreground/20 bg-background/72 px-2.5 py-1 font-mono text-xs uppercase tracking-normal text-foreground">
                      One pass / wallet
                    </span>
                  </div>

                  <div className="max-w-3xl">
                    <p className="eyebrow">{event.eventType}</p>
                    <h1 className="mt-4 text-5xl font-semibold leading-[1.02] text-foreground md:text-7xl">
                      {event.title}
                    </h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground/84">
                      {event.shortDescription}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-px border-t border-line bg-line md:grid-cols-2">
                {eventFacts.map((fact) => {
                  const Icon = fact.icon;

                  return (
                    <div
                      className="grid grid-cols-[auto_1fr] gap-3 bg-panel p-5"
                      key={fact.label}
                    >
                      <Icon className="mt-1 text-event-accent" size={18} />
                      <div>
                        <p className="font-mono text-xs uppercase tracking-normal text-muted">
                          {fact.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground">
                          {fact.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <aside className="rounded-[8px] border border-line bg-panel/90 p-5 shadow-[0_20px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl lg:sticky lg:top-24 lg:self-start">
              <p className="eyebrow">Event pass</p>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-4xl font-semibold">{priceLabel(event)}</p>
                  <p className="mt-2 text-sm text-muted">
                    {remainingCapacity} seats available
                  </p>
                </div>
                <TicketCheck className="text-event-accent" size={28} />
              </div>

              <Link
                href={checkoutHref}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-event-accent px-4 text-sm font-semibold text-event-ink transition hover:bg-foreground"
              >
                {primaryAction} <ArrowUpRight size={16} />
              </Link>

              <div className="mt-5 grid gap-3 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-event-accent" size={16} />
                  Freighter approval stays manual.
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-event-accent" size={16} />
                  Passes cannot be transferred.
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-event-accent" size={16} />
                  Resources unlock from pass ownership.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[8px] border border-line bg-panel p-5">
            <p className="eyebrow">Payout split</p>
            <h2 className="mt-3 text-2xl font-semibold">
              Collaborators know the route before checkout.
            </h2>
            <div className="mt-5 grid gap-3">
              {collaborators.map((split) => (
                <div
                  className="grid grid-cols-[1fr_auto] gap-4 rounded-[8px] border border-line bg-background/32 p-4"
                  key={split.id}
                >
                  <div>
                    <p className="font-medium">{split.displayName}</p>
                    <p className="mt-1 text-sm text-muted">{split.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-2xl text-event-accent">
                      {split.splitPercentage}%
                    </p>
                    <p className="mt-1 text-xs text-muted">share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-line bg-panel p-5">
            <p className="eyebrow">Proof path</p>
            <h2 className="mt-3 text-2xl font-semibold">
              One attendee journey from signature to unlock.
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {proofSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    className="rounded-[8px] border border-line bg-background/32 p-4"
                    key={step.label}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="text-event-accent" size={18} />
                      <span className="font-mono text-xs text-muted">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-4 font-semibold">{step.label}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {step.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[8px] border border-line bg-panel p-5">
          <div className="grid gap-4 md:grid-cols-[0.7fr_1.3fr] md:items-start">
            <div>
              <p className="eyebrow">Resource preview</p>
              <h2 className="mt-3 text-2xl font-semibold">
                Pass holders get the working material.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                The event page can show what exists without exposing the gated
                content before the wallet proves ownership.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {resources.map((resource) => (
                <div
                  className="rounded-[8px] border border-line bg-background/32 p-4"
                  key={resource.id}
                >
                  <FileKey2 className="text-event-accent" size={18} />
                  <p className="mt-3 font-medium">{resource.title}</p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-normal text-muted">
                    {resource.type}
                  </p>
                  {resource.description ? (
                    <p className="mt-2 text-xs leading-5 text-muted">
                      {resource.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
