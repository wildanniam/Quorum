import { QrCode } from "lucide-react";
import { createQrSvg } from "@/lib/check-in/qr";
import { cn } from "@/lib/ui";

type QrCodeCardProps = {
  className?: string;
  label: string;
  value: string;
};

export async function QrCodeCard({ className, label, value }: QrCodeCardProps) {
  const svg = await createQrSvg(value);

  return (
    <div
      className={cn(
        "rounded-[16px] border border-quorum-cyan/30 bg-quorum-grey-800/92 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 font-product text-sm font-medium text-quorum-cyan-soft">
        <QrCode size={16} />
        {label}
      </div>
      <div
        className="mt-4 grid aspect-square max-w-[220px] place-items-center rounded-[14px] border border-white/10 bg-[#f4efe7] p-4 shadow-[0_18px_50px_rgba(38,198,218,0.12)]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-3 break-all font-mono text-[11px] leading-5 text-muted">
        {value}
      </p>
    </div>
  );
}
