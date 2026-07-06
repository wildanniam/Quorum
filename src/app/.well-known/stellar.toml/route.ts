import { NextRequest, NextResponse } from "next/server";

const DEFAULT_SIGNING_KEY =
  "GA3EWCMNMXYSRTMHHJNR5TXMISGTNUWAPFQWI7Z5R7HQJJHSTJ2YWV4W";

function tomlString(value: string) {
  return JSON.stringify(value);
}

function resolveOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || request.headers.get("host") || request.nextUrl.host;
  const protocol = forwardedProto || request.nextUrl.protocol.replace(/:$/, "");

  return `${protocol}://${host}`;
}

export function GET(request: NextRequest) {
  const origin = resolveOrigin(request);
  const signingKey =
    process.env.ANCHOR_CLIENT_SIGNING_PUBLIC_KEY?.trim() || DEFAULT_SIGNING_KEY;

  const body = [
    'VERSION="2.0.0"',
    'NETWORK_PASSPHRASE="Test SDF Network ; September 2015"',
    `SIGNING_KEY=${tomlString(signingKey)}`,
    `ACCOUNTS=[${tomlString(signingKey)}]`,
    "",
    "[DOCUMENTATION]",
    'ORG_NAME="Quorum"',
    `ORG_URL=${tomlString(origin)}`,
    'ORG_DESCRIPTION="Wallet-native event checkout, access proof, and collaborator payout rails on Stellar testnet."',
    "",
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
