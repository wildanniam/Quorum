import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { publishDraftEventStub } from "@/lib/events/repository";

type PublishRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function POST(request: NextRequest, context: PublishRouteContext) {
  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const { eventId } = await context.params;

  try {
    return NextResponse.json(
      publishDraftEventStub(eventId, session.walletAddress),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not publish event.",
      },
      { status: 400 },
    );
  }
}
