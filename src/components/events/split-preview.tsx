import { Users } from "lucide-react";
import type { CollaboratorRecord } from "@/lib/db/models";
import { cn } from "@/lib/ui";

type SplitPreviewProps = {
  className?: string;
  collaborators: CollaboratorRecord[];
};

export function SplitPreview({ className, collaborators }: SplitPreviewProps) {
  const rows =
    collaborators.length > 0
      ? collaborators.map((collaborator) => ({
          id: collaborator.id,
          label: collaborator.displayName,
          role: collaborator.role,
          share: collaborator.splitPercentage,
        }))
      : [
          {
            id: "organizer",
            label: "Organizer wallet",
            role: "Primary recipient",
            share: 100,
          },
        ];

  return (
    <div
      className={cn(
        "rounded-[14px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Revenue split</p>
          <h3 className="mt-2 font-product text-2xl font-medium tracking-normal">
            Published payout route
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            Guests see where the checkout amount is intended to route before
            they continue to wallet approval.
          </p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-quorum-grey-900/60 text-quorum-cyan-soft">
          <Users size={18} />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-full border border-white/10 bg-quorum-grey-900/62 p-1">
        <div className="flex h-3 overflow-hidden rounded-full">
          {rows.map((row, index) => (
            <span
              aria-label={`${row.label} ${row.share}%`}
              className="min-w-[3px]"
              key={row.id}
              style={{
                background:
                  index === 0
                    ? "var(--event-accent)"
                    : index === 1
                      ? "var(--event-accent-2)"
                      : "color-mix(in srgb, var(--event-accent) 42%, white)",
                width: `${row.share}%`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {rows.map((row, index) => (
          <div
            className="grid grid-cols-[1fr_auto] gap-4 rounded-[12px] border border-white/10 bg-quorum-grey-900/38 p-4"
            key={row.id}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background:
                      index === 0
                        ? "var(--event-accent)"
                        : index === 1
                          ? "var(--event-accent-2)"
                          : "color-mix(in srgb, var(--event-accent) 42%, white)",
                  }}
                />
                <p className="truncate font-medium">{row.label}</p>
              </div>
              <p className="mt-1 text-sm text-muted">{row.role}</p>
            </div>
            <p className="font-mono text-2xl leading-none text-foreground">
              {row.share}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
