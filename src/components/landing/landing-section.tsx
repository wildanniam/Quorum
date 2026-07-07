import type React from "react";
import { cn } from "@/lib/ui";
import { SectionLabel } from "@/components/landing/section-label";

type LandingSectionProps = {
  align?: "center" | "left";
  children: React.ReactNode;
  className?: string;
  eyebrow?: string;
  intro?: string;
  title?: string;
};

export function LandingSection({
  align = "center",
  children,
  className,
  eyebrow,
  intro,
  title,
}: LandingSectionProps) {
  return (
    <section className={cn("landing-section", className)}>
      <div className="landing-container">
        {eyebrow || title || intro ? (
          <div
            className={cn(
              "mb-12",
              align === "center" ? "mx-auto max-w-4xl text-center" : "max-w-3xl",
            )}
          >
            {eyebrow ? <SectionLabel>{eyebrow}</SectionLabel> : null}
            {title ? (
              <h2 className="mt-7 font-product text-4xl font-semibold leading-[1.08] tracking-normal text-landing-white text-balance md:text-6xl">
                {title}
              </h2>
            ) : null}
            {intro ? (
              <p
                className={cn(
                  "mt-5 text-base leading-7 text-landing-muted",
                  align === "center" ? "mx-auto max-w-3xl" : "max-w-2xl",
                )}
              >
                {intro}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}
