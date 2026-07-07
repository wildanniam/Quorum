import { Star } from "lucide-react";
import Image from "next/image";
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
      data-testimonial-card
      className={cn(
        "flex h-[22.91rem] w-[calc(100vw-2rem)] max-w-[36.75rem] flex-none flex-col rounded-[8px] border border-white/[0.065] bg-[#0b0b0b] px-8 py-[1.875rem] text-center shadow-[0_24px_80px_rgba(0,0,0,0.32)] sm:px-[3.75rem]",
        className,
      )}
      data-landing-hover="true"
    >
      <div className="flex h-[7.25rem] flex-col items-center">
        <div aria-hidden="true" className="flex justify-center gap-2 text-landing-white">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star fill="currentColor" key={index} size={22} strokeWidth={0} />
          ))}
        </div>
        <p className="mt-6 max-w-[29.25rem] font-product text-[1.35rem] font-semibold leading-[1.4] text-landing-white text-balance sm:text-2xl">
          &ldquo;{quote}&rdquo;
        </p>
      </div>

      <div className="mt-10 h-px w-full bg-white/10" />

      <div className="flex flex-1 flex-col items-center justify-start pt-10">
        {avatar ? (
          <Image
            alt=""
            className="h-[2.85rem] w-[2.85rem] rounded-full border border-white/10 object-cover"
            height={46}
            src={avatar}
            width={46}
          />
        ) : (
          <div className="grid h-[2.85rem] w-[2.85rem] place-items-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-landing-white">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <p className="mt-4 font-product text-base font-semibold leading-[1.4] text-landing-white">
          {name}
        </p>
        <p className="mt-3 text-base leading-[1.4] text-landing-white">{role}</p>
      </div>
    </article>
  );
}
