import type React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui";

type FeatureCardProps = {
  children?: React.ReactNode;
  className?: string;
  description: string;
  icon?: LucideIcon;
  title: string;
  visual?: React.ReactNode;
};

export function FeatureCard({
  children,
  className,
  description,
  icon: Icon,
  title,
  visual,
}: FeatureCardProps) {
  return (
    <article
      className={cn("landing-card overflow-hidden", className)}
      data-landing-hover="true"
    >
      {visual ? (
        <div className="min-h-40 border-b border-white/8 bg-black/20">
          {visual}
        </div>
      ) : null}
      <div className="p-6">
        {Icon ? (
          <div className="mb-5 grid h-10 w-10 place-items-center rounded-full border border-landing-cyan/32 bg-landing-cyan/10 text-landing-cyan-soft">
            <Icon size={18} />
          </div>
        ) : null}
        <h3 className="font-product text-xl font-semibold leading-tight text-landing-white">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-landing-muted">{description}</p>
        {children}
      </div>
    </article>
  );
}
