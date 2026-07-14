import { NextRequest, NextResponse } from "next/server";
import { authorizeIndexerRequest } from "@/lib/stellar/indexer-auth";
import { runStellarEventIndexer } from "@/lib/stellar/indexer";

export const dynamic = "force-dynamic";

function requireCronSecret(request: NextRequest) {
  const authorization = authorizeIndexerRequest({
    authorization: request.headers.get("authorization"),
    secret: process.env.CRON_SECRET,
  });

  if (!authorization.authorized) {
    return NextResponse.json(
      { error: authorization.error, ok: false },
      { status: authorization.status },
    );
  }

  return null;
}

function integerParam(value: string | null) {
  if (!value) return null;
  if (!/^\d+$/.test(value)) {
    throw new Error("Indexer integer query parameters must be non-negative integers.");
  }

  return Number(value);
}

export async function GET(request: NextRequest) {
  const rejection = requireCronSecret(request);

  if (rejection) return rejection;

  try {
    const limit = integerParam(request.nextUrl.searchParams.get("limit"));
    const startLedger = integerParam(
      request.nextUrl.searchParams.get("startLedger"),
    );
    const cursor = request.nextUrl.searchParams.get("cursor")?.trim() || null;
    const result = await runStellarEventIndexer({
      ...(cursor ? { cursor } : {}),
      ...(limit !== null ? { limit } : {}),
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
      {
        status:
          error instanceof Error &&
          /query parameters|between 1 and 500|cannot be combined|indexer start ledger/i.test(
            error.message,
          )
            ? 400
            : error instanceof Error && /already active/i.test(error.message)
              ? 409
              : 500,
      },
    );
  }
}
