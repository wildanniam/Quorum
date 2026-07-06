import type React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui";

type StatusPillTone = "accent" | "cyan" | "danger" | "muted" | "success" | "warning";

type StatusPillProps = {
  children: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  tone?: StatusPillTone;
};

const toneClassName: Record<StatusPillTone, string> = {
  accent: "border-accent/45 bg-accent/10 text-accent",
  cyan: "border-quorum-cyan/50 bg-quorum-cyan/12 text-quorum-cyan-soft",
  danger: "border-coral/55 bg-coral/10 text-coral",
  muted: "border-foreground/10 bg-foreground/[0.045] text-muted",
  success: "border-success/50 bg-success/10 text-success",
  warning: "border-amber/50 bg-amber/10 text-amber",
};

export function StatusPill({
  children,
  className,
  icon: Icon,
  tone = "cyan",
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 w-fit items-center gap-2 rounded-full border px-3 font-product text-xs font-medium leading-[1.4]",
        toneClassName[tone],
        className,
      )}
    >
      {Icon ? <Icon size={14} /> : null}
      {children}
    </span>
  );
}
