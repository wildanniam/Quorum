import { NextRequest, NextResponse } from "next/server";
import { runStellarEventIndexer } from "@/lib/stellar/indexer";

export const dynamic = "force-dynamic";

function optionalEnv(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function requireCronSecret(request: NextRequest) {
  const secret =
    optionalEnv(process.env.QUORUM_INDEXER_CRON_SECRET) ??
    optionalEnv(process.env.CRON_SECRET);

  if (!secret) return null;

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Indexer cron secret is required." },
      { status: 401 },
    );
  }

  return null;
}

function integerParam(value: string | null) {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return null;

  return Number(value);
}

export async function GET(request: NextRequest) {
  const rejection = requireCronSecret(request);

  if (rejection) return rejection;

  const limit = integerParam(request.nextUrl.searchParams.get("limit"));
  const startLedger = integerParam(request.nextUrl.searchParams.get("startLedger"));
  const cursor = request.nextUrl.searchParams.get("cursor");

  try {
    const result = await runStellarEventIndexer({
      ...(cursor ? { cursor } : {}),
      ...(limit ? { limit } : {}),
      ...(startLedger !== null ? { startLedger } : {}),
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not run Stellar event indexer.",
        ok: false,
      },
      { status: 500 },
    );
  }
}
