import { cn } from "@/lib/ui";

type HeroOrbitProps = {
  className?: string;
};

export function HeroOrbit({ className }: HeroOrbitProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative mx-[-40vw] mt-10 h-[170px] overflow-hidden sm:mt-14 sm:h-[220px] lg:h-[260px]",
        className,
      )}
    >
      <div className="absolute left-1/2 top-16 h-[38rem] w-[120vw] min-w-[920px] -translate-x-1/2 rounded-[100%] border-t border-landing-cyan/65 bg-[radial-gradient(ellipse_at_center,rgba(38,198,218,0.24)_0%,rgba(38,198,218,0.12)_13%,rgba(11,11,11,0)_54%)] shadow-[0_-24px_90px_rgba(38,198,218,0.32)]" />
      <div className="absolute left-1/2 top-[5.55rem] h-[40rem] w-[118vw] min-w-[880px] -translate-x-1/2 rounded-[100%] border-t border-landing-cyan/24" />
    </div>
  );
}
