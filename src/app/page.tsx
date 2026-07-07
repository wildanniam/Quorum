import {
  CircleDollarSign,
  ReceiptText,
  ShieldCheck,
  TicketCheck,
  WalletCards,
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
import { TestimonialCard } from "@/components/landing/testimonial-card";

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
      "Automatically distribute every ticket purchase to organizers, speakers, venues, and partners according to the split you define.",
    icon: CircleDollarSign,
    title: "Automatic Revenue Split",
    visual: <SplitRailVisual />,
  },
  {
    description:
      "Create paid community events with one checkout experience that supports multiple stakeholders from the start.",
    icon: WalletCards,
    title: "Collaborative Event Checkout",
    visual: <CheckoutOrbitVisual />,
  },
  {
    description:
      "Give organizers and collaborators a shared record of every payout, recipient, and settlement status.",
    icon: ReceiptText,
    title: "Transparent Settlement Ledger",
    visual: <LedgerTableVisual />,
  },
  {
    description:
      "Issue passes that help attendees prove ownership, unlock event resources, and verify check-in access.",
    icon: TicketCheck,
    title: "Wallet-Verifiable Event Pass",
    visual: <PassVisual />,
  },
];

const testimonials = [
  {
    name: "Steven",
    quote: "Quorum saved us hours of manual payout work.",
    role: "Hackathon Organizer, Indonesia",
  },
  {
    name: "Maya R.",
    quote: "I can finally see who gets paid before the event goes live.",
    role: "Community Lead, Singapore",
  },
  {
    name: "Kevin T.",
    quote: "Buying a ticket and getting my access pass felt effortless.",
    role: "Hackathon Participant, Australia",
  },
];

const faqItems: FAQItem[] = [
  {
    answer:
      "Quorum stores the collaborator split for an event, then routes each paid checkout according to that split. The organizer, speakers, venue, or partners can all have predefined shares.",
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
          <div className="landing-container relative z-10 flex min-h-[760px] flex-col items-center pb-64 pt-12 text-center sm:min-h-[811px] sm:pb-72 sm:pt-[54px]">
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

        <LandingSection
          eyebrow="Features"
          id="features"
          intro="From collaborative checkout to automatic revenue split and wallet-verifiable passes, Quorum brings your event payment workflow into one system."
          title="Built for collaborative payments, not just ticketing"
        >
          <div className="grid gap-5 lg:grid-cols-2">
            {features.map((feature) => (
              <FeatureCard
                description={feature.description}
                icon={feature.icon}
                key={feature.title}
                title={feature.title}
                visual={feature.visual}
              />
            ))}
          </div>

          <div className="mt-9 flex justify-center">
            <LandingButton href="/evidence" variant="secondary">
              View Evidence
            </LandingButton>
          </div>
        </LandingSection>

        <LandingSection
          eyebrow="Testimonial"
          id="testimonial"
          intro="See how communities use Quorum to simplify ticket sales, automate revenue sharing, and manage event access."
          title="Trusted by Web3 event organizers"
        >
          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.name}
                name={testimonial.name}
                quote={testimonial.quote}
                role={testimonial.role}
              />
            ))}
          </div>
        </LandingSection>

        <LandingSection
          align="left"
          className="pb-18"
          eyebrow="FAQ"
          id="faq"
          title="Got questions? We've got you covered"
        >
          <FAQAccordion items={faqItems} />
        </LandingSection>

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
