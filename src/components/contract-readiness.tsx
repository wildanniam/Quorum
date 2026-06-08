import {
  Boxes,
  Coins,
  FileKey2,
  ListChecks,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import {
  CONTRACT_ACTIONS,
  getContractActionLabel,
  getContractActionPolicy,
} from "@/lib/stellar/action-policy";
import { getContractReadiness } from "@/lib/stellar/contracts";

export function ContractReadiness() {
  const readiness = getContractReadiness();
  const actions = CONTRACT_ACTIONS.map((action) => getContractActionPolicy(action));

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
      icon: Coins,
      label: "USDC asset",
      value: readiness.usdcContractId
        ? readiness.invalid.includes("NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID")
          ? "Invalid"
          : "Configured"
        : "Missing",
      active:
        Boolean(readiness.usdcContractId) &&
        !readiness.invalid.includes("NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID"),
    },
    {
      icon: RadioTower,
      label: "Network",
      value: readiness.networkConfigured ? readiness.network : "Invalid",
      active: readiness.networkConfigured,
    },
  ];

  return (
    <div className="rounded-[8px] border border-line bg-panel p-5">
      <p className="eyebrow">Contract readiness</p>
      <p className="mt-2 text-xl font-semibold">
        {readiness.configured ? "Contracts configured" : "Deployment pending"}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted">
        {readiness.configured
          ? "Live Stellar contract and payment asset IDs are configured for proof surfaces."
          : "Using local proof records until valid Stellar testnet network, contract, and payment asset IDs are configured."}
      </p>

      <div className="mt-5 grid gap-3">
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <div
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[8px] border border-line bg-background/32 p-3"
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

      <div className="mt-5 overflow-hidden rounded-[8px] border border-line bg-background/25">
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 border-b border-line p-3">
          <ListChecks className="text-accent" size={17} />
          <div>
            <p className="text-sm font-medium">Action execution</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {readiness.configured
                ? "Live transaction submission is required."
                : "Local proof execution is active."}
            </p>
          </div>
        </div>
        {actions.map((action) => (
          <div
            className="grid grid-cols-[1fr_auto] gap-3 border-b border-line p-3 last:border-b-0"
            key={action.action}
          >
            <span className="text-sm text-muted">
              {getContractActionLabel(action.action)}
            </span>
            <span
              className={`font-mono text-xs ${
                action.executionMode === "live_required"
                  ? "text-amber"
                  : "text-accent"
              }`}
            >
              {action.executionMode === "live_required"
                ? "live required"
                : "local proof"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
