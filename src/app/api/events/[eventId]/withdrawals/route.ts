import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { createLocalWithdrawalProof } from "@/lib/events/repository";

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
  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const { eventId } = await context.params;

  try {
    return NextResponse.json(
      createLocalWithdrawalProof(eventId, session.walletAddress),
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not withdraw balance.";

    return NextResponse.json(
      { error: message },
      { status: statusForMessage(message) },
    );
  }
}
