"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/ui";

type StepIndex = 0 | 1 | 2;

type WorkflowStep = {
  description: string;
  title: string;
};

type Participant = {
  avatar: string;
  name: string;
  payout: string;
  payoutMeta: string;
  role: string;
  share: string;
  type?: "person" | "stellar";
};

type HowItWorksInteractiveProps = {
  className?: string;
  steps: WorkflowStep[];
};

const participants: Participant[] = [
  {
    avatar: "/figma/landing/john-avatar.webp",
    name: "John Doe",
    payout: "+12.5 USDC",
    payoutMeta: "25% of 50USDC",
    role: "Speaker",
    share: "25%",
  },
  {
    avatar: "/figma/landing/sarah-avatar.webp",
    name: "Sarah",
    payout: "+30 USDC",
    payoutMeta: "60% of 50USDC",
    role: "Organizer",
    share: "60%",
  },
  {
    avatar: "/figma/landing/stellar-avatar.svg",
    name: "Stellar ID",
    payout: "+7.5 USDC",
    payoutMeta: "15% of 50USDC",
    role: "Partner",
    share: "15%",
    type: "stellar",
  },
];

const sequenceTiming = [520, 1450];

export function HowItWorksInteractive({
  className,
  steps,
}: HowItWorksInteractiveProps) {
  const [activeStep, setActiveStep] = useState<StepIndex>(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const setManualStep = useCallback(
    (step: StepIndex) => {
      clearTimers();
      setActiveStep(step);
    },
    [clearTimers],
  );

  const startSequence = useCallback(() => {
    clearTimers();
    setActiveStep(0);
    timersRef.current = [
      window.setTimeout(() => setActiveStep(1), sequenceTiming[0]),
      window.setTimeout(() => setActiveStep(2), sequenceTiming[1]),
    ];
  }, [clearTimers]);

  const resetSequence = useCallback(() => {
    clearTimers();
    setActiveStep(0);
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return (
    <div
      className={cn(
        "mt-6 grid min-h-[35.2rem] items-start gap-12 lg:grid-cols-[36.375rem_26.125rem] lg:gap-[7.5rem]",
        className,
      )}
      onPointerEnter={startSequence}
      onPointerLeave={resetSequence}
    >
      <div
        className="how-visual-stage relative mx-auto min-h-[31rem] w-full max-w-[36.375rem] lg:mx-0 lg:min-h-[35.2rem]"
        onPointerEnter={startSequence}
      >
        <SplitListVisual active={activeStep === 0} />
        <SettlementGraphVisual active={activeStep === 1} />
        <PayoutCompleteVisual active={activeStep === 2} />
      </div>

      <ol className="relative mx-auto w-full max-w-[26.125rem] lg:mt-[5.1875rem]">
        <span
          aria-hidden="true"
          className="absolute left-[1.5625rem] top-[-4.4375rem] h-[30.6875rem] w-px bg-gradient-to-b from-transparent via-white/18 to-transparent"
        />
        <span
          aria-hidden="true"
          className="absolute left-[1.5625rem] top-[1.5625rem] w-px bg-gradient-to-b from-[#26c6da] via-[#26c6da]/70 to-transparent opacity-80 shadow-[0_0_18px_rgba(38,198,218,0.5)] transition-[height] duration-500 ease-out"
          style={{
            height:
              activeStep === 0 ? "0rem" : activeStep === 1 ? "9.3125rem" : "18.625rem",
          }}
        />
        {steps.map((step, index) => {
          const stepIndex = index as StepIndex;
          const isActive = index <= activeStep;

          return (
            <li
              className="relative grid grid-cols-[3.125rem_1fr] gap-[1.4375rem] pb-12 last:pb-0 lg:pb-[3rem]"
              key={step.title}
            >
              <button
                aria-label={`Show ${step.title}`}
                aria-pressed={activeStep === stepIndex}
                className={cn(
                  "relative z-10 grid h-[3.125rem] w-[3.125rem] place-items-center rounded-[10px] font-product text-xl font-medium leading-[1.4] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-landing-cyan",
                  isActive
                    ? "bg-[#10535c]/80 shadow-[0_0_24px_rgba(38,198,218,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "bg-[#191919]",
                )}
                onClick={() => setManualStep(stepIndex)}
                onFocus={() => setManualStep(stepIndex)}
                onPointerEnter={() => setManualStep(stepIndex)}
                type="button"
              >
                {index + 1}
              </button>
              <div
                className={cn(
                  "transition duration-300 ease-out",
                  isActive ? "opacity-100" : "opacity-40",
                )}
              >
                <h3 className="font-product text-[1.1875rem] font-medium leading-[1.4] text-white">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[21.5625rem] font-product text-base font-normal leading-[1.4] text-[#979696]">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SplitListVisual({ active }: { active: boolean }) {
  return (
    <div className="how-visual-state" data-active={active}>
      <RevenueCard title="Revenue Split">
        {participants.map((participant) => (
          <SplitParticipantRow key={participant.name} participant={participant} />
        ))}
      </RevenueCard>
    </div>
  );
}

function PayoutCompleteVisual({ active }: { active: boolean }) {
  return (
    <div className="how-visual-state" data-active={active}>
      <RevenueCard
        headerAction={
          <span className="grid h-[2.3125rem] place-items-center rounded-full border border-[#156d78]/40 bg-[#156d78]/20 px-[0.95rem] font-product text-[1.1875rem] font-normal leading-[1.4] text-white backdrop-blur">
            Success
          </span>
        }
        title="Payout Complete"
      >
        {participants.map((participant) => (
          <PayoutParticipantRow key={participant.name} participant={participant} />
        ))}
      </RevenueCard>
    </div>
  );
}

function RevenueCard({
  children,
  headerAction,
  title,
}: {
  children: ReactNode;
  headerAction?: ReactNode;
  title: string;
}) {
  return (
    <div className="absolute left-0 right-0 top-6 mx-auto w-full max-w-[31.25rem] rounded-[16px] border border-[#22afc2] bg-[#0c0b0b] p-5 shadow-[0_0_16px_rgba(25,131,145,0.5)] sm:left-[5.125rem] sm:right-auto sm:top-[5.375rem] sm:mx-0">
      <div className="flex items-center gap-5">
        <p className="min-w-0 flex-1 font-product text-[1.5rem] font-normal leading-[1.4] text-landing-white">
          {title}
        </p>
        {headerAction}
      </div>
      <div className="mt-5 space-y-[0.625rem]">{children}</div>
    </div>
  );
}

function SplitParticipantRow({ participant }: { participant: Participant }) {
  return (
    <div className="flex min-h-[5.1875rem] items-center gap-3 rounded-[10px] border border-[#1c1b1b] bg-[#141313] px-5 py-[0.95rem] sm:gap-[3.2rem]">
      <ParticipantIdentity participant={participant} />
      <span className="grid h-[2.3125rem] w-[4.0625rem] shrink-0 place-items-center rounded-full border border-[#156d78]/40 bg-[#156d78]/20 font-product text-xl font-normal leading-[1.4] text-white backdrop-blur">
        {participant.share}
      </span>
    </div>
  );
}

function PayoutParticipantRow({ participant }: { participant: Participant }) {
  return (
    <div className="flex min-h-[5.1875rem] items-center gap-3 rounded-[10px] border border-[#1c1b1b] bg-[#141313] px-5 py-[0.95rem] sm:gap-[3.2rem]">
      <ParticipantIdentity participant={participant} />
      <div className="shrink-0 text-right font-product leading-[1.4]">
        <p className="text-[1.1875rem] font-medium text-[#26c6da]">
          {participant.payout}
        </p>
        <p className="text-base font-normal text-[#979696]">
          {participant.payoutMeta}
        </p>
      </div>
    </div>
  );
}

function ParticipantIdentity({ participant }: { participant: Participant }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-[0.95rem]">
      <div className="relative grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center overflow-hidden rounded-full border border-white/18 bg-[#101010]">
        <Image
          alt=""
          className="h-full w-full object-cover"
          height={52}
          src={participant.avatar}
          width={52}
        />
      </div>
      <div className="min-w-0">
        <p className="truncate font-product text-xl font-medium leading-[1.4] text-landing-white">
          {participant.name}
        </p>
        <p className="truncate font-product text-base font-normal leading-[1.4] text-[#979696]">
          {participant.role}
        </p>
      </div>
    </div>
  );
}

function SettlementGraphVisual({ active }: { active: boolean }) {
  return (
    <div className="how-visual-state" data-active={active}>
      <div className="settlement-graph absolute left-1/2 top-4 h-[32.5rem] w-[31.25rem] origin-top scale-[0.72] -translate-x-1/2 sm:left-[5.25rem] sm:top-6 sm:scale-100 sm:translate-x-0">
        <GraphLine className="left-[15.55rem] top-[4.875rem] h-[5.875rem]" delay="60ms" />
        <GraphLine className="left-[15.55rem] top-[15.25rem] h-[9.4rem]" delay="180ms" />
        <GraphLine
          className="left-[10.55rem] top-[16.75rem] h-[0.125rem] w-[7.2rem] origin-right rotate-[141deg]"
          delay="260ms"
          horizontal
        />
        <GraphLine
          className="left-[17.85rem] top-[16.75rem] h-[0.125rem] w-[7.2rem] origin-left rotate-[39deg]"
          delay="340ms"
          horizontal
        />

        <TicketNode />
        <QuorumNode />
        <GraphRecipient
          avatar="/figma/landing/stellar-avatar.svg"
          className="left-0 top-[19.4rem]"
          delay="560ms"
          name="Stellar ID"
          share="15%"
        />
        <GraphRecipient
          avatar="/figma/landing/john-avatar.webp"
          className="left-[18rem] top-[19.4rem]"
          delay="640ms"
          name="John Doe"
          share="25%"
        />
        <GraphRecipient
          avatar="/figma/landing/sarah-avatar.webp"
          className="left-[9.8rem] top-[27.1rem]"
          delay="720ms"
          name="Sarah"
          share="60%"
        />
      </div>
    </div>
  );
}

function TicketNode() {
  return (
    <div
      className="settlement-node absolute left-[9.9rem] top-0 flex h-[5.6rem] items-center justify-center gap-4 rounded-[16px] border border-white/12 bg-[#141313]/60 p-[1.32rem] shadow-[inset_0_-10px_16px_rgba(38,198,218,0.25),0_0_24px_rgba(38,198,218,0.18)] backdrop-blur"
      style={{ "--node-delay": "420ms" } as CSSProperties}
    >
      <Image
        alt=""
        className="h-[2.93rem] w-[2.93rem]"
        height={47}
        src="/figma/landing/wallet.svg"
        width={47}
      />
      <div className="font-product leading-[1.4]">
        <p className="text-[1.1875rem] font-medium text-white">50 USDC</p>
        <p className="text-base font-normal text-[#979696]">Per ticket</p>
      </div>
    </div>
  );
}

function QuorumNode() {
  return (
    <div
      className="settlement-node absolute left-[12.25rem] top-[10.8rem] grid h-[7.55rem] w-[7.55rem] place-items-center rounded-[16px] border border-white/12 bg-[#141313]/60 shadow-[inset_0_0_26px_rgba(38,198,218,0.2),0_0_24px_rgba(38,198,218,0.2)] backdrop-blur"
      style={{ "--node-delay": "500ms" } as CSSProperties}
    >
      <Image
        alt=""
        className="h-[3.65rem] w-[3.65rem]"
        height={58}
        src="/figma/landing/quorum-mark.svg"
        width={58}
      />
    </div>
  );
}

function GraphRecipient({
  avatar,
  className,
  delay,
  name,
  share,
}: {
  avatar: string;
  className: string;
  delay: string;
  name: string;
  share: string;
}) {
  return (
    <div
      className={cn(
        "settlement-node absolute flex h-[5rem] items-center justify-center gap-4 rounded-[15px] border border-white/12 bg-[#141313]/60 p-[1.2rem] shadow-[inset_0_0_18px_rgba(38,198,218,0.22),0_0_20px_rgba(38,198,218,0.16)] backdrop-blur",
        className,
      )}
      style={{ "--node-delay": delay } as CSSProperties}
    >
      <Image
        alt=""
        className="h-[2.57rem] w-[2.57rem] rounded-full object-cover"
        height={42}
        src={avatar}
        width={42}
      />
      <div className="font-product leading-[1.4]">
        <p className="whitespace-nowrap text-[1.1875rem] font-medium text-white">
          {name}
        </p>
        <p className="text-base font-normal text-[#979696]">{share}</p>
      </div>
    </div>
  );
}

function GraphLine({
  className,
  delay,
  horizontal = false,
}: {
  className: string;
  delay: string;
  horizontal?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "settlement-line absolute rounded-full bg-[#26c6da] shadow-[0_0_12px_rgba(38,198,218,0.7)]",
        horizontal ? "origin-left" : "w-[0.125rem] origin-top",
        className,
      )}
      data-direction={horizontal ? "horizontal" : "vertical"}
      style={{ "--line-delay": delay } as CSSProperties}
    />
  );
}
