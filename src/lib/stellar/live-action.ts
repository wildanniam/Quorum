import type { ContractAction } from "@/lib/stellar/action-policy";
import {
  countPassesForEvent,
  getEventById,
  getPassByEventAndOwner,
  listCollaborators,
  listResources,
} from "@/lib/events/repository";
import { getContractReadiness } from "@/lib/stellar/contracts";
import {
  type CheckInContractArgs,
  type CreateEventContractArgs,
  type PurchaseContractArgs,
  type WithdrawContractArgs,
  BPS_DENOMINATOR,
  prepareCheckInContractArgs,
  prepareCreateEventContractArgs,
  preparePurchaseContractArgs,
  prepareWithdrawContractArgs,
  splitPercentageToBps,
} from "@/lib/stellar/live-encoding";

export type LiveContractFunctionName =
  | "create_event"
  | "purchase"
  | "check_in"
  | "withdraw";

type LiveContractArgs =
  | CheckInContractArgs
  | CreateEventContractArgs
  | PurchaseContractArgs
  | WithdrawContractArgs;

export type PreparedLiveContractAction = {
  action: ContractAction;
  args: LiveContractArgs;
  contractId: string;
  coreContractId: string;
  executionMode: "live_required";
  functionName: LiveContractFunctionName;
  network: string;
  networkPassphrase: string;
  passContractId: string;
  proofMode: "live";
  rpcUrl: string;
  signer: string;
  usdcContractId: string;
};

export class LiveActionPreparationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "LiveActionPreparationError";
    this.status = status;
  }
}

function livePreparationError(message: string, status = 400) {
  return new LiveActionPreparationError(message, status);
}

function requireLiveReadiness() {
  const readiness = getContractReadiness();

  if (!readiness.configured) {
    throw livePreparationError(
      "Valid core, pass, and USDC contract IDs are required before preparing live contract actions.",
      409,
    );
  }

  if (
    !readiness.coreContractId ||
    !readiness.passContractId ||
    !readiness.usdcContractId
  ) {
    throw livePreparationError(
      "Live contract readiness is incomplete.",
      409,
    );
  }

  return {
    coreContractId: readiness.coreContractId,
    network: readiness.network,
    networkPassphrase: readiness.networkPassphrase,
    passContractId: readiness.passContractId,
    rpcUrl: readiness.rpcUrl,
    usdcContractId: readiness.usdcContractId,
  };
}

function assertOrganizer(eventOrganizerWallet: string, signerWallet: string) {
  if (eventOrganizerWallet !== signerWallet) {
    throw livePreparationError(
      "Connected wallet must be the event organizer for this live action.",
      403,
    );
  }
}

function assertPublished(status: string, message: string) {
  if (status !== "published") {
    throw livePreparationError(message, 409);
  }
}

function buildEnvelope({
  action,
  args,
  functionName,
  signerWallet,
}: {
  action: ContractAction;
  args: LiveContractArgs;
  functionName: LiveContractFunctionName;
  signerWallet: string;
}): PreparedLiveContractAction {
  const readiness = requireLiveReadiness();

  return {
    action,
    args,
    contractId: readiness.coreContractId,
    coreContractId: readiness.coreContractId,
    executionMode: "live_required",
    functionName,
    network: readiness.network,
    networkPassphrase: readiness.networkPassphrase,
    passContractId: readiness.passContractId,
    proofMode: "live",
    rpcUrl: readiness.rpcUrl,
    signer: signerWallet,
    usdcContractId: readiness.usdcContractId,
  };
}

export function prepareLiveContractAction({
  action,
  eventId,
  signerWallet,
  tokenId,
}: {
  action: ContractAction;
  eventId: string;
  signerWallet: string;
  tokenId?: string | null;
}) {
  const readiness = requireLiveReadiness();
  const event = getEventById(eventId);
  const collaborators = listCollaborators(event.id);
  const resources = listResources(event.id);

  if (action === "publish_event") {
    assertOrganizer(event.organizerWallet, signerWallet);

    if (event.status !== "draft") {
      throw livePreparationError(
        "Only draft events can be prepared for live publish.",
        409,
      );
    }

    if (resources.length < 1) {
      throw livePreparationError(
        "Add at least one gated resource before preparing live publish.",
        400,
      );
    }

    const splitTotal = collaborators.reduce(
      (total, collaborator) =>
        total + splitPercentageToBps(collaborator.splitPercentage),
      0,
    );

    if (splitTotal !== BPS_DENOMINATOR) {
      throw livePreparationError(
        "Collaborator split bps must total 10000 before preparing live publish.",
        400,
      );
    }

    return buildEnvelope({
      action,
      args: prepareCreateEventContractArgs({
        collaborators,
        event,
        passContractId: readiness.passContractId,
        resources,
        usdcContractId: readiness.usdcContractId,
      }),
      functionName: "create_event",
      signerWallet,
    });
  }

  if (action === "checkout_pass") {
    assertPublished(
      event.status,
      "Passes can only be prepared for published events.",
    );

    if (getPassByEventAndOwner(event.id, signerWallet)) {
      throw livePreparationError(
        "Connected wallet already owns a pass for this event.",
        409,
      );
    }

    if (countPassesForEvent(event.id) >= event.capacity) {
      throw livePreparationError("Event capacity is sold out.", 409);
    }

    return buildEnvelope({
      action,
      args: preparePurchaseContractArgs({
        buyerWallet: signerWallet,
        event,
      }),
      functionName: "purchase",
      signerWallet,
    });
  }

  if (action === "check_in_pass") {
    assertOrganizer(event.organizerWallet, signerWallet);
    assertPublished(
      event.status,
      "Pass check-in can only be prepared for published events.",
    );

    if (!tokenId) {
      throw livePreparationError("Token ID is required for live check-in.", 400);
    }

    return buildEnvelope({
      action,
      args: prepareCheckInContractArgs({
        event,
        organizerWallet: signerWallet,
        tokenId,
      }),
      functionName: "check_in",
      signerWallet,
    });
  }

  if (action === "withdraw_balance") {
    assertPublished(
      event.status,
      "Withdrawals can only be prepared for published events.",
    );

    const collaborator = collaborators.find(
      (item) => item.walletAddress === signerWallet,
    );

    if (!collaborator) {
      throw livePreparationError(
        "Connected wallet is not a collaborator for this event.",
        403,
      );
    }

    return buildEnvelope({
      action,
      args: prepareWithdrawContractArgs({
        collaboratorWallet: signerWallet,
        event,
      }),
      functionName: "withdraw",
      signerWallet,
    });
  }

  throw livePreparationError("Unsupported live contract action.", 400);
}
