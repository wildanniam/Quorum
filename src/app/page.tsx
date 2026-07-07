import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  ReceiptText,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { HeroOrbit } from "@/components/landing/hero-orbit";
import { LandingButton } from "@/components/landing/landing-button";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingSection } from "@/components/landing/landing-section";
import { LogoStrip } from "@/components/landing/logo-strip";
import { RevenueSplitPreview } from "@/components/landing/revenue-split-preview";
import { SectionLabel } from "@/components/landing/section-label";

const workflowSteps = [
  {
    description:
      "Set who gets paid, what percentage they receive, and why they are part of the event.",
    icon: UsersRound,
    title: "Configure revenue split",
  },
  {
    description:
      "Every checkout routes the paid event revenue through the split you defined up front.",
    icon: CircleDollarSign,
    title: "Sell access with shared payouts",
  },
  {
    description:
      "Keep a clean settlement trail for organizers, speakers, venues, and partners.",
    icon: ReceiptText,
    title: "Track every settlement",
  },
];

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

        <LandingSection className="pb-10 sm:pb-16" id="about">
          <div className="mx-auto max-w-5xl">
            <SectionLabel>About Us</SectionLabel>
            <p className="mt-8 font-product text-[clamp(2rem,4.4vw,4.75rem)] font-semibold leading-[1.08] tracking-normal text-landing-white text-balance">
              Quorum is the collaborative checkout layer for Web3 community
              events.{" "}
              <span className="text-landing-muted">
                Every ticket payment can be split among collaborators through
                one clear checkout.
              </span>
            </p>
          </div>
        </LandingSection>

        <LandingSection
          align="left"
          className="pt-10 sm:pt-16"
          eyebrow="How It Works"
          id="how-it-works"
          intro="From creating your event to automatically splitting payouts and verifying attendance."
          title="Run your event in three simple steps"
        >
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-18">
            <RevenueSplitPreview
              className="mx-auto w-full max-w-[32rem]"
              rows={[
                {
                  avatar: "ST",
                  name: "Steven",
                  role: "Hackathon Organizer",
                  share: "25%",
                },
                {
                  avatar: "SA",
                  name: "Sarah",
                  role: "Community Lead",
                  share: "60%",
                },
                {
                  avatar: "SI",
                  name: "Stellar ID",
                  role: "Partner",
                  share: "15%",
                },
              ]}
            />

            <ol className="relative ml-10 space-y-7 border-l border-white/12 pl-8 sm:ml-0">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <li className="relative" key={step.title}>
                    <span className="absolute -left-[2.5rem] top-0 grid h-8 w-8 place-items-center rounded-full border border-landing-cyan/35 bg-landing-cyan/14 font-mono text-xs text-landing-cyan-soft sm:-left-[3.05rem]">
                      {index + 1}
                    </span>
                    <div className="flex items-start gap-4">
                      <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-landing-cyan-soft">
                        <Icon size={18} />
                      </div>
                      <div>
                        <h3 className="font-product text-xl font-semibold leading-tight text-landing-white">
                          {step.title}
                        </h3>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-landing-muted">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-8 lg:justify-start">
            {[
              "Transparent collaborator shares",
              "Wallet-verifiable passes",
              "Settlement evidence for every event",
            ].map((item) => (
              <span className="landing-pill" key={item}>
                <BadgeCheck size={16} className="text-landing-cyan-soft" />
                {item}
              </span>
            ))}
          </div>
        </LandingSection>
      </main>
    </div>
  );
}
