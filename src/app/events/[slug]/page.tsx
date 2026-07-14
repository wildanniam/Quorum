import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CalendarX2,
  FileKey2,
  MapPin,
  ShieldCheck,
  TicketCheck,
  WalletCards,
} from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SplitPreview } from "@/components/events/split-preview";
import { EmptyState, ProductPage } from "@/components/ui/product-layout";
import {
  DataRow,
  ProductSection,
  StickyActionBar,
  TaskPanel,
} from "@/components/ui/product-primitives";
import { QuorumButton } from "@/components/ui/quorum-button";
import { StatusPill } from "@/components/ui/status-pill";
import type { EventRecord } from "@/lib/db/models";
import {
  eventLifecycleLabel,
  getEventLifecycle,
} from "@/lib/events/lifecycle";
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
  const lifecycle = getEventLifecycle(event);
  const salesClosed = lifecycle === "ended";
  const checkoutHref = `/events/${event.slug}/checkout`;
  const primaryAction = event.isFree ? "Claim pass" : "Get pass";

  return (
    <AppShell>
      <ProductPage spacing="default">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-quorum-cyan-soft"
          href="/discover"
        >
          <ArrowLeft size={15} /> Back to Discover
        </Link>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <article
            className="overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.04] shadow-[0_30px_110px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]"
            style={eventThemeStyle(event)}
          >
            <div
              className="event-cover relative min-h-[520px] bg-cover bg-center p-5 sm:p-7 lg:p-9"
              style={eventCoverStyle(event)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-quorum-grey-900/92 via-quorum-grey-900/16 to-transparent" />
              <div className="relative z-10 flex min-h-[460px] flex-col justify-between gap-10">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--event-accent)] px-3 py-1 font-product text-xs font-medium text-[var(--event-ink)]">
                    {priceLabel(event)}
                  </span>
                  <span className="rounded-full border border-white/18 bg-quorum-grey-900/66 px-3 py-1 font-product text-xs font-medium text-foreground backdrop-blur-md">
                    {event.eventType}
                  </span>
                  <span className="rounded-full border border-white/18 bg-quorum-grey-900/66 px-3 py-1 font-product text-xs font-medium text-foreground backdrop-blur-md">
                    {salesClosed
                      ? eventLifecycleLabel(lifecycle)
                      : `${remainingCapacity} seats left`}
                  </span>
                </div>

                <div className="max-w-4xl">
                  <p className="font-product text-sm font-medium text-[var(--event-accent)]">
                    {locationLabel(event)}
                  </p>
                  <h1 className="mt-4 max-w-4xl font-product text-[clamp(3rem,7vw,6.75rem)] font-medium leading-[1.02] tracking-normal text-foreground text-balance">
                    {event.title}
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground/84 text-pretty">
                    {event.shortDescription}
                  </p>
                </div>
              </div>
            </div>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <TaskPanel className="p-5" tone={salesClosed ? "muted" : "default"}>
              <StatusPill
                icon={salesClosed ? CalendarX2 : TicketCheck}
                tone={salesClosed ? "muted" : lifecycle === "live" ? "live" : "cyan"}
              >
                {salesClosed ? "Event ended" : eventLifecycleLabel(lifecycle)}
              </StatusPill>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-4xl leading-none text-quorum-cyan-soft">
                    {priceLabel(event)}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {salesClosed
                      ? `${mintedPasses} passes issued before sales closed`
                      : `${remainingCapacity} of ${event.capacity} seats available`}
                  </p>
                </div>
                {salesClosed ? (
                  <CalendarX2 className="text-muted" size={28} />
                ) : (
                  <TicketCheck className="text-quorum-cyan-soft" size={28} />
                )}
              </div>

              <div className="mt-6">
                {salesClosed ? (
                  <QuorumButton href="/discover" variant="secondary">
                    Browse upcoming events
                  </QuorumButton>
                ) : (
                  <QuorumButton href={checkoutHref}>{primaryAction}</QuorumButton>
                )}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                  <Link
                    className="text-muted transition hover:text-quorum-cyan-soft"
                    href={`/events/${event.slug}/proof`}
                  >
                    View settlement proof
                  </Link>
                  <Link
                    className="text-muted transition hover:text-quorum-cyan-soft"
                    href={`/events/${event.slug}/resources`}
                  >
                    Browse resources
                  </Link>
                </div>
              </div>

              <div className="mt-6">
                {[
                  { icon: CalendarDays, label: "When", value: formatDate(event) },
                  { icon: MapPin, label: "Where", value: locationLabel(event) },
                  {
                    icon: WalletCards,
                    label: "Pass",
                    value: "One wallet-bound pass",
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

              <p className="mt-6 text-sm leading-6 text-muted">
                {salesClosed
                  ? "Pass sales are closed. Settlement proof and issued pass resources remain available."
                  : "Wallet approval is explicit. Each wallet can hold one non-transferable pass."}
              </p>
            </TaskPanel>
          </aside>
        </div>

        <StickyActionBar className="lg:hidden">
          {salesClosed ? (
            <QuorumButton className="w-full" href="/discover" variant="secondary">
              Browse upcoming events
            </QuorumButton>
          ) : (
            <QuorumButton className="w-full" href={checkoutHref}>
              {primaryAction}
            </QuorumButton>
          )}
        </StickyActionBar>
      </ProductPage>

      <ProductPage spacing="default">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <ProductSection
            description="The event page should let attendees understand the event before they think about the chain. Proof stays available when trust matters."
            eyebrow="About"
            title="Event-first checkout, with proof one step away."
          >
            <div>
              <DataRow icon={TicketCheck} label="Passes minted" value={mintedPasses} />
              <DataRow
                detail="Non-transferable access for the wallet that checks out."
                icon={ShieldCheck}
                label="Pass policy"
                value="1 per wallet"
              />
              <DataRow
                icon={FileKey2}
                label="Pass-holder resources"
                value={resources.length}
              />
            </div>
          </ProductSection>

          <section style={eventThemeStyle(event)}>
            <SplitPreview collaborators={collaborators} />
          </section>
        </div>
      </ProductPage>

      <ProductPage spacing="default">
        <ProductSection
          actions={
            <QuorumButton
              href={`/events/${event.slug}/resources`}
              variant="subtle"
            >
              Open resources
            </QuorumButton>
          }
          description="Show the shape of the gated experience without exposing private links to wallets that do not own a pass."
          eyebrow="Pass-holder resources"
          title="Resources unlock after pass ownership is verified."
        >
          {resources.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {resources.map((resource) => (
                <article
                  className="rounded-[14px] border border-white/10 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  key={resource.id}
                >
                  <FileKey2 className="text-quorum-cyan-soft" size={20} />
                  <p className="mt-4 font-product text-lg font-medium tracking-normal">
                    {resource.title}
                  </p>
                  <p className="mt-2 font-product text-xs font-medium uppercase leading-[1.4] tracking-[0.08em] text-muted">
                    {resource.type}
                  </p>
                  {resource.description ? (
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {resource.description}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              description="This event does not publish gated links or files yet. Pass ownership can still be used for check-in."
              icon={FileKey2}
              title="No resources attached"
            />
          )}
        </ProductSection>
      </ProductPage>
    </AppShell>
  );
}
