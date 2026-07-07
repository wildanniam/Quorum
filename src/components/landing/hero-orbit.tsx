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
  const isBackground = mode === "background";

  return (
    <div
      data-hero-orbit="true"
      aria-hidden="true"
      className={cn(wrapperClassName, className)}
    >
      <Image
        alt=""
        className={cn(
          "absolute left-1/2 h-auto w-[980px] max-w-none -translate-x-1/2 select-none sm:w-[115vw] xl:w-[1662px]",
          isBackground
            ? "top-[calc(37rem+6.375rem)] sm:top-[calc(31rem+6.375rem)]"
            : "top-[37rem] sm:top-[31rem]",
        )}
        height={759}
        priority
        sizes="(min-width: 1280px) 1662px, (min-width: 640px) 115vw, 980px"
        src="/figma/landing/hero-glow.svg"
        width={1662}
      />
      <span
        className={cn(
          "absolute left-[10%] hidden h-[11.75rem] w-px bg-gradient-to-b from-white/0 via-landing-cyan/38 to-white/0 sm:block",
          isBackground ? "top-[6.375rem]" : "top-0",
        )}
        data-orbit-dot="true"
      >
        <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-landing-cyan-soft shadow-[0_0_34px_rgba(119,229,235,0.95)]" />
      </span>
      <span
        className={cn(
          "absolute left-[59.9%] hidden h-[9.75rem] w-px bg-gradient-to-b from-white/0 via-landing-cyan/28 to-white/0 sm:block",
          isBackground ? "top-[calc(20rem+6.375rem)]" : "top-[20rem]",
        )}
        data-orbit-dot="true"
      >
        <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-landing-cyan-soft shadow-[0_0_34px_rgba(119,229,235,0.95)]" />
      </span>
      <span
        className={cn(
          "absolute right-[10%] hidden h-[10rem] w-px bg-gradient-to-b from-white/0 via-landing-cyan/30 to-white/0 md:block",
          isBackground ? "top-[calc(29rem+6.375rem)]" : "top-[29rem]",
        )}
        data-orbit-dot="true"
      >
        <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-landing-cyan-soft shadow-[0_0_34px_rgba(119,229,235,0.95)]" />
      </span>
    </div>
  );
}
