"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  PlusCircle,
  TicketCheck,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  match: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/",
    icon: Compass,
    label: "Discover",
    match: (pathname) => pathname === "/" || pathname.startsWith("/events/"),
  },
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Console",
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
];

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function DesktopNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="hidden items-center gap-1 rounded-[8px] border border-line/70 bg-panel/54 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl md:flex"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-[6px] px-3 text-sm font-medium transition",
              active
                ? "bg-foreground shadow-[0_8px_30px_rgba(247,242,232,0.12)]"
                : "text-muted hover:bg-foreground/10 hover:text-foreground",
            )}
            href={item.href}
            key={item.href}
            style={active ? { color: "var(--accent-ink)" } : undefined}
          >
            <Icon size={15} strokeWidth={1.9} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="sticky top-[4.1rem] z-10 mx-3 mt-3 grid grid-cols-4 gap-1 rounded-[8px] border border-line/80 bg-background/88 p-1 shadow-[0_18px_60px_rgba(0,0,0,0.26)] backdrop-blur-xl md:hidden"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.match(pathname);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "grid min-h-12 place-items-center gap-0.5 rounded-[6px] px-1 text-[11px] font-medium transition",
              active
                ? "bg-foreground"
                : "text-muted hover:bg-foreground/10 hover:text-foreground",
            )}
            href={item.href}
            key={item.href}
            style={active ? { color: "var(--accent-ink)" } : undefined}
          >
            <Icon size={17} strokeWidth={1.9} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
