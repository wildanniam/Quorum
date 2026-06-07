import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Clock3, FileKey2, ShieldCheck } from "lucide-react";

type ProofKind = "local" | "metadata" | "pending" | "proof" | "stellar";

type ProofDescriptor = {
  Icon: LucideIcon;
  badgeClassName: string;
  label: string;
  shellClassName: string;
  valueClassName: string;
};

type ProofDisplayProps = {
  align?: "left" | "right";
  className?: string;
  compact?: boolean;
  label: string;
  value?: string | null;
};

const HEX_64_PATTERN = /^[a-f0-9]{64}$/i;

const PROOF_DESCRIPTORS: Record<ProofKind, ProofDescriptor> = {
  local: {
    Icon: ShieldCheck,
    badgeClassName: "border-amber/45 bg-amber/10 text-amber",
    label: "Local proof",
    shellClassName: "border-amber/35",
    valueClassName: "text-amber",
  },
  metadata: {
    Icon: FileKey2,
    badgeClassName: "border-cyan/45 bg-cyan/10 text-cyan",
    label: "Metadata",
    shellClassName: "border-cyan/35",
    valueClassName: "text-cyan",
  },
  pending: {
    Icon: Clock3,
    badgeClassName: "border-line bg-panel text-muted",
    label: "Pending",
    shellClassName: "border-line",
    valueClassName: "text-muted",
  },
  proof: {
    Icon: BadgeCheck,
    badgeClassName: "border-accent/45 bg-accent/10 text-accent",
    label: "Proof",
    shellClassName: "border-accent/35",
    valueClassName: "text-foreground",
  },
  stellar: {
    Icon: BadgeCheck,
    badgeClassName: "border-accent/45 bg-accent/10 text-accent",
    label: "Stellar tx",
    shellClassName: "border-accent/35",
    valueClassName: "text-accent",
  },
};

function cn(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

function getProofKind(value?: string | null): ProofKind {
  const normalized = value?.trim();

  if (!normalized) return "pending";
  if (normalized.startsWith("sha256:")) return "metadata";
  if (normalized.startsWith("stub:")) return "local";
  if (normalized.includes("stub")) return "local";
  if (HEX_64_PATTERN.test(normalized)) return "stellar";

  return "proof";
}

export function ProofDisplay({
  align = "left",
  className,
  compact = false,
  label,
  value,
}: ProofDisplayProps) {
  const kind = getProofKind(value);
  const descriptor = PROOF_DESCRIPTORS[kind];
  const Icon = descriptor.Icon;
  const displayValue = value?.trim() || "Waiting for proof";

  return (
    <div
      className={cn(
        "border bg-background/35",
        descriptor.shellClassName,
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          align === "right" ? "justify-end" : "justify-between",
        )}
      >
        <p className="font-mono text-xs uppercase tracking-normal text-muted">
          {label}
        </p>
        <span
          className={cn(
            "inline-flex min-h-7 items-center gap-1.5 border px-2.5 font-mono text-xs font-semibold uppercase tracking-normal",
            descriptor.badgeClassName,
          )}
        >
          <Icon size={13} />
          {descriptor.label}
        </span>
      </div>
      <p
        className={cn(
          "mt-2 break-all font-mono text-xs leading-5",
          descriptor.valueClassName,
          align === "right" && "text-right",
        )}
      >
        {displayValue}
      </p>
    </div>
  );
}
