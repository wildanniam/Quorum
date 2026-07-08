import Image from "next/image";
import Link from "next/link";
import type React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, WalletCards } from "lucide-react";
import { cn } from "@/lib/ui";

type ProductMarkProps = {
  className?: string;
  href?: string;
  imageClassName?: string;
};

export function ProductMark({
  className,
  href = "/",
  imageClassName,
}: ProductMarkProps) {
  return (
    <Link
      aria-label="Quorum home"
      className={cn(
        "inline-flex min-w-0 items-center rounded-[8px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-quorum-cyan",
        className,
      )}
      href={href}
    >
      <Image
        alt=""
        className={cn("h-9 w-auto select-none", imageClassName)}
        height={40}
        priority
        src="/figma/landing/quorum-logo.svg"
        width={161}
      />
    </Link>
  );
}

type ProductPageProps = {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "content" | "wide";
  spacing?: "compact" | "default" | "loose";
};

const pageWidthClassName: Record<NonNullable<ProductPageProps["maxWidth"]>, string> = {
  content: "max-w-5xl",
  wide: "max-w-7xl",
};

const pageSpacingClassName: Record<NonNullable<ProductPageProps["spacing"]>, string> = {
  compact: "py-8 lg:py-10",
  default: "py-10 lg:py-14",
  loose: "py-12 lg:py-16",
};

export function ProductPage({
  children,
  className,
  maxWidth = "wide",
  spacing = "default",
}: ProductPageProps) {
  return (
    <section
      className={cn(
        "mx-auto w-full px-5 lg:px-8",
        pageWidthClassName[maxWidth],
        pageSpacingClassName[spacing],
        className,
      )}
    >
      {children}
    </section>
  );
}

type HeaderAction = React.ReactNode;

type ProductPageHeaderProps = {
  actions?: HeaderAction;
  children?: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  icon?: LucideIcon;
  meta?: React.ReactNode;
  title: React.ReactNode;
};

export function ProductPageHeader({
  actions,
  children,
  className,
  description,
  eyebrow,
  icon: Icon,
  meta,
  title,
}: ProductPageHeaderProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl lg:p-6",
        className,
      )}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-quorum-cyan/45 bg-quorum-cyan/10 px-3 font-product text-xs font-semibold uppercase leading-[1.4] tracking-[0.08em] text-quorum-cyan-soft">
              {Icon ? <Icon size={14} /> : null}
              {eyebrow}
            </div>
          ) : null}
          <h1 className="mt-5 max-w-4xl font-product text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-normal text-foreground text-balance">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted text-pretty">
              {description}
            </p>
          ) : null}
          {meta ? <div className="mt-4">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}

type SectionHeaderProps = {
  actions?: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
};

export function SectionHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-2 font-product text-3xl font-medium leading-tight tracking-normal text-foreground text-balance">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

type MetricTileTone = "cyan" | "danger" | "muted" | "success" | "warning";

type MetricTileProps = {
  className?: string;
  detail?: React.ReactNode;
  icon?: LucideIcon;
  label: React.ReactNode;
  tone?: MetricTileTone;
  value: React.ReactNode;
};

const metricToneClassName: Record<MetricTileTone, string> = {
  cyan: "text-quorum-cyan-soft",
  danger: "text-coral",
  muted: "text-muted",
  success: "text-success",
  warning: "text-amber",
};

export function MetricTile({
  className,
  detail,
  icon: Icon,
  label,
  tone = "cyan",
  value,
}: MetricTileProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        className,
      )}
    >
      {Icon ? <Icon className={metricToneClassName[tone]} size={18} /> : null}
      <p
        className={cn(
          "mt-4 break-words font-mono text-2xl leading-tight",
          metricToneClassName[tone],
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-sm text-muted">{label}</p>
      {detail ? <p className="mt-2 text-xs leading-5 text-muted">{detail}</p> : null}
    </div>
  );
}

type EmptyStateProps = {
  action?: React.ReactNode;
  className?: string;
  description: React.ReactNode;
  icon?: LucideIcon;
  title: React.ReactNode;
};

export function EmptyState({
  action,
  className,
  description,
  icon: Icon,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-white/10 bg-white/[0.04] p-6 text-pretty",
        className,
      )}
    >
      {Icon ? <Icon className="text-quorum-cyan-soft" size={24} /> : null}
      <h2 className="mt-4 font-product text-2xl font-medium tracking-normal">
        {title}
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

type WalletGateProps = {
  action?: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  title?: React.ReactNode;
};

export function WalletGate({
  action,
  className,
  description = "Connect the relevant wallet to resolve ownership, access, and proof records for this page.",
  title = "Wallet session required",
}: WalletGateProps) {
  return (
    <EmptyState
      action={
        action ?? (
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-quorum-cyan/45 bg-quorum-cyan/12 px-4 text-sm font-semibold text-foreground transition hover:border-quorum-cyan-soft hover:bg-quorum-cyan/18"
            href="/discover"
          >
            Browse events <ArrowRight size={15} />
          </Link>
        )
      }
      className={className}
      description={description}
      icon={WalletCards}
      title={title}
    />
  );
}
