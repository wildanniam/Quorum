import Link from "next/link";
import type React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui";

type QuorumButtonVariant = "danger" | "ghost" | "primary" | "secondary" | "subtle";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  variant?: QuorumButtonVariant;
};

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkProps = BaseProps & {
  href: string;
  target?: string;
};

const variantClassName: Record<QuorumButtonVariant, string> = {
  danger:
    "border-coral/55 bg-coral/12 text-coral shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-coral hover:bg-coral/18 hover:text-foreground",
  ghost:
    "border-transparent bg-transparent text-quorum-cyan hover:bg-quorum-cyan/10 hover:text-foreground",
  primary:
    "border-quorum-cyan bg-quorum-cyan/20 text-foreground shadow-[inset_-4px_4px_12px_rgba(38,198,218,0.34),0_0_28px_rgba(38,198,218,0.18)] hover:border-quorum-cyan-soft hover:bg-quorum-cyan/28",
  secondary:
    "border-white/45 bg-quorum-grey-600/40 text-foreground shadow-[0_0_12px_rgba(255,255,255,0.12)] hover:border-white/70 hover:bg-quorum-grey-600/70",
  subtle:
    "border-white/10 bg-white/[0.045] text-muted hover:border-quorum-cyan/45 hover:bg-quorum-cyan/10 hover:text-quorum-cyan-soft",
};

const baseClassName =
  "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border px-6 text-sm font-medium leading-[1.4] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-quorum-cyan active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100";

export function QuorumButton(props: ButtonProps | LinkProps) {
  if (typeof props.href === "string") {
    const {
      children,
      className,
      href,
      icon = <ArrowRight size={17} />,
      target,
      variant = "primary",
    } = props;
    const composedClassName = cn(
      baseClassName,
      variantClassName[variant],
      className,
    );

    return (
      <Link className={composedClassName} href={href} target={target}>
        {children}
        {icon}
      </Link>
    );
  }

  const {
    children,
    className,
    icon = <ArrowRight size={17} />,
    type = "button",
    variant = "primary",
    ...buttonProps
  } = props;
  const composedClassName = cn(baseClassName, variantClassName[variant], className);

  return (
    <button {...buttonProps} className={composedClassName} type={type}>
      {children}
      {icon}
    </button>
  );
}
