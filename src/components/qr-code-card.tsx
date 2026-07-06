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
        "rounded-[16px] border border-quorum-cyan/30 bg-quorum-grey-800 p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 font-product text-sm font-medium text-quorum-cyan-soft">
        <QrCode size={16} />
        {label}
      </div>
      <div
        className="mt-4 grid aspect-square max-w-[220px] place-items-center rounded-[14px] border border-white/10 bg-[#f4efe7] p-4"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-3 break-all font-mono text-[11px] leading-5 text-muted">
        {value}
      </p>
    </div>
  );
}
