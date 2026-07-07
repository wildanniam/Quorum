import type React from "react";
import { cn } from "@/lib/ui";

type FeatureCardProps = {
  children?: React.ReactNode;
  className?: string;
  description: string;
  title: string;
  visual?: React.ReactNode;
};

export function FeatureCard({
  children,
  className,
  description,
  title,
  visual,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "group relative min-h-[271px] overflow-hidden rounded-[10px] border border-[#494949] bg-[#0b0a0a] shadow-[0_24px_70px_rgba(0,0,0,0.22)] transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-landing-cyan/45 hover:shadow-[0_30px_90px_rgba(0,0,0,0.32),0_0_46px_rgba(38,198,218,0.08)]",
        className,
      )}
      data-landing-hover="true"
    >
      <div className="absolute inset-0">{visual}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-6 pt-20 sm:pt-16">
        <div className="absolute inset-x-0 bottom-0 -z-10 h-[10rem] bg-gradient-to-t from-[#0b0a0a] via-[#0b0a0a]/92 to-transparent sm:h-[7.75rem]" />
        <h3 className="font-product text-xl font-semibold leading-[1.35] tracking-normal text-landing-white">
          {title}
        </h3>
        <p className="mt-2.5 max-w-[31rem] text-base leading-[1.45] tracking-normal text-landing-muted">
          {description}
        </p>
        {children}
      </div>
    </article>
  );
}
