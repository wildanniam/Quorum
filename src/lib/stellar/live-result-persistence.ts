import {
  recordLiveCheckIn,
  recordLivePass,
  recordLivePublishedEvent,
  recordLiveWithdrawal,
} from "@/lib/events/repository";
import type { PreparedLiveContractAction } from "@/lib/stellar/live-action";
import {
  atomicUnitsToUsdc,
  type CheckInContractArgs,
  type CreateEventContractArgs,
  type PurchaseContractArgs,
  type WithdrawContractArgs,
} from "@/lib/stellar/live-encoding";
import type {
  LiveTransactionReturnValue,
  LiveTransactionSubmissionResult,
} from "@/lib/stellar/live-submission";

type PersistedPublish = {
  action: "publish_event";
  result: Awaited<ReturnType<typeof recordLivePublishedEvent>>;
  txHash: string;
};

type PersistedPass = {
  action: "checkout_pass";
  result: Awaited<ReturnType<typeof recordLivePass>>;
  tokenId: string;
  txHash: string;
};

type PersistedCheckIn = {
  action: "check_in_pass";
  result: Awaited<ReturnType<typeof recordLiveCheckIn>>;
  txHash: string;
};

type PersistedWithdrawal = {
  action: "withdraw_balance";
  amountUsdc: string;
  result: Awaited<ReturnType<typeof recordLiveWithdrawal>>;
  txHash: string;
};

export type PersistedLiveTransactionResult =
  | PersistedCheckIn
  | PersistedPass
  | PersistedPublish
  | PersistedWithdrawal;

export class LiveResultPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveResultPersistenceError";
  }
}

function assertPreparedSubmissionMatch({
  preparedAction,
  submission,
}: {
  preparedAction: PreparedLiveContractAction;
  submission: LiveTransactionSubmissionResult;
}) {
  if (preparedAction.action !== submission.action) {
    throw new LiveResultPersistenceError(
      "Live submission action does not match the prepared action.",
    );
  }

  if (preparedAction.contractId !== submission.contractId) {
    throw new LiveResultPersistenceError(
      "Live submission contract ID does not match the prepared action.",
    );
  }

  if (preparedAction.functionName !== submission.functionName) {
    throw new LiveResultPersistenceError(
      "Live submission function does not match the prepared action.",
    );
  }
}

function assertVoidReturn(returnValue: LiveTransactionReturnValue) {
  if (returnValue.kind !== "void") {
    throw new LiveResultPersistenceError(
      "Expected a void live transaction return value.",
    );
  }
}

function tokenIdFromReturn(returnValue: LiveTransactionReturnValue) {
  if (returnValue.kind !== "token_id") {
    throw new LiveResultPersistenceError(
      "Expected live transaction finality to include a token ID.",
    );
  }

  return returnValue.value;
}

function withdrawUsdcFromReturn(returnValue: LiveTransactionReturnValue) {
  if (returnValue.kind !== "withdraw_amount_atomic") {
    throw new LiveResultPersistenceError(
      "Expected live withdraw finality to include an amount.",
    );
  }

  return atomicUnitsToUsdc(returnValue.value);
}

export async function persistLiveTransactionResult({
  eventId,
  preparedAction,
  submission,
}: {
  eventId: string;
  preparedAction: PreparedLiveContractAction;
  submission: LiveTransactionSubmissionResult;
}): Promise<PersistedLiveTransactionResult> {
  assertPreparedSubmissionMatch({ preparedAction, submission });

  if (preparedAction.action === "publish_event") {
    assertVoidReturn(submission.returnValue);

    const args = preparedAction.args as CreateEventContractArgs;

    return {
      action: "publish_event",
      result: await recordLivePublishedEvent({
        coreEventId: args.eventIdHex,
        eventId,
        metadataHash: args.metadataHashHex,
        organizerWallet: args.organizer,
        publishTxHash: submission.txHash,
      }),
      txHash: submission.txHash,
    };
  }

  if (preparedAction.action === "checkout_pass") {
    const args = preparedAction.args as PurchaseContractArgs;
    const tokenId = tokenIdFromReturn(submission.returnValue);

    return {
      action: "checkout_pass",
      result: await recordLivePass({
        eventId,
        metadataHash: args.metadataHashHex,
        metadataUri: args.metadataUri,
        ownerWallet: args.buyer,
        tokenId,
        txHash: submission.txHash,
      }),
      tokenId,
      txHash: submission.txHash,
    };
  }

  if (preparedAction.action === "check_in_pass") {
    assertVoidReturn(submission.returnValue);

    const args = preparedAction.args as CheckInContractArgs;

    return {
      action: "check_in_pass",
      result: await recordLiveCheckIn({
        checkedInByWallet: args.organizer,
        eventId,
        tokenId: args.tokenId,
        txHash: submission.txHash,
      }),
      txHash: submission.txHash,
    };
  }

  if (preparedAction.action === "withdraw_balance") {
    const args = preparedAction.args as WithdrawContractArgs;
    const amountUsdc = withdrawUsdcFromReturn(submission.returnValue);

    return {
      action: "withdraw_balance",
      amountUsdc,
      result: await recordLiveWithdrawal({
        amountUsdc,
        collaboratorWallet: args.collaborator,
        eventId,
        txHash: submission.txHash,
      }),
      txHash: submission.txHash,
    };
  }

  throw new LiveResultPersistenceError("Unsupported live transaction action.");
}
