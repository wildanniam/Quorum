import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const originRejection = rejectCrossOriginMutation(request);

  if (originRejection) return originRejection;

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
