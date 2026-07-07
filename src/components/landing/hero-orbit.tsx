import Image from "next/image";
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
      <Image
        alt=""
        className="absolute left-1/2 top-[37rem] h-auto w-[980px] max-w-none -translate-x-1/2 select-none sm:top-[31rem] sm:w-[115vw] xl:w-[1662px]"
        height={759}
        priority
        sizes="(min-width: 1280px) 1662px, (min-width: 640px) 115vw, 980px"
        src="/figma/landing/hero-glow.svg"
        width={1662}
      />
      <span
        className="absolute left-[10%] top-0 hidden h-[11.75rem] w-px bg-gradient-to-b from-white/0 via-landing-cyan/38 to-white/0 sm:block"
        data-orbit-dot="true"
      >
        <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-landing-cyan-soft shadow-[0_0_34px_rgba(119,229,235,0.95)]" />
      </span>
      <span
        className="absolute left-[59.9%] top-[20rem] hidden h-[9.75rem] w-px bg-gradient-to-b from-white/0 via-landing-cyan/28 to-white/0 sm:block"
        data-orbit-dot="true"
      >
        <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-landing-cyan-soft shadow-[0_0_34px_rgba(119,229,235,0.95)]" />
      </span>
      <span
        className="absolute right-[10%] top-[29rem] hidden h-[10rem] w-px bg-gradient-to-b from-white/0 via-landing-cyan/30 to-white/0 md:block"
        data-orbit-dot="true"
      >
        <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-landing-cyan-soft shadow-[0_0_34px_rgba(119,229,235,0.95)]" />
      </span>
    </div>
  );
}
