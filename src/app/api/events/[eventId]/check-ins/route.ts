import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { markLocalPassCheckedIn } from "@/lib/events/repository";

type CheckInRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

const checkInRequestSchema = z.object({
  tokenId: z.string().min(3),
});

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

function statusForMessage(message: string) {
  if (message.includes("not found")) return 404;
  if (message.includes("already checked in")) return 409;
  if (message.includes("Only the event organizer")) return 403;
  return 400;
}

export async function POST(request: NextRequest, context: CheckInRouteContext) {
  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkInRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Token ID is required." },
      { status: 400 },
    );
  }

  const { eventId } = await context.params;

  try {
    return NextResponse.json(
      markLocalPassCheckedIn({
        checkedInByWallet: session.walletAddress,
        eventId,
        tokenId: parsed.data.tokenId,
      }),
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not check in pass.";

    return NextResponse.json(
      { error: message },
      { status: statusForMessage(message) },
    );
  }
}
