import { LandingLogo } from "@/components/landing/landing-logo";

type LogoStripProps = {
  caption?: string;
};

export function LogoStrip({
  caption = "Trusted by Stellar builders and Web3 communities",
}: LogoStripProps) {
  return (
    <div className="landing-fade-x relative overflow-hidden py-5">
      <p className="mb-5 text-center font-product text-xs font-medium text-landing-muted">
        {caption}
      </p>
      <div className="flex min-w-max items-center gap-10 opacity-55">
        {Array.from({ length: 8 }).map((_, index) => (
          <LandingLogo
            className="shrink-0 scale-90 text-base"
            key={`quorum-logo-${index}`}
            markClassName="h-7 w-7"
          />
        ))}
      </div>
    </div>
  );
}
