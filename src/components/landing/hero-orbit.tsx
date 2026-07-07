import { cn } from "@/lib/ui";

type HeroOrbitProps = {
  className?: string;
  mode?: "background" | "flow";
};

export function HeroOrbit({ className, mode = "flow" }: HeroOrbitProps) {
  const wrapperClassName =
    mode === "background"
      ? "pointer-events-none absolute overflow-hidden"
      : "pointer-events-none relative mx-[-40vw] mt-10 h-[190px] overflow-hidden sm:mt-14 sm:h-[240px] lg:h-[300px]";

  return (
    <div
      data-hero-orbit="true"
      aria-hidden="true"
      className={cn(wrapperClassName, className)}
    >
      <div className="absolute left-1/2 top-10 h-[42rem] w-[128vw] min-w-[980px] -translate-x-1/2 rounded-[100%] border-t border-landing-cyan/75 bg-[radial-gradient(ellipse_at_top,rgba(38,198,218,0.3)_0%,rgba(38,198,218,0.16)_18%,rgba(11,11,11,0)_58%)] shadow-[0_-28px_110px_rgba(38,198,218,0.4)]" />
      <div className="absolute left-1/2 top-[4.35rem] h-[44rem] w-[120vw] min-w-[920px] -translate-x-1/2 rounded-[100%] border-t border-landing-cyan/32" />
    </div>
  );
}
