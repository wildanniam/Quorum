import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ walletAddress: null });
  }

  return NextResponse.json({
    walletAddress: session.walletAddress,
    issuedAt: session.issuedAt,
  });
}
