import { NextRequest, NextResponse } from "next/server";
import { CHALLENGE_COOKIE, createChallenge } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    walletAddress?: string;
  };
  const message = createChallenge(body.walletAddress);
  const response = NextResponse.json({ message });

  response.cookies.set(CHALLENGE_COOKIE, message, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 5,
    path: "/",
  });

  return response;
}
