import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { HeroOrbit } from "@/components/landing/hero-orbit";
import { LandingButton } from "@/components/landing/landing-button";
import { LandingHeader } from "@/components/landing/landing-header";
import { LogoStrip } from "@/components/landing/logo-strip";

export default function LandingPage() {
  return (
    <div className="landing-shell">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-landing-cyan focus:px-4 focus:py-2 focus:font-product focus:text-sm focus:font-semibold focus:text-black"
        href="#main-content"
      >
        Skip to content
      </a>

      <LandingHeader />

      <main id="main-content">
        <section className="relative overflow-hidden border-b border-white/8">
          <div className="landing-container relative z-10 flex min-h-[calc(100svh-5.75rem)] flex-col items-center justify-center pb-36 pt-14 text-center sm:pb-44 sm:pt-18 lg:pb-48 lg:pt-20">
            <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-white/[0.025] px-5 font-product text-xs font-semibold text-landing-white/82 shadow-[0_0_40px_rgba(38,198,218,0.08)]">
              <Sparkles size={14} className="text-landing-cyan-soft" />
              Powered by Stellar
            </div>

            <h1 className="mt-8 max-w-6xl font-product text-[clamp(3rem,5.45vw,5.75rem)] font-semibold leading-[0.98] tracking-normal text-landing-white text-balance">
              Where Web3 Events{" "}
              <span className="landing-cyan-text">Pay Every</span>{" "}
              Collaborator Seamlessly
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-base leading-7 text-landing-muted sm:text-lg">
              From selling event access to instant payouts, Quorum unifies every
              payment workflow into one checkout built for community events.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <LandingButton href="#features" variant="secondary">
                Explore Features
              </LandingButton>
              <LandingButton href="/dashboard/events/new">
                Get Started
              </LandingButton>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 font-product text-xs font-semibold text-landing-muted">
              <ArrowDown size={14} className="text-landing-cyan-soft" />
              Follow the settlement path
              <ArrowRight size={14} className="text-landing-cyan-soft" />
            </div>

          </div>

          <HeroOrbit
            className="bottom-[-2.75rem] left-0 right-0 z-0 h-[230px] sm:h-[270px] lg:h-[320px]"
            mode="background"
          />
        </section>

        <LogoStrip />
      </main>
    </div>
  );
}
