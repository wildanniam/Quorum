import {
  ShieldCheck,
} from "lucide-react";
import { FAQAccordion, type FAQItem } from "@/components/landing/faq-accordion";
import { FeatureCard } from "@/components/landing/feature-card";
import {
  CheckoutOrbitVisual,
  LedgerTableVisual,
  PassVisual,
  SplitRailVisual,
} from "@/components/landing/feature-visuals";
import { HeroOrbit } from "@/components/landing/hero-orbit";
import { HowItWorksInteractive } from "@/components/landing/how-it-works-interactive";
import { LandingButton } from "@/components/landing/landing-button";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingLogo } from "@/components/landing/landing-logo";
import { LandingSection } from "@/components/landing/landing-section";
import { LogoStrip } from "@/components/landing/logo-strip";
import { SectionLabel } from "@/components/landing/section-label";
import { StellarBadge } from "@/components/landing/stellar-badge";
import {
  TestimonialCarousel,
  type Testimonial,
} from "@/components/landing/testimonial-carousel";

const workflowSteps = [
  {
    description:
      "Define how ticket revenue should be distributed among organizers, speakers, partners, or any collaborators before your event goes live.",
    title: "Configure Revenue Split",
  },
  {
    description:
      "Every ticket purchase instantly distributes funds to each collaborator's wallet according to the predefined split rules.",
    title: "Automatic Settlement",
  },
  {
    description:
      "Monitor every completed payout with a transparent on-chain ledger, giving every collaborator verifiable proof of settlement.",
    title: "Track Every Settlement",
  },
];

const features = [
  {
    description:
      "Automatically distribute every ticket purchase to every stakeholder based on predefined revenue rules, no manual transfers required.",
    title: "Automatic Revenue Split",
    visual: <SplitRailVisual />,
  },
  {
    description:
      "Create paid community events with a single checkout experience that supports multiple stakeholders from the very beginning.",
    title: "Collaborative Event Checkout",
    visual: <CheckoutOrbitVisual />,
  },
  {
    description:
      "Track every payment with an on-chain settlement history, giving organizers and collaborators a shared record of every payout.",
    title: "Transparent Settlement Ledger",
    visual: <LedgerTableVisual />,
  },
  {
    description:
      "Every successful purchase instantly issues a wallet-verifiable event pass for secure check-ins and exclusive event access.",
    title: "Wallet-Verifiable Event Pass",
    visual: <PassVisual />,
  },
];

const testimonials: Testimonial[] = [
  {
    avatar: "/figma/landing/john-avatar.webp",
    name: "Steven",
    quote: "Quorum saved us hours of manual payout work.",
    role: "Hackathon Organizer | Indonesia",
  },
  {
    avatar: "/figma/landing/john-avatar.webp",
    name: "John Doe",
    quote: "I can finally see my payout without asking the organizer.",
    role: "Web3 Speaker | Philippines",
  },
  {
    avatar: "/figma/landing/john-avatar.webp",
    name: "Kevin T.",
    quote: "Buying a ticket and getting my pass felt effortless.",
    role: "Hackathon Participant | Australia",
  },
];

const faqItems: FAQItem[] = [
  {
    answer:
      "Quorum automatically distributes every ticket payment based on the revenue split you define when creating your event. Organizers, speakers, and partners receive their respective shares without manual transfers.",
    question: "How does Quorum split payments?",
  },
  {
    answer:
      "For the wallet-native flow, attendees connect a Stellar-compatible wallet so the pass and payment proof can be verified. The product can still explain the flow in plain checkout language.",
    question: "Do attendees need a crypto wallet?",
  },
  {
    answer:
      "Quorum is best for paid meetups, workshops, hackathons, community dinners, side events, and partner-led events where several people or teams share revenue.",
    question: "What types of events can I host?",
  },
  {
    answer:
      "Quorum is built on Stellar testnet for the hackathon demo, using wallet approval, USDC-style settlement flows, and Soroban-ready proof surfaces.",
    question: "What blockchain does Quorum use?",
  },
  {
    answer:
      "Yes. Organizers can define collaborator shares before publishing the event, then use the same split as the settlement source of truth.",
    question: "Can I customize the revenue split?",
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
        <section className="landing-hero relative isolate overflow-hidden bg-[#0c0b0b]">
          <div className="landing-container relative z-10 flex min-h-[calc(760px+6.375rem)] flex-col items-center pb-64 pt-[calc(6.375rem+3rem)] text-center sm:min-h-[calc(811px+6.375rem)] sm:pb-72 sm:pt-[calc(6.375rem+54px)]">
            <StellarBadge className="landing-reveal" />

            <h1
              className="landing-reveal mt-11 max-w-[55.45rem] bg-[linear-gradient(90deg,#fff_29%,#9be5ee_100%)] bg-clip-text font-product text-[clamp(2.8rem,8.4vw,4rem)] font-medium leading-[1.4] tracking-normal text-transparent text-balance sm:text-[clamp(3rem,8.4vw,4rem)]"
              style={{ "--landing-reveal-delay": "90ms" } as React.CSSProperties}
            >
              Where Web3 Events Pay Every Collaborator Seamlessly
            </h1>

            <p
              className="landing-reveal mx-auto mt-7 max-w-4xl text-sm leading-6 text-landing-white/88 sm:text-base"
              style={{ "--landing-reveal-delay": "160ms" } as React.CSSProperties}
            >
              From selling event access to instant payouts, Quorum unifies every
              payment workflow into one seamless checkout.
            </p>

            <div
              className="landing-reveal mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ "--landing-reveal-delay": "230ms" } as React.CSSProperties}
            >
              <LandingButton href="#features" variant="secondary">
                Explore Features
              </LandingButton>
              <LandingButton href="/dashboard/events/new">
                Get Started
              </LandingButton>
            </div>
          </div>

          <HeroOrbit
            className="inset-0 z-0"
            mode="background"
          />
        </section>

        <LogoStrip />

        <LandingSection className="pb-24 pt-[7.5rem] sm:pb-[6.25rem]" id="about">
          <div>
            <SectionLabel>About Us</SectionLabel>
            <p className="mt-6 max-w-[75rem] font-product text-[clamp(1.9rem,2.78vw,2.5rem)] font-normal leading-[1.4] tracking-normal text-landing-white text-balance">
              Quorum is the collaborative checkout layer for Web3 community
              events.{" "}
              <span className="text-landing-muted">
                Every ticket payment is automatically split among collaborators
                all through one seamless checkout.
              </span>
            </p>
          </div>
        </LandingSection>

        <section
          className="landing-section-grid pb-24 sm:pb-[6.25rem]"
          id="how-it-works"
        >
          <div className="landing-container">
            <SectionLabel>How It Works</SectionLabel>
            <div className="mt-6">
              <h2 className="font-product text-[clamp(2rem,2.78vw,2.5rem)] font-medium leading-[1.4] tracking-normal text-landing-white text-balance">
                Run your event in three simple steps
              </h2>
              <p className="mt-2 text-base leading-[1.4] text-landing-white">
                From creating your event to automatically splitting payouts and
                verifying attendees.
              </p>
            </div>

            <HowItWorksInteractive steps={workflowSteps} />
          </div>
        </section>

        <section
          className="landing-section-grid pb-24 pt-[6.25rem] sm:pb-[6.25rem]"
          id="features"
        >
          <div className="landing-container">
            <div className="mx-auto max-w-[56rem] text-center">
              <SectionLabel>Features</SectionLabel>
              <h2 className="mt-7 font-product text-[clamp(2rem,2.78vw,2.5rem)] font-medium leading-[1.4] tracking-normal text-landing-white text-balance">
                Built for collaborative payments, not just ticketing
              </h2>
              <p className="mx-auto mt-3 max-w-[45rem] text-base leading-[1.4] tracking-normal text-landing-white">
                From collaborative checkout to automatic revenue splits and
                wallet-verifiable event passes, Quorum brings every payment
                workflow into one seamless platform powered by Stellar.
              </p>
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-2">
              {features.map((feature) => (
                <FeatureCard
                  description={feature.description}
                  key={feature.title}
                  title={feature.title}
                  visual={feature.visual}
                />
              ))}
            </div>

            <div className="mt-9 flex justify-center">
              <LandingButton href="/evidence" icon={null} variant="secondary">
                View Docs
              </LandingButton>
            </div>
          </div>
        </section>

        <section
          className="landing-section-grid overflow-hidden py-[5.2rem] sm:py-[5.6rem]"
          id="testimonial"
        >
          <div className="landing-container">
            <div className="mx-auto max-w-[75rem] text-center">
              <SectionLabel>Testimonial</SectionLabel>
              <h2 className="mt-8 font-product text-[clamp(2.3rem,3.35vw,2.5rem)] font-medium leading-[1.4] tracking-normal text-landing-white text-balance">
                Trusted by Web3 Event Organizers
              </h2>
              <p className="mt-2 text-base leading-[1.4] text-landing-white">
                See how communities use Quorum to simplify ticket sales,
                automate revenue sharing, and manage event access.
              </p>
            </div>

            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </section>

        <section
          className="landing-section-grid relative overflow-hidden pb-0 pt-[5.8rem] sm:pt-[6rem]"
          id="faq"
        >
          <div className="landing-container relative z-10">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-9 max-w-[75rem] font-product text-[clamp(2.5rem,4.7vw,3rem)] font-normal leading-[1.4] tracking-normal text-landing-white text-balance">
              Got questions? We&apos;ve got you covered
            </h2>
            <FAQAccordion className="mt-[3.25rem]" items={faqItems} />
          </div>
          <p
            aria-hidden="true"
            className="pointer-events-none relative z-0 -mb-8 mt-10 select-none text-center font-product text-[clamp(8rem,21vw,17.5rem)] font-semibold leading-none text-white/[0.065]"
          >
            Quorum.
          </p>
        </section>

        <footer className="relative overflow-hidden border-t border-white/8 pt-12 sm:pt-16">
          <div className="landing-container relative z-10 flex flex-col gap-8 pb-12 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <LandingLogo />
              <p className="mt-4 max-w-md text-sm leading-6 text-landing-muted">
                Collaborative checkout, event access, and settlement evidence
                for Web3 communities building on Stellar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <LandingButton href="/discover" icon={null} variant="ghost">
                Discover
              </LandingButton>
              <LandingButton href="/dashboard/events/new" icon={null}>
                Start Splitting
              </LandingButton>
            </div>
          </div>

          <div className="landing-container flex items-center justify-between border-t border-white/8 py-5 text-xs text-landing-muted">
            <span>Quorum on Stellar testnet</span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={14} className="text-landing-cyan-soft" />
              Wallet-native proof
            </span>
          </div>

          <p
            aria-hidden="true"
            className="pointer-events-none -mb-8 select-none text-center font-product text-[clamp(5rem,20vw,18rem)] font-semibold leading-none text-white/[0.045]"
          >
            Quorum.
          </p>
        </footer>
      </main>
    </div>
  );
}
