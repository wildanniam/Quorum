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
    <div className={cn("border-y border-white/18 bg-[#0b0b0b]", className)}>
      {items.map((item, index) => (
        <details
          className="group border-b border-white/18 last:border-b-0"
          key={item.question}
          open={index === 0}
        >
          <summary className="flex min-h-[7rem] list-none items-center justify-between gap-6 py-0 text-left group-open:min-h-0 group-open:items-start group-open:pt-10">
            <span className="font-product text-xl font-semibold leading-[1.4] text-landing-white md:text-2xl">
              {item.question}
            </span>
            <span className="grid h-8 w-8 shrink-0 place-items-center text-landing-white">
              <Plus className="group-open:hidden" size={28} strokeWidth={2} />
              <Minus className="hidden group-open:block" size={28} strokeWidth={2} />
            </span>
          </summary>
          <p className="max-w-[64rem] pb-10 text-base leading-[1.45] text-landing-white">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
