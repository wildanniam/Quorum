import { StrKey } from "@stellar/stellar-sdk";
import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import {
  CHALLENGE_COOKIE,
  CHALLENGE_MAX_AGE_SECONDS,
  createChallenge,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const originRejection = rejectCrossOriginMutation(request);

  if (originRejection) return originRejection;

  const body = (await request.json().catch(() => ({}))) as {
    walletAddress?: string;
  };
  const walletAddress = body.walletAddress ?? "";

  if (!StrKey.isValidEd25519PublicKey(walletAddress)) {
    return NextResponse.json(
      { error: "Valid wallet address required." },
      { status: 400 },
    );
  }

  const message = createChallenge(walletAddress);
  const response = NextResponse.json({ message });

  response.cookies.set(CHALLENGE_COOKIE, message, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CHALLENGE_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
