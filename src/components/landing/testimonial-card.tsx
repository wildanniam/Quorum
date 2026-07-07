import { Star } from "lucide-react";
import { cn } from "@/lib/ui";

type TestimonialCardProps = {
  avatar?: string;
  className?: string;
  name: string;
  quote: string;
  role: string;
};

export function TestimonialCard({
  avatar,
  className,
  name,
  quote,
  role,
}: TestimonialCardProps) {
  return (
    <article
      className={cn(
        "landing-card flex min-h-[22.75rem] flex-col items-center justify-between p-8 text-center",
        className,
      )}
      data-landing-hover="true"
    >
      <div>
        <div className="flex justify-center gap-3 text-landing-white">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star fill="currentColor" key={index} size={18} strokeWidth={0} />
          ))}
        </div>
        <p className="mt-10 max-w-[30rem] font-product text-2xl font-semibold leading-[1.35] text-landing-white text-balance">
          &ldquo;{quote}&rdquo;
        </p>
      </div>
      <div className="w-full border-t border-white/10 pt-9">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-landing-white">
          {avatar ?? name.slice(0, 2).toUpperCase()}
        </div>
        <p className="mt-4 font-product text-sm font-semibold text-landing-white">
          {name}
        </p>
        <p className="mt-3 text-sm text-landing-muted">{role}</p>
      </div>
    </article>
  );
}
