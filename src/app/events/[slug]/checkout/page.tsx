import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CalendarX2,
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
import { EmptyState, ProductPage } from "@/components/ui/product-layout";
import { CompactPageHeader, DataRow, ProductSection, TaskPanel } from "@/components/ui/product-primitives";
import { StatusPill } from "@/components/ui/status-pill";
import type { EventRecord } from "@/lib/db/models";
import { getEventLifecycle } from "@/lib/events/lifecycle";
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
  const salesClosed = getEventLifecycle(event) === "ended";

  return (
    <AppShell>
      <ProductPage className="space-y-8" spacing="default">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-quorum-cyan-soft"
          href={`/events/${event.slug}`}
        >
          <ArrowLeft size={15} /> Back to event
        </Link>

        <CompactPageHeader
          description={
            salesClosed
              ? "This event has ended, so new passes can no longer be issued. Existing proof and resources remain available."
              : "Review the pass details, connect the wallet, then approve the explicit Freighter prompt when it appears."
          }
          eyebrow={salesClosed ? "Sales closed" : "Checkout"}
          icon={salesClosed ? CalendarX2 : TicketCheck}
          meta={
            <div className="flex flex-wrap gap-2">
              <StatusPill icon={TicketCheck} tone="cyan">
                Review pass
              </StatusPill>
              <StatusPill icon={CircleDollarSign} tone="cyan">
                {priceLabel(event)}
              </StatusPill>
              <StatusPill icon={ShieldCheck} tone="muted">
                Stellar Testnet
              </StatusPill>
            </div>
          }
          title={salesClosed ? "This event has ended." : "Review your pass."}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_410px] lg:items-start">
          <TaskPanel className="overflow-hidden p-0" tone="default">
            <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
              <div
                className="event-cover min-h-60 bg-cover bg-center lg:min-h-[360px]"
                style={eventCoverStyle(event)}
              />

              <div className="p-5 sm:p-6">
                <div>
                  <p className="font-product text-sm font-medium text-[var(--event-accent)]">
                    {locationLabel(event)}
                  </p>
                  <h2 className="mt-3 max-w-2xl font-product text-3xl font-medium leading-tight tracking-normal text-foreground text-balance sm:text-4xl">
                    {event.title}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted text-pretty">
                    One wallet-bound pass unlocks the event resources and gives the organizer a check-in record.
                  </p>
                </div>

                <div className="mt-6">
                  {[
                    { icon: CalendarDays, label: "When", value: formatDate(event) },
                    { icon: MapPin, label: "Where", value: locationLabel(event) },
                    {
                      icon: TicketCheck,
                      label: "Pass",
                      value: "Wallet-bound access",
                    },
                  ].map((fact) => (
                    <DataRow
                      detail={fact.value}
                      icon={fact.icon}
                      key={fact.label}
                      label={fact.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TaskPanel>

          <CheckoutPanel
            capacity={event.capacity}
            eventId={event.id}
            isFree={event.isFree}
            priceUsdc={event.priceUsdc}
            remainingCapacity={remainingCapacity}
            salesClosed={salesClosed}
          />
        </div>
      </ProductPage>

      <ProductPage spacing="default">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <ProductSection
            description="The split stays visible before approval, without competing with the checkout decision."
            eyebrow="Payment route"
            title="Where the payment goes"
          >
            <details className="group mt-5 rounded-[8px] border border-white/10 bg-white/[0.025] p-4" style={eventThemeStyle(event)}>
              <summary className="cursor-pointer list-none text-sm font-medium text-foreground marker:hidden">
                View the published revenue split
              </summary>
              <div className="mt-4">
                <SplitPreview collaborators={collaborators} />
              </div>
            </details>
          </ProductSection>

          <ProductSection
            description="After checkout succeeds, the pass becomes the wallet-held object for resources, check-in, and proof review."
            eyebrow="After confirmation"
            title="The pass becomes the access key."
          >

            {resources.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
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
                description="This event has no gated resources attached yet. The issued pass can still be used for check-in."
                icon={FileKey2}
                title="No resources attached"
              />
            )}
          </ProductSection>
        </div>
      </ProductPage>
    </AppShell>
  );
}
