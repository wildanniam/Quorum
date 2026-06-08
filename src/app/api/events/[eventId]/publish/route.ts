import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { publishDraftEventStub } from "@/lib/events/repository";
import {
  assertLocalProofAction,
  isLiveContractActionRequired,
} from "@/lib/stellar/action-policy";

type PublishRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function POST(request: NextRequest, context: PublishRouteContext) {
  const originRejection = rejectCrossOriginMutation(request);

  if (originRejection) return originRejection;

  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const { eventId } = await context.params;

  try {
    const policy = assertLocalProofAction("publish_event");
    const result = publishDraftEventStub(eventId, session.walletAddress);

    return NextResponse.json({
      ...result,
      executionMode: policy.executionMode,
      proofMode: policy.proofMode,
    });
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

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not publish event.",
      },
      { status: 400 },
    );
  }
}
