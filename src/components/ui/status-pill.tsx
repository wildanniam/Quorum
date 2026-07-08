import type React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/ui";

type StatusPillTone =
  | "accent"
  | "blocked"
  | "cyan"
  | "danger"
  | "live"
  | "local"
  | "muted"
  | "pending"
  | "ready"
  | "success"
  | "warning";

type StatusPillProps = {
  children: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  tone?: StatusPillTone;
};

const toneClassName: Record<StatusPillTone, string> = {
  accent: "border-quorum-cyan/45 bg-quorum-cyan/10 text-quorum-cyan-soft",
  blocked: "border-coral/55 bg-coral/10 text-coral",
  cyan: "border-quorum-cyan/50 bg-quorum-cyan/12 text-quorum-cyan-soft",
  danger: "border-coral/55 bg-coral/10 text-coral",
  live: "border-success/50 bg-success/10 text-success",
  local: "border-quorum-cyan/35 bg-quorum-cyan/10 text-quorum-cyan-soft",
  muted: "border-foreground/10 bg-foreground/[0.045] text-muted",
  pending: "border-foreground/10 bg-foreground/[0.045] text-muted",
  ready: "border-quorum-cyan/50 bg-quorum-cyan/12 text-quorum-cyan-soft",
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
