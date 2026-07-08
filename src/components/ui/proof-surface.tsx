import type React from "react";
import { cn } from "@/lib/ui";

type ProofSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  variant?: "compact" | "default" | "hero" | "table";
};

const variantClassName: Record<NonNullable<ProofSurfaceProps["variant"]>, string> = {
  compact: "rounded-[10px] p-4",
  default: "rounded-[12px] p-5",
  hero: "rounded-[12px] p-5 lg:p-6",
  table: "overflow-hidden rounded-[12px] p-0",
};

export function ProofSurface({
  children,
  className,
  elevated = false,
  variant = "default",
}: ProofSurfaceProps) {
  return (
    <div
      className={cn(
        "border border-white/10 bg-quorum-grey-700/76 text-foreground backdrop-blur-xl",
        variantClassName[variant],
        elevated &&
          "shadow-[0_24px_90px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
