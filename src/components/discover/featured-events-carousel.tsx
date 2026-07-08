"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FeaturedEventCard, type EventCardData } from "./event-card";

type FeaturedEventsCarouselProps = {
  events: EventCardData[];
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
            <div
              className="min-w-0 flex-[0_0_100%] md:flex-[0_0_86%] xl:flex-[0_0_78%]"
              key={event.slug}
            >
              <FeaturedEventCard event={event} />
            </div>
          ))}
        </div>
      </div>

      {events.length > 1 ? (
        <div className="mt-4 flex justify-end gap-2">
          <button
            aria-label="Previous featured event"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.045] text-muted transition hover:border-quorum-cyan/50 hover:text-quorum-cyan-soft"
            onClick={scrollPrev}
            type="button"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            aria-label="Next featured event"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.045] text-muted transition hover:border-quorum-cyan/50 hover:text-quorum-cyan-soft"
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
