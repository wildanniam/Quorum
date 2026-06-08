import { NextRequest, NextResponse } from "next/server";

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function requestOrigin(request: NextRequest) {
  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"));
  const host =
    forwardedHost ??
    firstHeaderValue(request.headers.get("host")) ??
    request.nextUrl.host;
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"));
  const protocol = forwardedProto ?? request.nextUrl.protocol.replace(/:$/, "");

  return `${protocol}://${host}`;
}

export function rejectCrossOriginMutation(request: NextRequest) {
  const originHeader = request.headers.get("origin");

  if (!originHeader) return null;

  let origin: string;

  try {
    origin = new URL(originHeader).origin;
  } catch {
    return NextResponse.json(
      { error: "Cross-origin mutation requests are not allowed." },
      { status: 403 },
    );
  }

  const allowedOrigins = new Set([request.nextUrl.origin, requestOrigin(request)]);

  if (!allowedOrigins.has(origin)) {
    return NextResponse.json(
      { error: "Cross-origin mutation requests are not allowed." },
      { status: 403 },
    );
  }

  return null;
}
