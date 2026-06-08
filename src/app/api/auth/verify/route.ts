import { StrKey } from "@stellar/stellar-sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  CHALLENGE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth/session";
import {
  decodeStellarSignature,
  verifyStellarMessageSignature,
} from "@/lib/auth/stellar-signature";

type VerifyBody = {
  walletAddress?: string;
  signerAddress?: string;
  signedMessage?: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as VerifyBody;
  const challenge = request.cookies.get(CHALLENGE_COOKIE)?.value;

  if (!challenge || !body.message || body.message !== challenge) {
    return NextResponse.json(
      { error: "Challenge expired or does not match." },
      { status: 401 },
    );
  }

  const walletAddress = body.walletAddress ?? "";
  const signerAddress = body.signerAddress ?? "";
  const signedMessage = body.signedMessage ?? "";

  if (
    !StrKey.isValidEd25519PublicKey(walletAddress) ||
    walletAddress !== signerAddress ||
    !signedMessage
  ) {
    return NextResponse.json(
      { error: "Invalid wallet signature payload." },
      { status: 400 },
    );
  }

  if (!decodeStellarSignature(signedMessage)) {
    return NextResponse.json(
      { error: "Invalid signature encoding." },
      { status: 400 },
    );
  }

  const verified = verifyStellarMessageSignature({
    walletAddress,
    message: challenge,
    signedMessage,
  });

  if (!verified) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });
  }

  const response = NextResponse.json({ walletAddress });

  response.cookies.delete(CHALLENGE_COOKIE);
  response.cookies.set(SESSION_COOKIE, createSessionToken(walletAddress), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
