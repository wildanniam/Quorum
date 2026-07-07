import Link from "next/link";
import { cn } from "@/lib/ui";

type LandingLogoProps = {
  className?: string;
  href?: string;
  markClassName?: string;
};

function QuorumMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block h-9 w-9 text-landing-white", className)}
    >
      <span className="absolute left-1 top-1 h-5 w-5 rounded-[5px] border-[5px] border-current" />
      <span className="absolute right-1 top-1 h-5 w-5 rounded-[5px] border-[5px] border-current" />
      <span className="absolute bottom-1 left-1 h-5 w-5 rounded-[5px] border-[5px] border-current" />
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-[3px] bg-current" />
    </span>
  );
}

export function LandingLogo({
  className,
  href = "/",
  markClassName,
}: LandingLogoProps) {
  return (
    <Link
      aria-label="Quorum home"
      className={cn(
        "inline-flex items-center gap-3 font-product text-[1.7rem] font-semibold leading-none text-landing-white",
        className,
      )}
      href={href}
    >
      <QuorumMark className={markClassName} />
      <span>Quorum.</span>
    </Link>
  );
}
