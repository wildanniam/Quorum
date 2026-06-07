"use client";

import {
  signPreparedLiveTransaction,
  type FreighterLiveSigner,
  type SignedLiveTransaction,
} from "@/lib/stellar/freighter-live-signing";
import type { ContractAction } from "@/lib/stellar/action-policy";
import type { PreparedLiveContractAction } from "@/lib/stellar/live-action";
import type { LiveTransactionForSigning } from "@/lib/stellar/live-preflight";

type LiveBrowserFlowFetcher = Pick<typeof globalThis, "fetch">["fetch"];

export type LiveBrowserContractActionInput = {
  action: ContractAction;
  baseFee?: string;
  eventId: string;
  fetcher?: LiveBrowserFlowFetcher;
  pollIntervalMs?: number;
  signer?: FreighterLiveSigner;
  submissionTimeoutMs?: number;
  timeoutSeconds?: number;
  tokenId?: string;
};

export type LiveBrowserContractActionResult = {
  preparedAction: PreparedLiveContractAction;
  preparedTransaction: LiveTransactionForSigning;
  signedTransaction: SignedLiveTransaction;
  submission: unknown;
};

export class LiveBrowserFlowError extends Error {
  readonly payload: unknown;
  readonly status: number;
  readonly step: "preflight" | "submit";

  constructor({
    message,
    payload,
    status,
    step,
  }: {
    message: string;
    payload: unknown;
    status: number;
    step: "preflight" | "submit";
  }) {
    super(message);
    this.name = "LiveBrowserFlowError";
    this.payload = payload;
    this.status = status;
    this.step = step;
  }
}

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

function payloadError(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    return String((payload as { error: unknown }).error);
  }

  return fallback;
}

function assertPreparedTransaction(payload: unknown) {
  const preparedTransaction = (payload as {
    preparedTransaction?: Partial<LiveTransactionForSigning>;
  })?.preparedTransaction;

  if (
    !preparedTransaction ||
    preparedTransaction.preparedForSigning !== true ||
    preparedTransaction.simulationRequired !== false ||
    typeof preparedTransaction.preparedTransactionXdr !== "string" ||
    typeof preparedTransaction.networkPassphrase !== "string" ||
    typeof preparedTransaction.source !== "string"
  ) {
    throw new LiveBrowserFlowError({
      message: "Live preflight did not return a signable transaction.",
      payload,
      status: 502,
      step: "preflight",
    });
  }

  return preparedTransaction as LiveTransactionForSigning;
}

function assertPreparedAction(payload: unknown) {
  const preparedAction = (payload as {
    preparedAction?: PreparedLiveContractAction;
  })?.preparedAction;

  if (!preparedAction?.action || !preparedAction.contractId) {
    throw new LiveBrowserFlowError({
      message: "Live preflight did not return prepared action metadata.",
      payload,
      status: 502,
      step: "preflight",
    });
  }

  return preparedAction;
}

function assertPreflightMatchesRequest({
  action,
  payload,
  preparedAction,
  preparedTransaction,
}: {
  action: ContractAction;
  payload: unknown;
  preparedAction: PreparedLiveContractAction;
  preparedTransaction: LiveTransactionForSigning;
}) {
  const mismatch =
    preparedAction.action !== action ||
    preparedTransaction.action !== action ||
    preparedAction.contractId !== preparedTransaction.contractId ||
    preparedAction.functionName !== preparedTransaction.functionName ||
    preparedAction.networkPassphrase !== preparedTransaction.networkPassphrase ||
    preparedAction.signer !== preparedTransaction.source;

  if (mismatch) {
    throw new LiveBrowserFlowError({
      message: "Live preflight metadata did not match the requested action.",
      payload,
      status: 502,
      step: "preflight",
    });
  }
}

export async function executeLiveBrowserContractAction({
  action,
  baseFee,
  eventId,
  fetcher = fetch,
  pollIntervalMs,
  signer,
  submissionTimeoutMs,
  timeoutSeconds,
  tokenId,
}: LiveBrowserContractActionInput): Promise<LiveBrowserContractActionResult> {
  const preflightResponse = await fetcher(
    `/api/events/${eventId}/contract-action/preflight`,
    {
      body: JSON.stringify({
        action,
        ...(baseFee ? { baseFee } : {}),
        ...(timeoutSeconds ? { timeoutSeconds } : {}),
        ...(tokenId ? { tokenId } : {}),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
  const preflightPayload = await readJson(preflightResponse);

  if (!preflightResponse.ok) {
    throw new LiveBrowserFlowError({
      message: payloadError(
        preflightPayload,
        "Could not preflight live transaction.",
      ),
      payload: preflightPayload,
      status: preflightResponse.status,
      step: "preflight",
    });
  }

  const preparedAction = assertPreparedAction(preflightPayload);
  const preparedTransaction = assertPreparedTransaction(preflightPayload);
  assertPreflightMatchesRequest({
    action,
    payload: preflightPayload,
    preparedAction,
    preparedTransaction,
  });
  const signedTransaction = await signPreparedLiveTransaction({
    preparedTransaction,
    signer,
  });
  const submitResponse = await fetcher(
    `/api/events/${eventId}/contract-action`,
    {
      body: JSON.stringify({
        action,
        ...(pollIntervalMs ? { pollIntervalMs } : {}),
        signedTransactionXdr: signedTransaction.signedTransactionXdr,
        ...(submissionTimeoutMs ? { timeoutMs: submissionTimeoutMs } : {}),
        ...(tokenId ? { tokenId } : {}),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
  );
  const submissionPayload = await readJson(submitResponse);

  if (!submitResponse.ok) {
    throw new LiveBrowserFlowError({
      message: payloadError(submissionPayload, "Could not submit live transaction."),
      payload: submissionPayload,
      status: submitResponse.status,
      step: "submit",
    });
  }

  return {
    preparedAction,
    preparedTransaction,
    signedTransaction,
    submission: submissionPayload,
  };
}
