import Link from "next/link";
import { LandingButton } from "@/components/landing/landing-button";
import { LandingLogo } from "@/components/landing/landing-logo";

const navItems = [
  { href: "#about", label: "About Us" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#testimonial", label: "Testimonial" },
  { href: "#faq", label: "FAQ" },
];

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-landing-bg/78 backdrop-blur-2xl">
      <div className="landing-container flex min-h-[5.75rem] items-center justify-between gap-4">
        <LandingLogo className="text-[1.05rem] sm:text-[1.15rem]" markClassName="h-6 w-6" />

        <nav
          aria-label="Landing"
          className="hidden items-center gap-9 font-product text-xs font-semibold text-landing-white/78 lg:flex"
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
          <Link
            className="hidden font-product text-xs font-semibold text-landing-white/76 transition hover:text-landing-cyan-soft sm:inline-flex"
            href="/discover"
          >
            Discover
          </Link>
          <LandingButton
            className="min-h-10 px-4 text-xs sm:px-5"
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
