import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { rejectCrossOriginMutation } from "@/lib/auth/origin";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import {
  createDraftEventWithSetup,
  getEventBySlug,
  listOrganizerEvents,
  upsertUser,
} from "@/lib/events/repository";
import {
  createDraftEventRequestSchema,
  slugifyEventTitle,
} from "@/lib/events/validation";

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

async function createUniqueSlug(title: string) {
  const baseSlug = slugifyEventTitle(title);

  if (!(await getEventBySlug(baseSlug))) return baseSlug;

  return `${baseSlug}-${randomUUID().slice(0, 8)}`;
}

export async function GET(request: NextRequest) {
  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  return NextResponse.json({
    events: await listOrganizerEvents(session.walletAddress),
  });
}

export async function POST(request: NextRequest) {
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

  try {
    await upsertUser(session.walletAddress);

    const { collaborators, resources, ...eventInput } = parsed.data;
    const eventDraft = await createDraftEventWithSetup(
      {
        ...eventInput,
        slug: await createUniqueSlug(parsed.data.title),
        organizerWallet: session.walletAddress,
        priceUsdc: parsed.data.isFree ? "0" : parsed.data.priceUsdc,
      },
      collaborators,
      resources,
    );

    return NextResponse.json(eventDraft, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not create event draft.",
      },
      { status: 500 },
    );
  }
}
