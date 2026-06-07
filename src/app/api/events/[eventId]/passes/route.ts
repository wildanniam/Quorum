import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { createLocalPassProof } from "@/lib/events/repository";

type PassRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

function statusForMessage(message: string) {
  if (message.includes("already owns")) return 409;
  if (message.includes("sold out")) return 409;
  if (message.includes("not found")) return 404;
  return 400;
}

export async function POST(request: NextRequest, context: PassRouteContext) {
  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const { eventId } = await context.params;

  try {
    return NextResponse.json(
      createLocalPassProof(eventId, session.walletAddress),
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create event pass.";

    return NextResponse.json(
      { error: message },
      { status: statusForMessage(message) },
    );
  }
}
