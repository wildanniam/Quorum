import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FileKey2,
  Handshake,
  MapPin,
  ShieldCheck,
  TicketCheck,
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
import { eventCoverStyle, eventThemeStyle } from "@/lib/events/theme";

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

function locationLabel(event: EventRecord) {
  return event.locationText ?? (event.locationType === "virtual" ? "Virtual" : "Venue to be announced");
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

  const orderFacts = [
    { icon: CalendarDays, label: "Event time", value: formatDate(event) },
    { icon: MapPin, label: "Location", value: locationLabel(event) },
    { icon: CircleDollarSign, label: "Price", value: priceLabel(event) },
    { icon: TicketCheck, label: "Pass policy", value: "One non-transferable pass per wallet" },
  ];

  return (
    <AppShell>
      <section className="border-b border-line/70" style={eventThemeStyle(event)}>
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-event-accent"
          >
            <ArrowLeft size={15} /> Back to event
          </Link>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_410px] lg:items-start">
            <article className="overflow-hidden rounded-[8px] border border-line bg-panel">
              <div
                className="event-cover min-h-[380px] p-5 sm:p-6 lg:p-8"
                style={eventCoverStyle(event)}
              >
                <div className="flex h-full flex-col justify-between gap-10">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-[6px] bg-event-accent px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-normal text-event-ink">
                      Checkout
                    </span>
                    <span className="rounded-[6px] border border-foreground/20 bg-background/72 px-2.5 py-1 font-mono text-xs uppercase tracking-normal text-foreground">
                      Freighter approval
                    </span>
                  </div>

                  <div className="max-w-3xl">
                    <p className="eyebrow">Review pass order</p>
                    <h1 className="mt-4 text-5xl font-semibold leading-[1.02] text-foreground md:text-7xl">
                      {event.title}
                    </h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground/84">
                      Confirm the event, connect the wallet, then approve the
                      final action in Freighter when prompted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-px border-t border-line bg-line md:grid-cols-2">
                {orderFacts.map((fact) => {
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

            <CheckoutPanel
              capacity={event.capacity}
              eventId={event.id}
              isFree={event.isFree}
              priceUsdc={event.priceUsdc}
              remainingCapacity={remainingCapacity}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[8px] border border-line bg-panel p-5">
            <div className="flex items-start gap-3">
              <Handshake className="mt-1 text-event-accent" size={19} />
              <div>
                <p className="eyebrow">Payout route</p>
                <h2 className="mt-3 text-2xl font-semibold">
                  Split is visible before payment.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  The checkout amount follows the published collaborator split.
                </p>
              </div>
            </div>
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
                  <p className="font-mono text-2xl text-event-accent">
                    {split.splitPercentage}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-line bg-panel p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 text-event-accent" size={19} />
              <div>
                <p className="eyebrow">After confirmation</p>
                <h2 className="mt-3 text-2xl font-semibold">
                  The pass becomes the access key.
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Once the pass is issued, the holder can open resources and use
                  it for check-in proof.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
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
