import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { syncMoneyGramAnchorPayout } from "@/lib/anchor/payouts";

type MoneyGramPayoutSyncRouteContext = {
  params: Promise<{
    payoutId: string;
  }>;
};

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

function statusForMessage(message: string) {
  if (message.includes("wallet authorization")) return 428;
  if (message.includes("not found")) return 404;
  if (message.includes("Only MoneyGram")) return 400;
  if (message.includes("SEP-24")) return 502;
  return 400;
}

export async function POST(
  request: NextRequest,
  context: MoneyGramPayoutSyncRouteContext,
) {
  const originRejection = rejectCrossOriginMutation(request);

  if (originRejection) return originRejection;

  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const { payoutId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    moneyGramAuthToken?: string | null;
  };

  try {
    const result = await syncMoneyGramAnchorPayout({
      collaboratorWallet: session.walletAddress,
      moneyGramAuthToken: body.moneyGramAuthToken,
      payoutId,
    });

    return NextResponse.json({
      payout: result.payout,
      transaction: {
        moreInfoUrl: result.transaction.moreInfoUrl,
        status: result.transaction.status,
      },
      transferInstructions: result.transferInstructions,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not sync MoneyGram payout status.";

    return NextResponse.json(
      {
        error: message,
        requiresMoneyGramAuth: message.includes("wallet authorization"),
      },
      { status: statusForMessage(message) },
    );
  }
}
