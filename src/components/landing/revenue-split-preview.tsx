import Image from "next/image";
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
    <div
      className={cn(
        "w-full max-w-[31.25rem] rounded-[16px] border border-[#22afc2] bg-[#0c0b0b] p-5 shadow-[0_0_16px_rgba(25,131,145,0.5)]",
        className,
      )}
    >
      <p className="font-product text-[1.5rem] font-normal leading-[1.4] text-landing-white">
        Revenue Split
      </p>
      <div className="mt-5 space-y-[0.625rem]">
        {rows.map((row) => (
          <div
            className="flex min-h-[5.1875rem] items-center gap-3 rounded-[10px] border border-[#1c1b1b] bg-[#141313] px-5 py-[0.95rem] sm:gap-[3.2rem]"
            key={`${row.name}-${row.share}`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-[0.95rem]">
              <div className="relative grid h-[3.25rem] w-[3.25rem] shrink-0 place-items-center overflow-hidden rounded-full border border-white/18 bg-[radial-gradient(circle_at_34%_24%,rgba(255,255,255,0.55),rgba(38,198,218,0.16)_38%,rgba(12,11,11,0.95)_100%)] font-product text-sm font-medium text-white">
                {row.name === "Stellar ID" ? (
                  <Image
                    alt=""
                    className="h-[2.25rem] w-[2.25rem]"
                    height={36}
                    src="/figma/landing/stellar-symbol.svg"
                    width={36}
                  />
                ) : (
                  row.avatar
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-product text-xl font-medium leading-[1.4] text-landing-white">
                  {row.name}
                </p>
                <p className="truncate font-product text-base font-normal leading-[1.4] text-[#979696]">
                  {row.role}
                </p>
              </div>
            </div>
            <span className="grid h-[2.3125rem] w-[4.0625rem] shrink-0 place-items-center rounded-full border border-[#156d78]/40 bg-[#156d78]/20 font-product text-xl font-normal leading-[1.4] text-white backdrop-blur">
              {row.share}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
