import { CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/ui";

type SplitRow = {
  avatar: string;
  name: string;
  role: string;
  share: string;
};

const defaultRows: SplitRow[] = [
  { avatar: "JD", name: "John Doe", role: "Speaker", share: "25%" },
  { avatar: "SR", name: "Sarah", role: "Organizer", share: "60%" },
  { avatar: "SI", name: "Stellar ID", role: "Partner", share: "15%" },
];

type RevenueSplitPreviewProps = {
  className?: string;
  rows?: SplitRow[];
};

export function RevenueSplitPreview({
  className,
  rows = defaultRows,
}: RevenueSplitPreviewProps) {
  return (
    <div className={cn("landing-card landing-card-cyan p-5", className)}>
      <div className="mb-5 flex items-center justify-between">
        <p className="font-product text-sm font-semibold text-landing-white">
          Revenue Split
        </p>
        <CircleDollarSign className="text-landing-cyan-soft" size={18} />
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            className="flex items-center gap-3 rounded-[10px] border border-white/8 bg-white/[0.035] p-3"
            key={`${row.name}-${row.share}`}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-landing-cyan/26 bg-landing-cyan/10 font-mono text-xs text-landing-cyan-soft">
              {row.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-product text-sm font-semibold text-landing-white">
                {row.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-landing-muted">
                {row.role}
              </p>
            </div>
            <span className="rounded-full border border-landing-cyan/35 bg-landing-cyan/10 px-3 py-1 font-mono text-xs text-landing-cyan-soft">
              {row.share}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
