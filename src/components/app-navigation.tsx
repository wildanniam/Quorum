"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  PanelTop,
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
    match: (pathname) => pathname === "/dashboard" || pathname.startsWith("/dashboard/"),
  },
  {
    href: "/passes",
    icon: TicketCheck,
    label: "Passes",
    match: (pathname) => pathname.startsWith("/passes"),
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
      className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.045] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl lg:flex"
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

export function EvidenceUtilityLink() {
  const pathname = usePathname();
  const active = pathname.startsWith("/evidence") || pathname.endsWith("/proof");

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "hidden min-h-10 items-center gap-2 rounded-full px-3 text-sm font-medium transition lg:inline-flex",
        active
          ? "bg-quorum-cyan/10 text-quorum-cyan-soft"
          : "text-muted hover:bg-white/[0.045] hover:text-foreground",
      )}
      href="/evidence"
    >
      <RadioTower size={15} strokeWidth={1.9} />
      Evidence
    </Link>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 gap-1 rounded-[12px] border border-white/10 bg-[#0c0b0b]/92 p-1.5 shadow-[0_18px_70px_rgba(0,0,0,0.36)] backdrop-blur-2xl lg:hidden"
    >
      {[...navItems, {
        href: "/evidence",
        icon: RadioTower,
        label: "Evidence",
        match: (currentPathname: string) =>
          currentPathname.startsWith("/evidence") || currentPathname.endsWith("/proof"),
      }].map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative grid min-h-12 place-items-center gap-0.5 overflow-hidden rounded-[8px] px-1 text-[11px] font-semibold transition",
              active
                ? "text-foreground"
                : "text-muted hover:bg-quorum-cyan/10 hover:text-foreground",
            )}
            href={item.href}
            key={item.href}
          >
            {active ? (
              <motion.span
                className="absolute inset-0 rounded-[8px] border border-quorum-cyan/30 bg-quorum-cyan/12"
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
