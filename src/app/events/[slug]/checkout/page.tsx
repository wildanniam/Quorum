import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FileKey2,
  MapPin,
  ShieldCheck,
  TicketCheck,
  Users,
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
  return event.locationText ?? (event.locationType === "virtual" ? "Virtual" : "Venue TBA");
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event || event.status !== "published") {
    notFound();
  }

  const collaborators = await listCollaborators(event.id);
  const resources = await listResources(event.id);
  const mintedCount = await countPassesForEvent(event.id);
  const remainingCapacity = Math.max(event.capacity - mintedCount, 0);

  const orderFacts = [
    { icon: CalendarDays, label: "When", value: formatDate(event) },
    { icon: MapPin, label: "Where", value: locationLabel(event) },
    { icon: CircleDollarSign, label: "Price", value: priceLabel(event) },
    {
      icon: TicketCheck,
      label: "Pass",
      value: "One wallet-bound pass",
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
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
          >
            <ArrowLeft size={15} /> Back to event
          </Link>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_410px] lg:items-start">
            <article className="overflow-hidden rounded-[8px] border border-foreground/10 bg-foreground/[0.045] shadow-[0_28px_110px_rgba(0,0,0,0.28)]">
              <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
                <div
                  className="event-cover min-h-[320px] lg:min-h-[520px]"
                  style={eventCoverStyle(event)}
                />

                <div className="flex min-h-[360px] flex-col justify-between p-5 sm:p-7 lg:p-8">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">
                        Review pass
                      </span>
                      <span className="rounded-full border border-foreground/10 px-3 py-1 text-xs font-semibold text-muted">
                        Freighter approval
                      </span>
                    </div>

                    <p className="mt-8 text-sm font-semibold text-accent">
                      {locationLabel(event)}
                    </p>
                    <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.02] tracking-tight text-foreground md:text-6xl">
                      {event.title}
                    </h1>
                    <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
                      Confirm the event, connect the wallet, then approve the
                      final action in Freighter when prompted.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-2 sm:grid-cols-2">
                    {orderFacts.map((fact) => {
                      const Icon = fact.icon;

                      return (
                        <div
                          className="grid grid-cols-[auto_1fr] gap-3 rounded-[8px] border border-foreground/10 bg-background/32 p-3"
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
                </div>
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

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5 lg:p-6">
            <div className="flex items-start gap-3">
              <Users className="mt-1 text-accent" size={19} />
              <div>
                <p className="eyebrow">Where payment goes</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
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
                  className="grid grid-cols-[1fr_auto] gap-4 rounded-[8px] border border-foreground/10 bg-background/32 p-4"
                  key={split.id}
                >
                  <div>
                    <p className="font-medium">{split.displayName}</p>
                    <p className="mt-1 text-sm text-muted">{split.role}</p>
                  </div>
                  <p className="text-2xl font-semibold text-accent">
                    {split.splitPercentage}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5 lg:p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 text-accent" size={19} />
              <div>
                <p className="eyebrow">After confirmation</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">
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
          </div>
        </div>
      </section>
    </AppShell>
  );
}
