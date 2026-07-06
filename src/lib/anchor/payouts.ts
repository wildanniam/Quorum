import { StrKey } from "@stellar/stellar-sdk";
import { createId } from "@/lib/db/ids";
import type {
  AnchorPayoutProvider,
  AnchorPayoutRecord,
  AnchorPayoutStatus,
} from "@/lib/db/models";
import { query, queryOne, withTransaction, type DatabaseClient } from "@/lib/db/client";
import { getAnchorPayoutProvider } from "@/lib/anchor/provider";
import {
  fetchMoneyGramSep24Transaction,
  type MoneyGramSep24Transaction,
} from "@/lib/anchor/moneygram/sep24";

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

type AnchorPayoutEventRow = AnchorPayoutRow & {
  event_slug: string;
  event_title: string;
  withdrawal_tx_hash: string | null;
};

type EventCollaboratorRow = {
  event_id: string;
  event_status: "draft" | "published";
  split_percentage: number;
};

type AnchorPayoutOpportunityRow = {
  event_id: string;
  event_slug: string;
  event_title: string;
  earned_usdc: number;
  reserved_usdc: number;
  withdrawn_usdc: number;
};

export type AnchorPayoutAvailability = {
  availableUsdc: string;
  earnedUsdc: string;
  reservedUsdc: string;
  withdrawnUsdc: string;
};

export type AnchorPayoutOpportunity = AnchorPayoutAvailability & {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
};

export type AnchorPayoutWithEvent = AnchorPayoutRecord & {
  eventSlug: string;
  eventTitle: string;
  withdrawalTxHash: string | null;
};

export type CreateAnchorPayoutInput = {
  amountUsdc?: string | null;
  collaboratorWallet: string;
  eventId: string;
  moneyGramAuthToken?: string | null;
};

export type SyncMoneyGramAnchorPayoutInput = {
  collaboratorWallet: string;
  moneyGramAuthToken?: string | null;
  payoutId: string;
};

export type SyncMoneyGramAnchorPayoutResult = {
  payout: AnchorPayoutRecord;
  transaction: MoneyGramSep24Transaction;
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

function toAnchorPayoutWithEvent(row: AnchorPayoutEventRow): AnchorPayoutWithEvent {
  return {
    ...toAnchorPayoutRecord(row),
    eventSlug: row.event_slug,
    eventTitle: row.event_title,
    withdrawalTxHash: row.withdrawal_tx_hash,
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
      AND (
        status IN ('requested', 'pending_anchor')
        OR (status = 'ready_for_pickup' AND withdrawal_id IS NULL)
      )
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

function shouldCreateWithdrawalForPayout(status: AnchorPayoutStatus) {
  return status === "completed" || status === "ready_for_pickup";
}

function normalizeLiveTransactionHash(value: string | null) {
  if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) return null;

  return value.toLowerCase();
}

export function mapMoneyGramSep24Status(status: string): AnchorPayoutStatus {
  const normalized = status.trim().toLowerCase();

  if (normalized === "completed") return "completed";
  if (normalized === "pending_user_transfer_complete") return "ready_for_pickup";
  if (normalized === "refunded") return "cancelled";
  if (
    [
      "error",
      "expired",
      "no_market",
      "too_large",
      "too_small",
      "transaction_error",
    ].includes(normalized)
  ) {
    return "failed";
  }
  if (normalized === "incomplete") return "requested";

  return "pending_anchor";
}

function failureReasonForMoneyGramTransaction(
  status: AnchorPayoutStatus,
  transaction: MoneyGramSep24Transaction,
) {
  if (status !== "failed" && status !== "cancelled") return null;

  return transaction.message ?? `MoneyGram transaction status: ${transaction.status}`;
}

export async function createAnchorPayout({
  amountUsdc,
  collaboratorWallet,
  eventId,
  moneyGramAuthToken,
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
      moneyGramAuthToken,
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

    let updatedPayoutRow = payoutRow;

    if (shouldCreateWithdrawalForPayout(providerResult.status)) {
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

      updatedPayoutRow = await queryOne<AnchorPayoutRow>(
        `
        UPDATE anchor_payouts
        SET withdrawal_id = $2
        WHERE id = $1
        RETURNING *
        `,
        [payoutId, withdrawalId],
        db,
      );
    }

    return {
      availabilityBefore: availability,
      payout: toAnchorPayoutRecord(updatedPayoutRow ?? (payoutRow as AnchorPayoutRow)),
    };
  });
}

export const createMockAnchorPayout = createAnchorPayout;

export async function syncMoneyGramAnchorPayout({
  collaboratorWallet,
  moneyGramAuthToken,
  payoutId,
}: SyncMoneyGramAnchorPayoutInput): Promise<SyncMoneyGramAnchorPayoutResult> {
  assertWalletAddress(collaboratorWallet);

  if (!moneyGramAuthToken?.trim()) {
    throw new Error("MoneyGram wallet authorization required.");
  }

  return withTransaction(async (db) => {
    const payout = await queryOne<AnchorPayoutRow>(
      `
      SELECT *
      FROM anchor_payouts
      WHERE id = $1 AND collaborator_wallet = $2
      FOR UPDATE
      `,
      [payoutId, collaboratorWallet],
      db,
    );

    if (!payout) {
      throw new Error("Anchor payout not found.");
    }

    if (payout.provider !== "moneygram") {
      throw new Error("Only MoneyGram anchor payouts can be synced.");
    }

    if (!payout.anchor_transaction_id) {
      throw new Error("MoneyGram anchor transaction id is missing.");
    }

    const transaction = await fetchMoneyGramSep24Transaction({
      authToken: moneyGramAuthToken,
      id: payout.anchor_transaction_id,
    });
    const status = mapMoneyGramSep24Status(transaction.status);
    const txHash = normalizeLiveTransactionHash(transaction.stellarTransactionId);
    let withdrawalId = payout.withdrawal_id;

    if (txHash && shouldCreateWithdrawalForPayout(status) && !withdrawalId) {
      const fallbackWithdrawalId = createId("wdr");
      const withdrawal = await queryOne<{ id: string }>(
        `
        INSERT INTO withdrawals (
          id, event_id, collaborator_wallet, amount_usdc, tx_hash
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tx_hash) DO UPDATE
        SET tx_hash = EXCLUDED.tx_hash
        RETURNING id
        `,
        [
          fallbackWithdrawalId,
          payout.event_id,
          payout.collaborator_wallet,
          payout.amount_usdc,
          txHash,
        ],
        db,
      );

      withdrawalId = withdrawal?.id ?? fallbackWithdrawalId;
    }

    const metadataPatch = {
      moneygramStatus: transaction.status,
      moneygramTransaction: {
        amountIn: transaction.amountIn,
        externalTransactionId: transaction.externalTransactionId,
        id: transaction.id,
        kind: transaction.kind,
        moreInfoUrl: transaction.moreInfoUrl,
        status: transaction.status,
        stellarTransactionId: transaction.stellarTransactionId,
        withdrawAnchorAccount: transaction.withdrawAnchorAccount,
        withdrawMemo: transaction.withdrawMemo,
        withdrawMemoType: transaction.withdrawMemoType,
      },
      syncedAt: new Date().toISOString(),
    };
    const updated = await queryOne<AnchorPayoutRow>(
      `
      UPDATE anchor_payouts
      SET
        status = $2,
        pickup_url = COALESCE($3, pickup_url),
        withdrawal_id = COALESCE($4, withdrawal_id),
        failure_reason = $5,
        metadata_json = COALESCE(metadata_json, '{}'::jsonb) || $6::jsonb
      WHERE id = $1
      RETURNING *
      `,
      [
        payout.id,
        status,
        transaction.moreInfoUrl,
        withdrawalId,
        failureReasonForMoneyGramTransaction(status, transaction),
        JSON.stringify(metadataPatch),
      ],
      db,
    );

    return {
      payout: toAnchorPayoutRecord(updated as AnchorPayoutRow),
      transaction,
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

export async function listAnchorPayoutsWithEventsByWallet(walletAddress: string) {
  assertWalletAddress(walletAddress);

  return (
    await query<AnchorPayoutEventRow>(
      `
      SELECT
        a.*,
        e.slug AS event_slug,
        e.title AS event_title,
        w.tx_hash AS withdrawal_tx_hash
      FROM anchor_payouts a
      JOIN events e ON e.id = a.event_id
      LEFT JOIN withdrawals w ON w.id = a.withdrawal_id
      WHERE a.collaborator_wallet = $1
      ORDER BY a.created_at DESC
      `,
      [walletAddress],
    )
  ).map(toAnchorPayoutWithEvent);
}

export async function listAnchorPayoutOpportunities(walletAddress: string) {
  assertWalletAddress(walletAddress);

  const rows = await query<AnchorPayoutOpportunityRow>(
    `
    WITH event_revenue AS (
      SELECT
        e.id AS event_id,
        COALESCE(SUM(CAST(p.amount_usdc AS double precision)), 0)::float8 AS revenue_usdc
      FROM events e
      LEFT JOIN purchases p ON p.event_id = e.id
        AND p.status = 'succeeded'
        AND CAST(p.amount_usdc AS numeric) > 0
      GROUP BY e.id
    ),
    withdrawn AS (
      SELECT
        event_id,
        collaborator_wallet,
        COALESCE(SUM(CAST(amount_usdc AS double precision)), 0)::float8 AS withdrawn_usdc
      FROM withdrawals
      WHERE collaborator_wallet = $1
      GROUP BY event_id, collaborator_wallet
    ),
    reserved AS (
      SELECT
        event_id,
        collaborator_wallet,
        COALESCE(SUM(CAST(amount_usdc AS double precision)), 0)::float8 AS reserved_usdc
      FROM anchor_payouts
      WHERE collaborator_wallet = $1
        AND status IN ('requested', 'pending_anchor')
      GROUP BY event_id, collaborator_wallet
    )
    SELECT
      e.id AS event_id,
      e.slug AS event_slug,
      e.title AS event_title,
      (er.revenue_usdc * c.split_percentage / 100)::float8 AS earned_usdc,
      COALESCE(r.reserved_usdc, 0)::float8 AS reserved_usdc,
      COALESCE(w.withdrawn_usdc, 0)::float8 AS withdrawn_usdc
    FROM collaborators c
    JOIN events e ON e.id = c.event_id
    JOIN event_revenue er ON er.event_id = e.id
    LEFT JOIN withdrawn w ON w.event_id = e.id
      AND w.collaborator_wallet = c.wallet_address
    LEFT JOIN reserved r ON r.event_id = e.id
      AND r.collaborator_wallet = c.wallet_address
    WHERE c.wallet_address = $1
      AND e.status = 'published'
    ORDER BY e.start_date_time DESC, e.title ASC
    `,
    [walletAddress],
  );

  return rows.map((row): AnchorPayoutOpportunity => {
    const earnedUsdc = Number(row.earned_usdc);
    const withdrawnUsdc = Number(row.withdrawn_usdc);
    const reservedUsdc = Number(row.reserved_usdc);

    return {
      availableUsdc: formatUsdc(Math.max(earnedUsdc - withdrawnUsdc - reservedUsdc, 0)),
      earnedUsdc: formatUsdc(earnedUsdc),
      eventId: row.event_id,
      eventSlug: row.event_slug,
      eventTitle: row.event_title,
      reservedUsdc: formatUsdc(reservedUsdc),
      withdrawnUsdc: formatUsdc(withdrawnUsdc),
    };
  });
}
