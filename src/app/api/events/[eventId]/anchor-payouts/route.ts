import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { createAnchorPayout } from "@/lib/anchor/payouts";

type AnchorPayoutRouteContext = {
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
  if (message.includes("exceeds withdrawable")) return 409;
  if (message.includes("No withdrawable")) return 409;
  if (message.includes("MoneyGram wallet authorization")) return 428;
  return 400;
}

export async function POST(
  request: NextRequest,
  context: AnchorPayoutRouteContext,
) {
  const originRejection = rejectCrossOriginMutation(request);

  if (originRejection) return originRejection;

  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const { eventId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    amountUsdc?: string | null;
    moneyGramAuthToken?: string | null;
  };

  try {
    const result = await createAnchorPayout({
      amountUsdc: body.amountUsdc,
      collaboratorWallet: session.walletAddress,
      eventId,
      moneyGramAuthToken: body.moneyGramAuthToken,
    });

    return NextResponse.json(
      {
        ...result,
        executionMode:
          result.payout.provider === "moneygram"
            ? "moneygram_sep24"
            : "local_proof",
        proofMode: result.payout.provider === "moneygram" ? "anchor" : "local",
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create anchor payout.";

    return NextResponse.json(
      {
        error: message,
        requiresMoneyGramAuth: message.includes("MoneyGram wallet authorization"),
      },
      { status: statusForMessage(message) },
    );
  }
}
