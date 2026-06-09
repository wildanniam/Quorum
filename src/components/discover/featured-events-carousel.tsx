"use client";

import type { CSSProperties } from "react";
import { useCallback } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  TicketCheck,
} from "lucide-react";

export type FeaturedEventSlide = {
  coverStyle: CSSProperties;
  dateLabel: string;
  location: string;
  priceLabel: string;
  seatsLabel: string;
  shortDescription: string;
  slug: string;
  themeStyle: CSSProperties;
  timeLabel: string;
  title: string;
};

type FeaturedEventsCarouselProps = {
  events: FeaturedEventSlide[];
};

export function FeaturedEventsCarousel({ events }: FeaturedEventsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: events.length > 1,
    skipSnaps: false,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {events.map((event) => (
            <Link
              className="group min-w-0 flex-[0_0_100%] overflow-hidden rounded-[8px] border border-foreground/10 bg-foreground/[0.045] shadow-[0_24px_90px_rgba(0,0,0,0.28)] transition hover:border-accent/45 md:flex-[0_0_84%]"
              href={`/events/${event.slug}`}
              key={event.slug}
              style={event.themeStyle}
            >
              <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                <div
                  className="event-cover min-h-[320px] lg:min-h-[480px]"
                  style={event.coverStyle}
                />
                <div className="flex min-h-[320px] flex-col justify-between p-5 sm:p-7">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">
                        Featured
                      </span>
                      <span className="rounded-full border border-foreground/10 px-3 py-1 text-xs font-semibold text-muted">
                        {event.priceLabel}
                      </span>
                    </div>

                    <h2 className="mt-8 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl">
                      {event.title}
                    </h2>
                    <p className="mt-4 max-w-lg text-base leading-7 text-muted">
                      {event.shortDescription}
                    </p>
                  </div>

                  <div className="mt-8 grid gap-2 text-sm text-muted sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/10 bg-background/42 px-3">
                      <CalendarDays className="text-accent" size={15} />
                      {event.dateLabel}, {event.timeLabel}
                    </span>
                    <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/10 bg-background/42 px-3">
                      <MapPin className="text-accent" size={15} />
                      {event.location}
                    </span>
                    <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-foreground/10 bg-background/42 px-3">
                      <TicketCheck className="text-accent" size={15} />
                      {event.seatsLabel}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {events.length > 1 ? (
        <div className="mt-4 flex justify-end gap-2">
          <button
            aria-label="Previous featured event"
            className="grid h-10 w-10 place-items-center rounded-full border border-foreground/10 bg-foreground/[0.045] text-muted transition hover:border-accent/50 hover:text-accent"
            onClick={scrollPrev}
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            aria-label="Next featured event"
            className="grid h-10 w-10 place-items-center rounded-full border border-foreground/10 bg-foreground/[0.045] text-muted transition hover:border-accent/50 hover:text-accent"
            onClick={scrollNext}
            type="button"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
