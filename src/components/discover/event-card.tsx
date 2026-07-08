import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  ShieldCheck,
  TicketCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { HoverCard } from "@/components/motion/hover-card";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/ui";

export type EventCardData = {
  capacityLabel: string;
  coverStyle: CSSProperties;
  dateLabel: string;
  eventType: string;
  location: string;
  mintedLabel: string;
  priceLabel: string;
  seatsLabel: string;
  shortDescription: string;
  slug: string;
  splitLabel: string;
  themeStyle: CSSProperties;
  timeLabel: string;
  title: string;
};

type EventCardProps = {
  className?: string;
  event: EventCardData;
  priority?: boolean;
};

export function EventCard({ className, event, priority = false }: EventCardProps) {
  return (
    <HoverCard
      className={cn(
        "group h-full overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.04] shadow-[0_24px_90px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-quorum-cyan/50 hover:bg-white/[0.06]",
        className,
      )}
      style={event.themeStyle}
    >
      <Link
        className="flex h-full min-h-0 flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-quorum-cyan"
        href={`/events/${event.slug}`}
      >
        <div
          className={cn(
            "event-cover relative min-h-0 overflow-hidden bg-cover bg-center",
            priority ? "aspect-[16/9] md:aspect-[16/8]" : "aspect-[16/10]",
          )}
          style={event.coverStyle}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-quorum-grey-900 via-quorum-grey-900/16 to-transparent" />
          <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
            <StatusPill tone="cyan">{event.eventType}</StatusPill>
            <StatusPill tone="muted">{event.priceLabel}</StatusPill>
          </div>
          <div className="absolute bottom-4 left-4 rounded-[12px] border border-white/12 bg-quorum-grey-900/72 px-4 py-3 backdrop-blur-md">
            <p className="font-mono text-2xl leading-none text-quorum-cyan-soft">
              {event.dateLabel}
            </p>
            <p className="mt-1 text-xs font-medium text-muted">{event.timeLabel}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="min-w-0">
            <h3 className="font-product text-2xl font-medium leading-tight tracking-normal text-foreground text-balance transition group-hover:text-quorum-cyan-soft">
              {event.title}
            </h3>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted text-pretty">
              {event.shortDescription}
            </p>
          </div>

          <div className="mt-5 grid gap-2 text-sm text-muted">
            <span className="inline-flex min-w-0 items-center gap-2">
              <MapPin className="shrink-0 text-quorum-cyan-soft" size={15} />
              <span className="truncate">{event.location}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <TicketCheck className="shrink-0 text-quorum-cyan-soft" size={15} />
              {event.seatsLabel}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { icon: Users, label: event.splitLabel, value: "split" },
              { icon: WalletCards, label: event.mintedLabel, value: "passes" },
              { icon: ShieldCheck, label: event.capacityLabel, value: "capacity" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="rounded-[10px] border border-white/10 bg-quorum-grey-900/42 p-3"
                  key={item.value}
                >
                  <Icon className="text-quorum-cyan-soft" size={15} />
                  <p className="mt-2 truncate font-mono text-sm text-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-[0.7rem] leading-4 text-muted">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
              <ShieldCheck size={14} />
              Wallet pass proof
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-quorum-cyan-soft">
              Open event <ArrowRight size={15} />
            </span>
          </div>
        </div>
      </Link>
    </HoverCard>
  );
}

type FeaturedEventCardProps = {
  event: EventCardData;
};

export function FeaturedEventCard({ event }: FeaturedEventCardProps) {
  return (
    <Link
      className="group block h-full overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.045] shadow-[0_30px_110px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-quorum-cyan/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-quorum-cyan"
      href={`/events/${event.slug}`}
      style={event.themeStyle}
    >
      <div className="grid h-full lg:grid-cols-[1.08fr_0.92fr]">
        <div
          className="event-cover relative min-h-[300px] bg-cover bg-center lg:min-h-[460px]"
          style={event.coverStyle}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-quorum-grey-900/80 via-transparent to-quorum-grey-900/12" />
          <div className="absolute left-5 top-5 flex flex-wrap gap-2">
            <StatusPill tone="cyan">Featured</StatusPill>
            <StatusPill tone="muted">{event.eventType}</StatusPill>
          </div>
        </div>

        <div className="flex min-h-[300px] flex-col justify-between p-5 sm:p-7">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusPill icon={CalendarDays} tone="muted">
                {event.dateLabel}, {event.timeLabel}
              </StatusPill>
              <StatusPill tone="cyan">{event.priceLabel}</StatusPill>
            </div>
            <h2 className="mt-7 max-w-xl font-product text-4xl font-medium leading-tight tracking-normal text-foreground text-balance transition group-hover:text-quorum-cyan-soft md:text-5xl">
              {event.title}
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted text-pretty">
              {event.shortDescription}
            </p>
          </div>

          <div className="mt-8 grid gap-2 text-sm text-muted sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-quorum-grey-900/42 px-3">
              <MapPin className="shrink-0 text-quorum-cyan-soft" size={15} />
              <span className="truncate">{event.location}</span>
            </span>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-quorum-grey-900/42 px-3">
              <TicketCheck className="shrink-0 text-quorum-cyan-soft" size={15} />
              {event.seatsLabel}
            </span>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-quorum-grey-900/42 px-3">
              <ShieldCheck className="shrink-0 text-quorum-cyan-soft" size={15} />
              Wallet proof
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
