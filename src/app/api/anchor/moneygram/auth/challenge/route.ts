import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import {
  requestMoneyGramSep10Challenge,
  signMoneyGramClientDomainChallenge,
} from "@/lib/anchor/moneygram/sep10";

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

function statusForMessage(message: string) {
  if (message.includes("ANCHOR_CLIENT_SIGNING_SECRET")) return 503;
  if (message.includes("SEP-1") || message.includes("SEP-10")) return 502;
  return 400;
}

export async function POST(request: NextRequest) {
  const originRejection = rejectCrossOriginMutation(request);

  if (originRejection) return originRejection;

  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  try {
    const challenge = await requestMoneyGramSep10Challenge({
      account: session.walletAddress,
    });
    const transactionXdr = signMoneyGramClientDomainChallenge({ challenge });

    return NextResponse.json({
      challenge: {
        ...challenge,
        transactionXdr,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not prepare MoneyGram SEP-10 challenge.";

    return NextResponse.json(
      { error: message },
      { status: statusForMessage(message) },
    );
  }
}
