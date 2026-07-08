"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  PanelTop,
  PlusCircle,
  RadioTower,
  TicketCheck,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  match: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/discover",
    icon: Compass,
    label: "Discover",
    match: (pathname) =>
      pathname === "/discover" || pathname.startsWith("/events/"),
  },
  {
    href: "/dashboard",
    icon: PanelTop,
    label: "Studio",
    match: (pathname) =>
      pathname === "/dashboard" ||
      (pathname.startsWith("/dashboard/") &&
        !pathname.startsWith("/dashboard/events/new")),
  },
  {
    href: "/dashboard/events/new",
    icon: PlusCircle,
    label: "Create",
    match: (pathname) => pathname.startsWith("/dashboard/events/new"),
  },
  {
    href: "/passes",
    icon: TicketCheck,
    label: "Passes",
    match: (pathname) => pathname.startsWith("/passes"),
  },
  {
    href: "/evidence",
    icon: RadioTower,
    label: "Evidence",
    match: (pathname) =>
      pathname.startsWith("/evidence") || pathname.endsWith("/proof"),
  },
];

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function DesktopNavigation() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Primary navigation"
      className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.045] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl md:flex"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex min-h-9 items-center gap-2 overflow-hidden rounded-full px-3.5 text-sm font-medium transition",
              active
                ? "text-foreground"
                : "text-muted hover:bg-quorum-cyan/10 hover:text-foreground",
            )}
            href={item.href}
            key={item.href}
          >
            {active ? (
              <motion.span
                className="absolute inset-0 rounded-full border border-quorum-cyan/30 bg-quorum-cyan/12 shadow-[0_0_24px_rgba(38,198,218,0.12)]"
                layoutId="desktop-nav-active"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
                }
              />
            ) : null}
            <span className="relative inline-flex items-center gap-2">
              <Icon
                className={active ? "text-quorum-cyan-soft" : undefined}
                size={15}
                strokeWidth={1.9}
              />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Mobile navigation"
      className="sticky top-[5.75rem] z-10 mx-3 mt-3 grid grid-cols-5 gap-1 rounded-full border border-white/10 bg-[#0c0b0b]/88 p-1.5 shadow-[0_18px_70px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:hidden"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative grid min-h-12 place-items-center gap-0.5 overflow-hidden rounded-full px-1 text-[11px] font-semibold transition",
              active
                ? "text-foreground"
                : "text-muted hover:bg-quorum-cyan/10 hover:text-foreground",
            )}
            href={item.href}
            key={item.href}
          >
            {active ? (
              <motion.span
                className="absolute inset-0 rounded-full border border-quorum-cyan/30 bg-quorum-cyan/12"
                layoutId="mobile-nav-active"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.24, ease: [0.16, 1, 0.3, 1] }
                }
              />
            ) : null}
            <Icon
              className={cn("relative", active && "text-quorum-cyan-soft")}
              size={17}
              strokeWidth={1.9}
            />
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
