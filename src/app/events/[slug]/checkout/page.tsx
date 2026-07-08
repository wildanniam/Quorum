import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FileKey2,
  MapPin,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CheckoutPanel } from "@/components/events/checkout-panel";
import { SplitPreview } from "@/components/events/split-preview";
import {
  EmptyState,
  ProductPage,
  SectionHeader,
} from "@/components/ui/product-layout";
import { StatusPill } from "@/components/ui/status-pill";
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

  return (
    <AppShell>
      <ProductPage spacing="loose">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-quorum-cyan-soft"
          href={`/events/${event.slug}`}
        >
          <ArrowLeft size={15} /> Back to event
        </Link>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_410px] lg:items-start">
          <article
            className="overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.04] shadow-[0_30px_110px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)]"
            style={eventThemeStyle(event)}
          >
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div
                className="event-cover min-h-[320px] bg-cover bg-center lg:min-h-[520px]"
                style={eventCoverStyle(event)}
              />

              <div className="flex min-h-[360px] flex-col justify-between p-5 sm:p-7 lg:p-8">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill icon={TicketCheck} tone="cyan">
                      Review pass
                    </StatusPill>
                    <StatusPill icon={ShieldCheck} tone="muted">
                      Freighter approval
                    </StatusPill>
                  </div>

                  <p className="mt-8 font-product text-sm font-medium text-[var(--event-accent)]">
                    {locationLabel(event)}
                  </p>
                  <h1 className="mt-4 max-w-2xl font-product text-[clamp(3rem,7vw,5.75rem)] font-medium leading-[1.04] tracking-normal text-foreground text-balance">
                    {event.title}
                  </h1>
                  <p className="mt-5 max-w-xl text-lg leading-8 text-muted text-pretty">
                    Review the pass, connect the wallet, then approve the final
                    prompt in Freighter when it appears.
                  </p>
                </div>

                <div className="mt-8 grid gap-2 sm:grid-cols-2">
                  {[
                    { icon: CalendarDays, label: "When", value: formatDate(event) },
                    { icon: MapPin, label: "Where", value: locationLabel(event) },
                    { icon: CircleDollarSign, label: "Price", value: priceLabel(event) },
                    {
                      icon: TicketCheck,
                      label: "Pass",
                      value: "Wallet-bound access",
                    },
                  ].map((fact) => {
                    const Icon = fact.icon;

                    return (
                      <div
                        className="grid grid-cols-[auto_1fr] gap-3 rounded-[12px] border border-white/10 bg-quorum-grey-900/42 p-3"
                        key={fact.label}
                      >
                        <Icon
                          className="mt-0.5 text-quorum-cyan-soft"
                          size={16}
                        />
                        <div>
                          <p className="font-product text-xs text-muted">
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
      </ProductPage>

      <ProductPage spacing="compact">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section style={eventThemeStyle(event)}>
            <SplitPreview collaborators={collaborators} />
          </section>

          <section className="rounded-[16px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:p-6">
            <SectionHeader
              description="After checkout succeeds, the pass becomes the wallet-held object for resources, check-in, and proof review."
              eyebrow="After confirmation"
              title="The pass becomes the access key."
            />

            {resources.length > 0 ? (
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {resources.map((resource) => (
                  <article
                    className="rounded-[12px] border border-white/10 bg-quorum-grey-900/38 p-4"
                    key={resource.id}
                  >
                    <FileKey2 className="text-quorum-cyan-soft" size={18} />
                    <p className="mt-3 font-medium">{resource.title}</p>
                    <p className="mt-2 font-product text-xs font-medium uppercase leading-[1.4] tracking-[0.08em] text-muted">
                      {resource.type}
                    </p>
                    {resource.description ? (
                      <p className="mt-2 text-xs leading-5 text-muted">
                        {resource.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-6"
                description="This event has no gated resources attached yet. The issued pass can still be used for check-in."
                icon={FileKey2}
                title="No resources attached"
              />
            )}
          </section>
        </div>
      </ProductPage>
    </AppShell>
  );
}
