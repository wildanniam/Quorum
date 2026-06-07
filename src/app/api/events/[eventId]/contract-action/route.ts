import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { CONTRACT_ACTIONS } from "@/lib/stellar/action-policy";
import {
  LiveActionPreparationError,
  prepareLiveContractAction,
} from "@/lib/stellar/live-action";

type ContractActionRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

const prepareActionRequestSchema = z.object({
  action: z.enum(CONTRACT_ACTIONS),
  tokenId: z.string().trim().optional(),
});

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function GET(
  request: NextRequest,
  context: ContractActionRouteContext,
) {
  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const parsed = prepareActionRequestSchema.safeParse({
    action: searchParams.get("action"),
    tokenId: searchParams.get("tokenId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid live contract action request.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const { eventId } = await context.params;

  try {
    const preparedAction = prepareLiveContractAction({
      action: parsed.data.action,
      eventId,
      signerWallet: session.walletAddress,
      tokenId: parsed.data.tokenId,
    });

    return NextResponse.json(preparedAction);
  } catch (error) {
    if (error instanceof LiveActionPreparationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not prepare live contract action.",
      },
      { status: 400 },
    );
  }
}
