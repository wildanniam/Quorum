import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/ui";

type LandingLogoProps = {
  className?: string;
  imageClassName?: string;
  href?: string;
};

export function LandingLogo({
  className,
  href = "/",
  imageClassName,
}: LandingLogoProps) {
  return (
    <Link
      aria-label="Quorum home"
      className={cn("inline-flex items-center", className)}
      href={href}
    >
      <Image
        alt=""
        className={cn("h-10 w-auto select-none", imageClassName)}
        height={40}
        priority
        src="/figma/landing/quorum-logo.svg"
        width={161}
      />
    </Link>
  );
}
