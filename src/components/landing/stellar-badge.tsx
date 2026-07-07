import Image from "next/image";
import { cn } from "@/lib/ui";

type StellarBadgeProps = {
  className?: string;
};

export function StellarBadge({ className }: StellarBadgeProps) {
  return (
    <div
      className={cn(
        "relative inline-flex h-[46px] w-[210px] select-none items-center justify-center rounded-full p-px font-product text-[15px] font-semibold leading-[22px] text-landing-white",
        "bg-[linear-gradient(90deg,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.32)_11%,rgba(255,255,255,0.035)_28%,rgba(255,255,255,0.01)_50%,rgba(255,255,255,0.035)_72%,rgba(255,255,255,0.34)_89%,rgba(255,255,255,0.95)_100%)]",
        className,
      )}
    >
      <div className="relative flex h-full w-full items-center gap-2 overflow-hidden rounded-full bg-[linear-gradient(180deg,#080808_0%,#000_54%,#050505_100%)] pl-[23px] pr-[23px] shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_14px_36px_rgba(0,0,0,0.58)]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.1),rgba(255,255,255,0))]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-[linear-gradient(270deg,rgba(255,255,255,0.1),rgba(255,255,255,0))]"
        />
        <Image
          alt=""
          className="relative h-5 w-5 shrink-0"
          height={20}
          priority
          src="/figma/landing/stellar-symbol.svg"
          width={20}
        />
        <span className="relative w-[134px] text-left">Powered by Stellar</span>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-12 rounded-l-full border-y border-l border-white/40 [mask-image:linear-gradient(90deg,black_0%,black_36%,transparent_100%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-12 rounded-r-full border-y border-r border-white/40 [mask-image:linear-gradient(270deg,black_0%,black_36%,transparent_100%)]"
      />
    </div>
  );
}
