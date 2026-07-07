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
      <div className="absolute left-1/2 top-0 h-full w-full min-w-[980px] -translate-x-1/2">
        <Image
          alt=""
          className="object-fill"
          fill
          priority
          sizes="100vw"
          src="/figma/landing/hero-orbit.png"
        />
      </div>
    </div>
  );
}
