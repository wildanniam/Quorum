import Link from "next/link";
import type React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui";

type LandingButtonVariant = "primary" | "secondary" | "ghost";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  variant?: LandingButtonVariant;
};

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkProps = BaseProps & {
  href: string;
  target?: string;
};

const baseClassName =
  "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border px-6 font-product text-sm font-semibold leading-[1.4] transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55";

const variantClassName: Record<LandingButtonVariant, string> = {
  ghost:
    "border-transparent bg-transparent text-landing-muted hover:text-landing-white",
  primary:
    "border-landing-cyan/60 bg-landing-cyan/18 text-landing-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_34px_rgba(38,198,218,0.16)] hover:border-landing-cyan-soft hover:bg-landing-cyan/28",
  secondary:
    "border-white/42 bg-white/[0.025] text-landing-white hover:border-landing-cyan/55 hover:text-landing-cyan-soft",
};

export function LandingButton(props: ButtonProps | LinkProps) {
  if (typeof props.href === "string") {
    const {
      children,
      className,
      href,
      icon = <ArrowRight size={16} />,
      target,
      variant = "primary",
    } = props;

    return (
      <Link
        className={cn(baseClassName, variantClassName[variant], className)}
        href={href}
        target={target}
      >
        {children}
        {icon}
      </Link>
    );
  }

  const {
    children,
    className,
    icon = <ArrowRight size={16} />,
    type = "button",
    variant = "primary",
    ...buttonProps
  } = props;

  return (
    <button
      {...buttonProps}
      className={cn(baseClassName, variantClassName[variant], className)}
      type={type}
    >
      {children}
      {icon}
    </button>
  );
}
