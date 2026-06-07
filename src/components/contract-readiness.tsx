import { Boxes, FileKey2, RadioTower, ShieldCheck } from "lucide-react";
import { getContractReadiness } from "@/lib/stellar/contracts";

export function ContractReadiness() {
  const readiness = getContractReadiness();

  const rows = [
    {
      icon: FileKey2,
      label: "Proof mode",
      value: readiness.configured ? "Live contracts" : "Local proof mode",
      active: readiness.configured,
    },
    {
      icon: Boxes,
      label: "Core",
      value: readiness.coreContractId
        ? readiness.invalid.includes("NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID")
          ? "Invalid"
          : "Configured"
        : "Missing",
      active:
        Boolean(readiness.coreContractId) &&
        !readiness.invalid.includes("NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID"),
    },
    {
      icon: ShieldCheck,
      label: "Pass",
      value: readiness.passContractId
        ? readiness.invalid.includes("NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID")
          ? "Invalid"
          : "Configured"
        : "Missing",
      active:
        Boolean(readiness.passContractId) &&
        !readiness.invalid.includes("NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID"),
    },
    {
      icon: RadioTower,
      label: readiness.network,
      value: readiness.rpcUrl.replace(/^https?:\/\//, ""),
      active: true,
    },
  ];

  return (
    <div className="border border-line bg-panel p-5">
      <p className="font-mono text-xs uppercase tracking-normal text-muted">
        Contract readiness
      </p>
      <p className="mt-2 text-xl font-semibold">
        {readiness.configured ? "Contracts configured" : "Deployment pending"}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted">
        {readiness.configured
          ? "Live Stellar contract IDs are configured for proof surfaces."
          : "Using local proof records until valid Stellar testnet contract IDs are configured."}
      </p>

      <div className="mt-5 grid gap-3">
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <div
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border border-line bg-background/35 p-3"
              key={row.label}
            >
              <Icon className={row.active ? "text-accent" : "text-muted"} size={17} />
              <span className="text-sm text-muted">{row.label}</span>
              <span className="max-w-40 truncate text-right font-mono text-xs">
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
