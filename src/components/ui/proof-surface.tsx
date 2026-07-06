import type React from "react";
import { cn } from "@/lib/ui";

type ProofSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
};

export function ProofSurface({
  children,
  className,
  elevated = false,
}: ProofSurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-white/10 bg-quorum-grey-700/76 p-5 text-foreground backdrop-blur-xl",
        elevated &&
          "shadow-[0_24px_90px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.05)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
