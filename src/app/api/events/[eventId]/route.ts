import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { updateDraftEventWithSetup } from "@/lib/events/repository";
import { createDraftEventRequestSchema } from "@/lib/events/validation";

type EventRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function PATCH(request: NextRequest, context: EventRouteContext) {
  const originRejection = rejectCrossOriginMutation(request);

  if (originRejection) return originRejection;

  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createDraftEventRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid event draft.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { eventId } = await context.params;
  const { collaborators, resources, ...eventInput } = parsed.data;

  try {
    const eventDraft = await updateDraftEventWithSetup({
      eventId,
      organizerWallet: session.walletAddress,
      input: {
        ...eventInput,
        priceUsdc: parsed.data.isFree ? "0" : parsed.data.priceUsdc,
      },
      collaborators,
      resources,
    });

    return NextResponse.json(eventDraft);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not update event draft.",
      },
      { status: 400 },
    );
  }
}
