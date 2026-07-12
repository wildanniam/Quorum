import { cloneElement, isValidElement, type HTMLAttributes, type ReactElement } from "react";
import type React from "react";
import type { LucideIcon } from "lucide-react";
export { productInputClassName } from "@/components/ui/form-primitives";
import { cn } from "@/lib/ui";

type CompactPageHeaderProps = {
  actions?: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  icon?: LucideIcon;
  meta?: React.ReactNode;
  title: React.ReactNode;
};

export function CompactPageHeader({
  actions,
  className,
  description,
  eyebrow,
  icon: Icon,
  meta,
  title,
}: CompactPageHeaderProps) {
  return (
    <header
      className={cn(
        "grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-quorum-cyan-soft">
            {Icon ? <Icon size={14} strokeWidth={1.9} /> : null}
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 max-w-3xl font-product text-3xl font-medium leading-[1.1] text-foreground text-balance sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted text-pretty">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-4">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3 lg:justify-end">{actions}</div> : null}
    </header>
  );
}

type ProductSectionProps = {
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
};

export function ProductSection({
  actions,
  children,
  className,
  description,
  eyebrow,
  title,
}: ProductSectionProps) {
  return (
    <section className={cn("border-t border-white/10 pt-6", className)}>
      {title || description || eyebrow || actions ? (
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-quorum-cyan-soft">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-2 font-product text-xl font-medium leading-tight text-foreground sm:text-2xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

type TaskPanelProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "muted" | "ready";
};

const taskPanelTone: Record<NonNullable<TaskPanelProps["tone"]>, string> = {
  default: "border-white/10 bg-white/[0.035]",
  muted: "border-white/10 bg-background/45",
  ready: "border-quorum-cyan/30 bg-quorum-cyan/[0.07]",
};

export function TaskPanel({ children, className, tone = "default" }: TaskPanelProps) {
  return (
    <div
      className={cn(
        "rounded-[8px] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]",
        taskPanelTone[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}

type DataRowProps = {
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  detail?: React.ReactNode;
  icon?: LucideIcon;
  label: React.ReactNode;
  value?: React.ReactNode;
};

export function DataRow({
  action,
  children,
  className,
  detail,
  icon: Icon,
  label,
  value,
}: DataRowProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/10 py-3 last:border-b-0",
        className,
      )}
    >
      {Icon ? <Icon className="shrink-0 text-quorum-cyan-soft" size={16} strokeWidth={1.9} /> : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {detail ? <p className="mt-1 text-xs leading-5 text-muted">{detail}</p> : null}
        {children}
      </div>
      {value ? <div className="shrink-0 text-sm text-foreground">{value}</div> : null}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type FormFieldProps = {
  children: React.ReactNode;
  className?: string;
  description?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor: string;
  label: React.ReactNode;
  required?: boolean;
};

export function FormField({
  children,
  className,
  description,
  error,
  htmlFor,
  label,
  required = false,
}: FormFieldProps) {
  const descriptionId = description ? `${htmlFor}-description` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement<HTMLAttributes<HTMLElement>>(children)
    ? cloneElement(children as ReactElement<HTMLAttributes<HTMLElement>>, {
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        id: htmlFor,
      })
    : children;

  return (
    <div className={cn("grid gap-2", className)}>
      <label className="text-sm font-medium text-foreground" htmlFor={htmlFor}>
        {label}
        {required ? <span aria-hidden="true" className="ml-1 text-quorum-cyan-soft">*</span> : null}
      </label>
      {description ? (
        <p className="-mt-1 text-xs leading-5 text-muted" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {control}
      {error ? (
        <p className="text-xs leading-5 text-coral" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type FieldMessageProps = {
  children: React.ReactNode;
  tone?: "default" | "error" | "success" | "warning";
};

const fieldMessageTone: Record<NonNullable<FieldMessageProps["tone"]>, string> = {
  default: "border-white/10 bg-white/[0.035] text-muted",
  error: "border-coral/35 bg-coral/10 text-coral",
  success: "border-success/35 bg-success/10 text-success",
  warning: "border-amber/35 bg-amber/10 text-amber",
};

export function FieldMessage({ children, tone = "default" }: FieldMessageProps) {
  return (
    <p className={cn("rounded-[6px] border px-3 py-2 text-xs leading-5", fieldMessageTone[tone])}>
      {children}
    </p>
  );
}

type StickyActionBarProps = {
  children: React.ReactNode;
  className?: string;
};

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-3 z-10 -mx-1 border-t border-white/10 bg-[#0c0b0b]/92 px-1 pt-3 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-end gap-3">{children}</div>
    </div>
  );
}
