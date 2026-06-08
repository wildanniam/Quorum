import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { markLocalPassCheckedIn } from "@/lib/events/repository";
import {
  assertLocalProofAction,
  isLiveContractActionRequired,
} from "@/lib/stellar/action-policy";

type CheckInRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

const checkInRequestSchema = z.object({
  tokenId: z.string().trim().min(1),
});

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

function statusForMessage(message: string) {
  if (message.includes("not found")) return 404;
  if (message.includes("already checked in")) return 409;
  if (message.includes("Only the event organizer")) return 403;
  return 400;
}

export async function POST(request: NextRequest, context: CheckInRouteContext) {
  const originRejection = rejectCrossOriginMutation(request);

  if (originRejection) return originRejection;

  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkInRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Token ID is required." },
      { status: 400 },
    );
  }

  const { eventId } = await context.params;

  try {
    const policy = assertLocalProofAction("check_in_pass");
    const result = markLocalPassCheckedIn({
      checkedInByWallet: session.walletAddress,
      eventId,
      tokenId: parsed.data.tokenId,
    });

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
      error instanceof Error ? error.message : "Could not check in pass.";

    return NextResponse.json(
      { error: message },
      { status: statusForMessage(message) },
    );
  }
}
