import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { createLocalWithdrawalProof } from "@/lib/events/repository";
import {
  assertLocalProofAction,
  isLiveContractActionRequired,
} from "@/lib/stellar/action-policy";

type WithdrawalRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

function statusForMessage(message: string) {
  if (message.includes("not found")) return 404;
  if (message.includes("not a collaborator")) return 403;
  if (message.includes("No withdrawable balance")) return 409;
  return 400;
}

export async function POST(request: NextRequest, context: WithdrawalRouteContext) {
  const originRejection = rejectCrossOriginMutation(request);

  if (originRejection) return originRejection;

  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const { eventId } = await context.params;

  try {
    const policy = assertLocalProofAction("withdraw_balance");
    const result = createLocalWithdrawalProof(eventId, session.walletAddress);

    return NextResponse.json(
      { ...result, executionMode: policy.executionMode, proofMode: policy.proofMode },
      { status: 201 },
    );
  } catch (error) {
    if (isLiveContractActionRequired(error)) {
      return NextResponse.json(
        {
          error: error.message,
          executionMode: error.executionMode,
          proofMode: error.proofMode,
        },
        { status: 501 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Could not withdraw balance.";

    return NextResponse.json(
      { error: message },
      { status: statusForMessage(message) },
    );
  }
}
