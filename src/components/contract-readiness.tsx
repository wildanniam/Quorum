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
import { ProofSurface } from "@/components/ui/proof-surface";
import { StatusPill } from "@/components/ui/status-pill";
import { getContractSetupPresentation } from "@/lib/capability-presentation";

export function ContractReadiness() {
  const readiness = getContractReadiness();
  const setup = getContractSetupPresentation(readiness);
  const actions = CONTRACT_ACTIONS.map((action) => getContractActionPolicy(action));

  const rows = [
    {
      icon: FileKey2,
      label: "Proof mode",
      value: setup.proofMode,
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
    <ProofSurface>
      <StatusPill icon={RadioTower} tone={setup.tone}>
        {setup.status}
      </StatusPill>
      <p className="mt-4 font-product text-xl font-medium">
        {setup.title}
      </p>
      <p className="mt-3 text-sm leading-6 text-muted">
        {setup.description}
      </p>

      <div className="mt-5 grid gap-3">
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <div
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[10px] border border-white/10 bg-background/36 p-3"
              key={row.label}
            >
              <Icon
                className={row.active ? "text-quorum-cyan-soft" : "text-muted"}
                size={17}
              />
              <span className="text-sm text-muted">{row.label}</span>
              <span className="max-w-40 truncate text-right font-mono text-xs">
                {row.value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 overflow-hidden rounded-[12px] border border-white/10 bg-background/30">
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 border-b border-white/10 p-3">
          <ListChecks className="text-quorum-cyan-soft" size={17} />
          <div>
            <p className="text-sm font-medium">Wallet actions</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {readiness.configured
                ? "Freighter approval is required before submission."
                : "Preview flow is active."}
            </p>
          </div>
        </div>
        {actions.map((action) => (
          <div
            className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/10 p-3 last:border-b-0"
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
                ? "wallet signing required"
                : "local proof"}
            </span>
          </div>
        ))}
      </div>
    </ProofSurface>
  );
}
