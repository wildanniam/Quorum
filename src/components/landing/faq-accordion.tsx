import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/ui";

export type FAQItem = {
  answer: string;
  question: string;
};

type FAQAccordionProps = {
  className?: string;
  items: FAQItem[];
};

export function FAQAccordion({ className, items }: FAQAccordionProps) {
  return (
    <div className={cn("border-y border-white/14", className)}>
      {items.map((item, index) => (
        <details
          className="group border-b border-white/14 py-8 last:border-b-0"
          key={item.question}
          open={index === 0}
        >
          <summary className="flex list-none items-start justify-between gap-6 text-left">
            <span className="font-product text-xl font-semibold leading-tight text-landing-white md:text-2xl">
              {item.question}
            </span>
            <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center text-landing-white">
              <Plus className="group-open:hidden" size={24} />
              <Minus className="hidden group-open:block" size={24} />
            </span>
          </summary>
          <p className="mt-5 max-w-5xl text-base leading-7 text-landing-white/88">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
