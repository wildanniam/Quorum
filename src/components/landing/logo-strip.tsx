type LogoStripProps = {
  caption?: string;
};

function StripLogo() {
  return (
    <span className="inline-flex items-center gap-3 font-product text-[1.35rem] font-semibold text-landing-white/82">
      <span className="relative block h-7 w-7 text-current" aria-hidden="true">
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-[4px] border-[4px] border-current" />
        <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-[4px] border-[4px] border-current" />
        <span className="absolute bottom-0.5 left-0.5 h-4 w-4 rounded-[4px] border-[4px] border-current" />
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-[2px] bg-current" />
      </span>
      Quorum.
    </span>
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
