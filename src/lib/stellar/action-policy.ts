import { getContractReadiness } from "@/lib/stellar/contracts";

export type ContractAction =
  | "publish_event"
  | "checkout_pass"
  | "check_in_pass"
  | "withdraw_balance";

export type ContractActionPolicy = {
  action: ContractAction;
  executionMode: "local_proof" | "live_required";
  proofMode: "local" | "live";
  message: string;
};

export const CONTRACT_ACTIONS = [
  "publish_event",
  "checkout_pass",
  "check_in_pass",
  "withdraw_balance",
] as const satisfies readonly ContractAction[];

const actionLabels: Record<ContractAction, string> = {
  check_in_pass: "Check-in",
  checkout_pass: "Checkout / claim",
  publish_event: "Publish",
  withdraw_balance: "Withdraw",
};

export function getContractActionLabel(action: ContractAction) {
  return actionLabels[action];
}

export class LiveContractActionRequiredError extends Error {
  readonly action: ContractAction;
  readonly executionMode = "live_required";
  readonly proofMode = "live";

  constructor(action: ContractAction) {
    super(
      `Live Stellar contracts are configured for ${actionLabels[action]}, but app-side Freighter transaction submission is not enabled yet.`,
    );
    this.action = action;
    this.name = "LiveContractActionRequiredError";
  }
}

export function getContractActionPolicy(
  action: ContractAction,
): ContractActionPolicy {
  const readiness = getContractReadiness();

  if (readiness.configured) {
    return {
      action,
      executionMode: "live_required",
      proofMode: "live",
      message: `${actionLabels[action]} must be submitted as a live Stellar transaction.`,
    };
  }

  return {
    action,
    executionMode: "local_proof",
    proofMode: "local",
    message: `${actionLabels[action]} uses local proof records until valid Stellar contract IDs are configured.`,
  };
}

export function assertLocalProofAction(action: ContractAction) {
  const policy = getContractActionPolicy(action);

  if (policy.executionMode === "live_required") {
    throw new LiveContractActionRequiredError(action);
  }

  return policy;
}

export function isLiveContractActionRequired(error: unknown) {
  return error instanceof LiveContractActionRequiredError;
}
