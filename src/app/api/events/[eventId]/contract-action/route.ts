import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { CONTRACT_ACTIONS } from "@/lib/stellar/action-policy";
import {
  LiveActionPreparationError,
  type PreparedLiveContractAction,
  prepareLiveContractAction,
} from "@/lib/stellar/live-action";
import {
  LiveResultPersistenceError,
  persistLiveTransactionResult,
} from "@/lib/stellar/live-result-persistence";
import {
  LiveTransactionSubmissionError,
  submitSignedLiveTransaction,
} from "@/lib/stellar/live-submission";
import {
  buildLiveContractInvocationArgsXdr,
  buildUnsignedLiveTransaction,
} from "@/lib/stellar/live-xdr";

type ContractActionRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

const prepareActionRequestSchema = z.object({
  action: z.enum(CONTRACT_ACTIONS),
  sourceSequence: z.string().trim().regex(/^\d+$/).optional(),
  tokenId: z.string().trim().optional(),
});

const submitSignedActionRequestSchema = z.object({
  action: z.enum(CONTRACT_ACTIONS),
  pollIntervalMs: z.number().int().min(50).max(10_000).optional(),
  signedTransactionXdr: z.string().trim().min(1),
  timeoutMs: z.number().int().min(1_000).max(120_000).optional(),
  tokenId: z.string().trim().optional(),
});

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

async function readJsonBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  context: ContractActionRouteContext,
) {
  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const parsed = prepareActionRequestSchema.safeParse({
    action: searchParams.get("action"),
    sourceSequence: searchParams.get("sourceSequence") ?? undefined,
    tokenId: searchParams.get("tokenId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid live contract action request.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { eventId } = await context.params;

  try {
    const preparedAction = prepareLiveContractAction({
      action: parsed.data.action,
      eventId,
      signerWallet: session.walletAddress,
      tokenId: parsed.data.tokenId,
    });
    const unsignedTransaction = parsed.data.sourceSequence
      ? buildUnsignedLiveTransaction({
          options: {
            sourceSequence: parsed.data.sourceSequence,
          },
          preparedAction,
        })
      : null;

    return NextResponse.json({
      ...preparedAction,
      ...(unsignedTransaction ? { unsignedTransaction } : {}),
    });
  } catch (error) {
    if (error instanceof LiveActionPreparationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not prepare live contract action.",
      },
      { status: 400 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: ContractActionRouteContext,
) {
  const originRejection = rejectCrossOriginMutation(request);

  if (originRejection) return originRejection;

  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const parsed = submitSignedActionRequestSchema.safeParse(
    await readJsonBody(request),
  );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid signed live contract action request.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { eventId } = await context.params;
  let preparedAction: PreparedLiveContractAction | null = null;

  try {
    preparedAction = prepareLiveContractAction({
      action: parsed.data.action,
      eventId,
      signerWallet: session.walletAddress,
      tokenId: parsed.data.tokenId,
    });

    const submission = await submitSignedLiveTransaction({
      options: {
        pollIntervalMs: parsed.data.pollIntervalMs,
        timeoutMs: parsed.data.timeoutMs,
      },
      signedTransaction: {
        action: preparedAction.action,
        contractId: preparedAction.contractId,
        functionName: preparedAction.functionName,
        invocationArgsXdr: buildLiveContractInvocationArgsXdr(preparedAction),
        networkPassphrase: preparedAction.networkPassphrase,
        signedTransactionXdr: parsed.data.signedTransactionXdr,
        signerAddress: session.walletAddress,
      },
    });
    const persisted = persistLiveTransactionResult({
      eventId,
      preparedAction,
      submission,
    });

    return NextResponse.json(
      {
        ...persisted,
        executionMode: preparedAction.executionMode,
        proofMode: preparedAction.proofMode,
        submission: {
          ledger: submission.ledger,
          returnValue: submission.returnValue,
          status: submission.status,
          txHash: submission.txHash,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof LiveActionPreparationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (error instanceof LiveTransactionSubmissionError) {
      return NextResponse.json(
        {
          error: error.message,
          ...(error.txHash ? { txHash: error.txHash } : {}),
          ...(preparedAction
            ? {
                executionMode: preparedAction.executionMode,
                proofMode: preparedAction.proofMode,
              }
            : {}),
        },
        { status: error.txHash ? 502 : 400 },
      );
    }

    if (error instanceof LiveResultPersistenceError) {
      return NextResponse.json(
        {
          error: error.message,
          ...(preparedAction
            ? {
                executionMode: preparedAction.executionMode,
                proofMode: preparedAction.proofMode,
              }
            : {}),
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not submit live contract action.",
      },
      { status: 400 },
    );
  }
}
