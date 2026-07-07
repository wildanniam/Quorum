import Image from "next/image";
import { cn } from "@/lib/ui";

type StellarBadgeProps = {
  className?: string;
};

export function StellarBadge({ className }: StellarBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex h-[46px] w-[210px] select-none items-center gap-2 rounded-full border border-white/18 bg-[#0c0b0b] pl-6 pr-6 font-product text-[15px] font-semibold leading-[22px] text-landing-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_28px_rgba(119,229,235,0.07)]",
        className,
      )}
    >
      <Image
        alt=""
        className="h-5 w-5 shrink-0"
        height={20}
        priority
        src="/figma/landing/stellar-symbol.svg"
        width={20}
      />
      <span className="w-[134px] text-left">Powered by Stellar</span>
    </div>
  );
}
