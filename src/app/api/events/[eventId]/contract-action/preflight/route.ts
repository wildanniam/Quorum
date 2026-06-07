import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { CONTRACT_ACTIONS } from "@/lib/stellar/action-policy";
import {
  LiveActionPreparationError,
  prepareLiveContractAction,
} from "@/lib/stellar/live-action";
import {
  LiveTransactionPreflightError,
  prepareLiveTransactionForSigning,
} from "@/lib/stellar/live-preflight";

type PreflightRouteContext = {
  params: Promise<{
    eventId: string;
  }>;
};

const preflightRequestSchema = z.object({
  action: z.enum(CONTRACT_ACTIONS),
  baseFee: z.string().trim().regex(/^\d+$/).optional(),
  timeoutSeconds: z.number().int().min(1).max(300).optional(),
  tokenId: z.string().trim().optional(),
});

function getSession(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

async function readJsonBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  context: PreflightRouteContext,
) {
  const session = getSession(request);

  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const parsed = preflightRequestSchema.safeParse(await readJsonBody(request));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid live transaction preflight request.",
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
    const preparedTransaction = await prepareLiveTransactionForSigning({
      baseFee: parsed.data.baseFee,
      preparedAction,
      timeoutSeconds: parsed.data.timeoutSeconds,
    });

    return NextResponse.json({
      preparedAction,
      preparedTransaction,
    });
  } catch (error) {
    if (error instanceof LiveActionPreparationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (error instanceof LiveTransactionPreflightError) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not preflight live transaction.",
      },
      { status: 400 },
    );
  }
}
