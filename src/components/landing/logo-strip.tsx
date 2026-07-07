import Image from "next/image";

type LogoStripProps = {
  caption?: string;
};

function StripLogo() {
  return (
    <Image
      alt=""
      className="h-10 w-auto select-none"
      height={40}
      src="/figma/landing/quorum-logo.svg"
      width={161}
    />
  );
}

export function LogoStrip({
  caption = "Trusted by leading blockchain innovators",
}: LogoStripProps) {
  return (
    <div
      className="landing-fade-x relative overflow-hidden border-b border-white/8 py-7"
      data-logo-strip="true"
    >
      <p className="mb-5 text-center font-product text-xs font-medium text-landing-muted">
        {caption}
      </p>
      <div
        aria-hidden="true"
        className="flex min-w-max items-center justify-center gap-13 opacity-48"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <StripLogo key={`quorum-logo-${index}`} />
        ))}
      </div>
    </div>
  );
}
