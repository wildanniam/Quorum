"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/ui";
import { TestimonialCard } from "@/components/landing/testimonial-card";

export type Testimonial = {
  avatar?: string;
  name: string;
  quote: string;
  role: string;
};

type TestimonialCarouselProps = {
  className?: string;
  testimonials: Testimonial[];
};

const DEFAULT_STEP = 612;
const INITIAL_INDEX = 1;

export function TestimonialCarousel({
  className,
  testimonials,
}: TestimonialCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(
    Math.min(INITIAL_INDEX, testimonials.length - 1),
  );
  const [step, setStep] = useState(DEFAULT_STEP);

  const measureStep = useCallback(() => {
    const cards = trackRef.current?.querySelectorAll<HTMLElement>(
      "[data-testimonial-card]",
    );

    if (!cards || cards.length < 2) return;
    setStep(cards[1].offsetLeft - cards[0].offsetLeft);
  }, []);

  useEffect(() => {
    measureStep();

    const observer = new ResizeObserver(measureStep);
    if (trackRef.current) observer.observe(trackRef.current);

    window.addEventListener("resize", measureStep);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureStep);
    };
  }, [measureStep]);

  const move = (direction: -1 | 1) => {
    setActiveIndex((current) =>
      Math.min(Math.max(current + direction, 0), testimonials.length - 1),
    );
  };

  const offset = (INITIAL_INDEX - activeIndex) * step;

  return (
    <div className={cn("mt-[3.75rem]", className)}>
      <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
        <div
          className="relative left-1/2 flex w-max gap-4 transition-transform duration-500 ease-out md:gap-6"
          ref={trackRef}
          style={{
            transform: `translate3d(calc(-50% + ${offset}px), 0, 0)`,
          }}
        >
          {testimonials.map((testimonial) => (
            <TestimonialCard
              avatar={testimonial.avatar}
              key={testimonial.name}
              name={testimonial.name}
              quote={testimonial.quote}
              role={testimonial.role}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          aria-label="Show previous testimonial"
          className="grid h-[2.885rem] w-[2.885rem] place-items-center rounded-full border border-landing-cyan/35 bg-landing-cyan/10 text-landing-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-landing-cyan-soft hover:bg-landing-cyan/18 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={activeIndex === 0}
          onClick={() => move(-1)}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={22} />
        </button>
        <button
          aria-label="Show next testimonial"
          className="grid h-[2.885rem] w-[2.885rem] place-items-center rounded-full border border-landing-cyan/35 bg-landing-cyan/10 text-landing-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-landing-cyan-soft hover:bg-landing-cyan/18 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={activeIndex === testimonials.length - 1}
          onClick={() => move(1)}
          type="button"
        >
          <ArrowRight aria-hidden="true" size={22} />
        </button>
      </div>
    </div>
  );
}
