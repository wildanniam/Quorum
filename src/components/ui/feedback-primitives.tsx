import type React from "react";
import {
  CheckCircle2,
  CircleAlert,
  Info,
  LoaderCircle,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/ui";

type SpinnerProps = {
  className?: string;
  label?: string;
  size?: number;
};

export function Spinner({ className, label = "Loading", size = 16 }: SpinnerProps) {
  return (
    <span aria-label={label} className={cn("inline-flex shrink-0", className)} role="status">
      <LoaderCircle aria-hidden="true" className="animate-spin motion-reduce:animate-none" size={size} />
    </span>
  );
}

type SkeletonProps = {
  className?: string;
  label?: string;
};

export function Skeleton({ className, label = "Loading" }: SkeletonProps) {
  return (
    <span
      aria-busy="true"
      aria-label={label}
      className={cn(
        "block animate-pulse rounded-[6px] bg-white/10 motion-reduce:animate-none",
        className,
      )}
      role="status"
    />
  );
}

type AlertTone = "danger" | "info" | "success" | "warning";

type AlertProps = {
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  title: React.ReactNode;
  tone?: AlertTone;
};

const alertToneClassName: Record<AlertTone, string> = {
  danger: "border-coral/45 bg-coral/10 text-coral",
  info: "border-quorum-cyan/35 bg-quorum-cyan/[0.08] text-quorum-cyan-soft",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-amber/45 bg-amber/10 text-amber",
};

const alertToneIcon: Record<AlertTone, LucideIcon> = {
  danger: CircleAlert,
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
};

export function Alert({
  action,
  children,
  className,
  icon,
  title,
  tone = "info",
}: AlertProps) {
  const Icon = icon ?? alertToneIcon[tone];

  return (
    <div
      aria-live={tone === "danger" ? "assertive" : "polite"}
      className={cn(
        "flex flex-col gap-3 rounded-[8px] border p-4 text-sm leading-6 sm:flex-row sm:items-start",
        alertToneClassName[tone],
        className,
      )}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="mt-0.5 shrink-0" size={18} strokeWidth={1.9} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{title}</p>
        {children ? <div className="mt-1 text-muted">{children}</div> : null}
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </div>
  );
}
