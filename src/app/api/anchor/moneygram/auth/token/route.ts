import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { resolveMoneyGramAnchorConfig } from "@/lib/anchor/config";
import { fetchMoneyGramSep1Info } from "@/lib/anchor/moneygram/sep1";
import {
  assertMoneyGramSep10SignedChallenge,
  authenticateMoneyGramSep10,
} from "@/lib/anchor/moneygram/sep10";

type TokenBody = {
  networkPassphrase?: string;
  signedTransactionXdr?: string;
};

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

function statusForMessage(message: string) {
  if (message.includes("Wallet session")) return 401;
  if (message.includes("signed by the wallet")) return 401;
  if (message.includes("SEP-10 auth failed")) return 502;
  return 400;
}

export async function POST(request: NextRequest) {
  const originRejection = rejectCrossOriginMutation(request);

  if (originRejection) return originRejection;

  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as TokenBody;
  const signedTransactionXdr = body.signedTransactionXdr?.trim();

  if (!signedTransactionXdr) {
    return NextResponse.json(
      { error: "signedTransactionXdr is required." },
      { status: 400 },
    );
  }

  try {
    const config = resolveMoneyGramAnchorConfig();
    const discovery = await fetchMoneyGramSep1Info({ config });

    assertMoneyGramSep10SignedChallenge({
      account: session.walletAddress,
      config,
      networkPassphrase: body.networkPassphrase,
      serverSigningKey: discovery.signingKey,
      transactionXdr: signedTransactionXdr,
    });

    const token = await authenticateMoneyGramSep10({
      config,
      discovery,
      signedTransactionXdr,
    });

    return NextResponse.json({ token: token.token });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not authenticate MoneyGram SEP-10 challenge.";

    return NextResponse.json(
      { error: message },
      { status: statusForMessage(message) },
    );
  }
}
