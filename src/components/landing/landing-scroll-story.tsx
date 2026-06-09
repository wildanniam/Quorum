"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function LandingScrollStory() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const steps = gsap.utils.toArray<HTMLElement>(".landing-step");

      gsap.from(steps, {
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.14,
        y: 28,
        scrollTrigger: {
          end: "bottom 64%",
          start: "top 78%",
          trigger: rootRef.current,
        },
      });

      gsap.to(".landing-proof-line", {
        ease: "none",
        scaleX: 1,
        scrollTrigger: {
          end: "bottom 66%",
          scrub: 0.6,
          start: "top 82%",
          trigger: rootRef.current,
        },
        transformOrigin: "left center",
      });
    },
    { scope: rootRef },
  );

  return (
    <section
      className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20"
      ref={rootRef}
    >
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="eyebrow">One event flow</p>
          <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            The part guests see stays beautiful. The money trail stays clear.
          </h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted">
            Quorum keeps ticketing, wallet approval, revenue split, and gated
            access in one calm product flow.
          </p>
        </div>

        <div className="relative">
          <div className="landing-proof-line absolute left-6 top-10 hidden h-px w-[calc(100%-3rem)] origin-left scale-x-0 bg-accent/70 md:block" />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                label: "Publish",
                title: "Create the event page",
                body: "The page leads with the event, not a contract dashboard.",
              },
              {
                label: "Checkout",
                title: "Let Freighter sign",
                body: "Guests approve payment with a wallet they already trust.",
              },
              {
                label: "Access",
                title: "Unlock with a pass",
                body: "Resources and check-in stay tied to the owner wallet.",
              },
            ].map((step, index) => (
              <article
                className="landing-step rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.18)]"
                key={step.label}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-accent/40 bg-accent/12 font-mono text-xs font-semibold text-accent">
                    0{index + 1}
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                    {step.label}
                  </p>
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
