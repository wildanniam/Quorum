import { StrKey } from "@stellar/stellar-sdk";
import { createId } from "@/lib/db/ids";
import type {
  AnchorPayoutProvider,
  AnchorPayoutRecord,
  AnchorPayoutStatus,
} from "@/lib/db/models";
import { query, queryOne, withTransaction, type DatabaseClient } from "@/lib/db/client";
import { getAnchorPayoutProvider } from "@/lib/anchor/provider";

type AnchorPayoutRow = {
  id: string;
  event_id: string;
  collaborator_wallet: string;
  amount_usdc: string;
  asset: "USDC";
  provider: AnchorPayoutProvider;
  status: AnchorPayoutStatus;
  anchor_transaction_id: string | null;
  reference_number: string | null;
  pickup_url: string | null;
  withdrawal_id: string | null;
  failure_reason: string | null;
  metadata_json: unknown;
  created_at: string;
  updated_at: string;
};

type EventCollaboratorRow = {
  event_id: string;
  event_status: "draft" | "published";
  split_percentage: number;
};

export type AnchorPayoutAvailability = {
  availableUsdc: string;
  earnedUsdc: string;
  reservedUsdc: string;
  withdrawnUsdc: string;
};

export type CreateAnchorPayoutInput = {
  amountUsdc?: string | null;
  collaboratorWallet: string;
  eventId: string;
};

function assertWalletAddress(walletAddress: string) {
  if (!StrKey.isValidEd25519PublicKey(walletAddress)) {
    throw new Error(`Invalid Stellar wallet address: ${walletAddress}`);
  }
}

function assertUsdcAmount(amountUsdc: string) {
  if (!/^\d+(\.\d{1,7})?$/.test(amountUsdc) || Number(amountUsdc) <= 0) {
    throw new Error("Enter a positive USDC amount with up to 7 decimals.");
  }
}

function formatUsdc(value: number) {
  if (!Number.isFinite(value)) return "0";

  return value.toFixed(7).replace(/\.?0+$/, "");
}

function toAnchorPayoutRecord(row: AnchorPayoutRow): AnchorPayoutRecord {
  return {
    anchorTransactionId: row.anchor_transaction_id,
    amountUsdc: row.amount_usdc,
    asset: row.asset,
    collaboratorWallet: row.collaborator_wallet,
    createdAt: row.created_at,
    eventId: row.event_id,
    failureReason: row.failure_reason,
    id: row.id,
    metadataJson: row.metadata_json,
    pickupUrl: row.pickup_url,
    provider: row.provider,
    referenceNumber: row.reference_number,
    status: row.status,
    updatedAt: row.updated_at,
    withdrawalId: row.withdrawal_id,
  };
}

async function getEventCollaborator(
  eventId: string,
  collaboratorWallet: string,
  db?: DatabaseClient,
) {
  return queryOne<EventCollaboratorRow>(
    `
    SELECT
      e.id AS event_id,
      e.status AS event_status,
      c.split_percentage AS split_percentage
    FROM events e
    JOIN collaborators c ON c.event_id = e.id
    WHERE e.id = $1 AND c.wallet_address = $2
    LIMIT 1
    `,
    [eventId, collaboratorWallet],
    db,
  );
}

async function getEventRevenueUsdc(eventId: string, db?: DatabaseClient) {
  const row = await queryOne<{ total: number }>(
    `
    SELECT COALESCE(SUM(CAST(amount_usdc AS double precision)), 0)::float8 AS total
    FROM purchases
    WHERE event_id = $1 AND status = 'succeeded'
    `,
    [eventId],
    db,
  );

  return Number(row?.total ?? 0);
}

async function getWithdrawnUsdc(
  eventId: string,
  collaboratorWallet: string,
  db?: DatabaseClient,
) {
  const row = await queryOne<{ total: number }>(
    `
    SELECT COALESCE(SUM(CAST(amount_usdc AS double precision)), 0)::float8 AS total
    FROM withdrawals
    WHERE event_id = $1 AND collaborator_wallet = $2
    `,
    [eventId, collaboratorWallet],
    db,
  );

  return Number(row?.total ?? 0);
}

async function getReservedAnchorPayoutUsdc(
  eventId: string,
  collaboratorWallet: string,
  db?: DatabaseClient,
) {
  const row = await queryOne<{ total: number }>(
    `
    SELECT COALESCE(SUM(CAST(amount_usdc AS double precision)), 0)::float8 AS total
    FROM anchor_payouts
    WHERE event_id = $1
      AND collaborator_wallet = $2
      AND status IN ('requested', 'pending_anchor')
    `,
    [eventId, collaboratorWallet],
    db,
  );

  return Number(row?.total ?? 0);
}

export async function getAnchorPayoutAvailability(
  eventId: string,
  collaboratorWallet: string,
  db?: DatabaseClient,
): Promise<AnchorPayoutAvailability> {
  assertWalletAddress(collaboratorWallet);

  const collaborator = await getEventCollaborator(eventId, collaboratorWallet, db);

  if (!collaborator) {
    throw new Error("Connected wallet is not a collaborator for this event.");
  }

  const revenueUsdc = await getEventRevenueUsdc(eventId, db);
  const withdrawnUsdc = await getWithdrawnUsdc(eventId, collaboratorWallet, db);
  const reservedUsdc = await getReservedAnchorPayoutUsdc(
    eventId,
    collaboratorWallet,
    db,
  );
  const earnedUsdc = (revenueUsdc * Number(collaborator.split_percentage)) / 100;

  return {
    availableUsdc: formatUsdc(Math.max(earnedUsdc - withdrawnUsdc - reservedUsdc, 0)),
    earnedUsdc: formatUsdc(earnedUsdc),
    reservedUsdc: formatUsdc(reservedUsdc),
    withdrawnUsdc: formatUsdc(withdrawnUsdc),
  };
}

export async function createMockAnchorPayout({
  amountUsdc,
  collaboratorWallet,
  eventId,
}: CreateAnchorPayoutInput) {
  assertWalletAddress(collaboratorWallet);

  return withTransaction(async (db) => {
    const collaborator = await getEventCollaborator(eventId, collaboratorWallet, db);

    if (!collaborator) {
      throw new Error("Connected wallet is not a collaborator for this event.");
    }

    if (collaborator.event_status !== "published") {
      throw new Error("Only published events can be paid out.");
    }

    const availability = await getAnchorPayoutAvailability(
      eventId,
      collaboratorWallet,
      db,
    );

    if (Number(availability.availableUsdc) <= 0.0000001) {
      throw new Error("No withdrawable balance is available.");
    }

    const requestedAmount = amountUsdc?.trim() || availability.availableUsdc;

    assertUsdcAmount(requestedAmount);

    if (Number(requestedAmount) - Number(availability.availableUsdc) > 0.0000001) {
      throw new Error("Anchor payout amount exceeds withdrawable balance.");
    }

    const payoutId = createId("apo");
    const withdrawalId = createId("wdr");
    const provider = getAnchorPayoutProvider();
    const providerResult = await provider.createPayout({
      amountUsdc: requestedAmount,
      collaboratorWallet,
      eventId,
      payoutId,
    });
    const payoutRow = await queryOne<AnchorPayoutRow>(
      `
      INSERT INTO anchor_payouts (
        id, event_id, collaborator_wallet, amount_usdc, provider, status,
        anchor_transaction_id, reference_number, pickup_url, metadata_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        payoutId,
        eventId,
        collaboratorWallet,
        requestedAmount,
        providerResult.provider,
        providerResult.status,
        providerResult.anchorTransactionId,
        providerResult.referenceNumber,
        providerResult.pickupUrl,
        providerResult.metadataJson,
      ],
      db,
    );

    await queryOne(
      `
      INSERT INTO withdrawals (
        id, event_id, collaborator_wallet, amount_usdc, tx_hash
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        withdrawalId,
        eventId,
        collaboratorWallet,
        requestedAmount,
        `stub:anchor-payout:${payoutId}`,
      ],
      db,
    );

    const updatedPayoutRow = await queryOne<AnchorPayoutRow>(
      `
      UPDATE anchor_payouts
      SET withdrawal_id = $2
      WHERE id = $1
      RETURNING *
      `,
      [payoutId, withdrawalId],
      db,
    );

    return {
      availabilityBefore: availability,
      payout: toAnchorPayoutRecord(updatedPayoutRow ?? (payoutRow as AnchorPayoutRow)),
    };
  });
}

export async function listAnchorPayoutsByWallet(walletAddress: string) {
  assertWalletAddress(walletAddress);

  return (
    await query<AnchorPayoutRow>(
      `
      SELECT *
      FROM anchor_payouts
      WHERE collaborator_wallet = $1
      ORDER BY created_at DESC
      `,
      [walletAddress],
    )
  ).map(toAnchorPayoutRecord);
}
