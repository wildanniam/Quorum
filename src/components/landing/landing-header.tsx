"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LandingButton } from "@/components/landing/landing-button";
import { LandingLogo } from "@/components/landing/landing-logo";
import { cn } from "@/lib/ui";

const navItems = [
  { href: "/", label: "Home" },
  { href: "#about", label: "About Us" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#testimonial", label: "Testimonial" },
  { href: "#faq", label: "FAQ" },
];

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScrolledState = () => {
      setIsScrolled(window.scrollY > 12);
    };

    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrolledState);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-30 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out",
        isScrolled
          ? "border-white/10 bg-[#0c0b0b]/62 shadow-[0_18px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
          : "border-transparent bg-transparent shadow-none backdrop-blur-none",
      )}
    >
      <div className="landing-container flex min-h-[6.375rem] items-center justify-between gap-4">
        <LandingLogo imageClassName="h-9 sm:h-10" />

        <nav
          aria-label="Landing"
          className="hidden items-center gap-8 font-product text-sm font-medium text-landing-white/86 lg:flex xl:gap-10"
        >
          {navItems.map((item) => (
            <Link
              className="transition hover:text-landing-cyan-soft"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LandingButton
            className="min-h-[46px] px-5 text-sm"
            href="/dashboard/events/new"
            icon={null}
            variant="secondary"
          >
            Start Splitting
          </LandingButton>
        </div>
      </div>
    </header>
  );
}
