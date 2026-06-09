import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileKey2,
  MapPin,
  ShieldCheck,
  TicketCheck,
  Users,
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
  return event.locationText ?? (event.locationType === "virtual" ? "Virtual" : "Venue TBA");
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event || event.status !== "published") {
    notFound();
  }

  const collaborators = await listCollaborators(event.id);
  const resources = await listResources(event.id);
  const mintedPasses = await countPassesForEvent(event.id);
  const remainingCapacity = Math.max(event.capacity - mintedPasses, 0);
  const checkoutHref = `/events/${event.slug}/checkout`;
  const primaryAction = event.isFree ? "Claim pass" : "Get pass";
  const collaboratorSplit = collaborators.length
    ? collaborators.map((split) => split.splitPercentage).join(" / ")
    : "100";

  const eventFacts = [
    { icon: CalendarDays, label: "When", value: formatDate(event) },
    { icon: MapPin, label: "Where", value: locationLabel(event) },
    {
      icon: TicketCheck,
      label: "Seats",
      value: `${remainingCapacity} of ${event.capacity} left`,
    },
  ];

  const passHighlights = [
    "Freighter approval stays explicit.",
    "One pass can be held by one wallet.",
    "Resources unlock after ownership is verified.",
  ];

  const journey = [
    {
      icon: WalletCards,
      label: "Approve",
      value: "Connect wallet and confirm the checkout action.",
    },
    {
      icon: CircleDollarSign,
      label: event.isFree ? "Claim" : "Pay",
      value: event.isFree
        ? "Claim the event pass without payment."
        : "USDC follows the organizer split.",
    },
    {
      icon: TicketCheck,
      label: "Receive",
      value: "Your wallet receives the event pass.",
    },
    {
      icon: FileKey2,
      label: "Unlock",
      value: "Use the pass for resources and check-in.",
    },
  ];

  return (
    <AppShell>
      <section
        className="border-b border-foreground/8"
        style={eventThemeStyle(event)}
      >
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
          >
            <ArrowLeft size={15} /> Back to Discover
          </Link>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
            <article className="overflow-hidden rounded-[8px] border border-foreground/10 bg-foreground/[0.045] shadow-[0_28px_110px_rgba(0,0,0,0.34)]">
              <div
                className="event-cover min-h-[520px] p-5 sm:p-7 lg:p-9"
                style={eventCoverStyle(event)}
              >
                <div className="flex h-full flex-col justify-between gap-12">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">
                      {priceLabel(event)}
                    </span>
                    <span className="rounded-full border border-foreground/18 bg-background/70 px-3 py-1 text-xs font-semibold text-foreground">
                      {event.eventType}
                    </span>
                    <span className="rounded-full border border-foreground/18 bg-background/70 px-3 py-1 text-xs font-semibold text-foreground">
                      {remainingCapacity} seats left
                    </span>
                  </div>

                  <div className="max-w-4xl">
                    <p className="text-sm font-semibold text-accent">
                      {locationLabel(event)}
                    </p>
                    <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-foreground md:text-7xl">
                      {event.title}
                    </h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground/84">
                      {event.shortDescription}
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <aside className="rounded-[8px] border border-foreground/10 bg-background/84 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:sticky lg:top-24 lg:self-start">
              <p className="eyebrow">Event pass</p>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-4xl font-semibold tracking-tight">
                    {priceLabel(event)}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {remainingCapacity} seats available
                  </p>
                </div>
                <TicketCheck className="text-accent" size={28} />
              </div>

              <Link
                href={checkoutHref}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
              >
                {primaryAction} <ArrowRight size={16} />
              </Link>

              <div className="mt-5 grid gap-3">
                {eventFacts.map((fact) => {
                  const Icon = fact.icon;

                  return (
                    <div
                      className="grid grid-cols-[auto_1fr] gap-3 rounded-[8px] border border-foreground/10 bg-foreground/[0.035] p-3"
                      key={fact.label}
                    >
                      <Icon className="mt-0.5 text-accent" size={16} />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                          {fact.label}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-foreground">
                          {fact.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-2 text-sm text-muted">
                {passHighlights.map((highlight) => (
                  <div className="flex items-center gap-2" key={highlight}>
                    <CheckCircle2 className="text-accent" size={16} />
                    {highlight}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5 lg:p-6">
            <p className="eyebrow">About</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              A paid event page that keeps the experience human.
            </h2>
            <p className="mt-4 text-base leading-8 text-muted">
              Guests can understand the event first, then review pricing,
              wallet approval, seat availability, and access rules when they
              are ready to get a pass.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Users,
                  label: "Split",
                  value: collaboratorSplit,
                },
                {
                  icon: ShieldCheck,
                  label: "Pass",
                  value: "Wallet-bound",
                },
                {
                  icon: FileKey2,
                  label: "Resources",
                  value: `${resources.length} gated`,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="rounded-[8px] border border-foreground/10 bg-background/32 p-4"
                    key={item.label}
                  >
                    <Icon className="text-accent" size={18} />
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5 lg:p-6">
            <p className="eyebrow">Pass journey</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              From wallet approval to attendee access.
            </h2>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {journey.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div
                    className="rounded-[8px] border border-foreground/10 bg-background/32 p-4"
                    key={step.label}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="text-accent" size={18} />
                      <span className="font-mono text-xs text-muted">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-4 text-lg font-semibold">{step.label}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {step.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5 lg:p-6">
            <p className="eyebrow">Collaborators</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Everyone can see the route before checkout.
            </h2>
            <div className="mt-5 grid gap-3">
              {collaborators.length > 0 ? (
                collaborators.map((split) => (
                  <div
                    className="grid grid-cols-[1fr_auto] gap-4 rounded-[8px] border border-foreground/10 bg-background/32 p-4"
                    key={split.id}
                  >
                    <div>
                      <p className="font-medium">{split.displayName}</p>
                      <p className="mt-1 text-sm text-muted">{split.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-accent">
                        {split.splitPercentage}%
                      </p>
                      <p className="mt-1 text-xs text-muted">share</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-[8px] border border-foreground/10 bg-background/32 p-4 text-sm text-muted">
                  This event currently routes to the organizer wallet.
                </p>
              )}
            </div>
          </article>

          <article className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5 lg:p-6">
            <p className="eyebrow">Pass-holder resources</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Show what exists without exposing the gated material.
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {resources.map((resource) => (
                <div
                  className="rounded-[8px] border border-foreground/10 bg-background/32 p-4"
                  key={resource.id}
                >
                  <FileKey2 className="text-accent" size={18} />
                  <p className="mt-3 font-medium">{resource.title}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
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
          </article>
        </div>
      </section>
    </AppShell>
  );
}
