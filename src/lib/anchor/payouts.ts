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
  getMoneyGramWithdrawalTransferInstructions,
  type MoneyGramSep24Transaction,
  type MoneyGramWithdrawalTransferInstructions,
} from "@/lib/anchor/moneygram/sep24";
import { usdcToAtomicUnits } from "@/lib/stellar/live-encoding";

type AnchorPayoutRow = {
  id: string;
  event_id: string;
  collaborator_wallet: string;
  amount_usdc: string;
  asset: "USDC";
  provider: AnchorPayoutProvider;
  status: AnchorPayoutStatus;
  anchor_transaction_id: string | null;
  stellar_transaction_id: string | null;
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
  settlement_tx_hash: string | null;
};

type AnchorPayoutOpportunityRow = {
  event_id: string;
  event_slug: string;
  event_title: string;
  settlement_amount_usdc: string;
  settlement_tx_hash: string;
  settled_at: string;
  withdrawal_id: string;
};

export type AnchorPayoutOpportunity = {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  settlementAmountUsdc: string;
  settlementTxHash: string;
  settledAt: string;
  withdrawalId: string;
};

export type AnchorPayoutWithEvent = AnchorPayoutRecord & {
  eventSlug: string;
  eventTitle: string;
  settlementTxHash: string | null;
};

export type CreateAnchorPayoutInput = {
  collaboratorWallet: string;
  eventId: string;
  moneyGramAuthToken?: string | null;
  withdrawalId: string;
};

export type SyncMoneyGramAnchorPayoutInput = {
  collaboratorWallet: string;
  moneyGramAuthToken?: string | null;
  payoutId: string;
};

export type SyncMoneyGramAnchorPayoutResult = {
  payout: AnchorPayoutRecord;
  transaction: MoneyGramSep24Transaction;
  transferInstructions: MoneyGramWithdrawalTransferInstructions | null;
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
    stellarTransactionId: row.stellar_transaction_id,
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
    settlementTxHash: row.settlement_tx_hash,
  };
}

type SettlementWithdrawalRow = {
  amount_usdc: string;
  event_status: "draft" | "published";
  id: string;
};

async function getSettlementWithdrawal(
  eventId: string,
  withdrawalId: string,
  collaboratorWallet: string,
  db: DatabaseClient,
) {
  return queryOne<SettlementWithdrawalRow>(
    `
    SELECT
      w.id,
      w.amount_usdc,
      e.status AS event_status
    FROM withdrawals w
    JOIN events e ON e.id = w.event_id
    JOIN collaborators c ON c.event_id = w.event_id
      AND c.wallet_address = w.collaborator_wallet
    WHERE w.id = $1
      AND w.event_id = $2
      AND w.collaborator_wallet = $3
    FOR UPDATE OF w
    `,
    [withdrawalId, eventId, collaboratorWallet],
    db,
  );
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
  collaboratorWallet,
  eventId,
  moneyGramAuthToken,
  withdrawalId,
}: CreateAnchorPayoutInput) {
  assertWalletAddress(collaboratorWallet);

  return withTransaction(async (db) => {
    const settlement = await getSettlementWithdrawal(
      eventId,
      withdrawalId,
      collaboratorWallet,
      db,
    );

    if (!settlement) {
      throw new Error("Completed contract settlement not found for this wallet.");
    }

    if (settlement.event_status !== "published") {
      throw new Error("Only published events can be paid out.");
    }

    const existingPayout = await queryOne<{ id: string }>(
      "SELECT id FROM anchor_payouts WHERE withdrawal_id = $1 LIMIT 1",
      [settlement.id],
      db,
    );

    if (existingPayout) {
      throw new Error("This contract settlement already has a cash-out request.");
    }

    const requestedAmount = settlement.amount_usdc;
    assertUsdcAmount(requestedAmount);
    const payoutId = createId("apo");
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
        anchor_transaction_id, reference_number, pickup_url, withdrawal_id,
        metadata_json
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
        settlement.id,
        providerResult.metadataJson,
      ],
      db,
    );

    return {
      payout: toAnchorPayoutRecord(payoutRow as AnchorPayoutRow),
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

    if (transaction.id !== payout.anchor_transaction_id) {
      throw new Error("MoneyGram returned a different anchor transaction id.");
    }

    if (transaction.kind && transaction.kind.toLowerCase() !== "withdrawal") {
      throw new Error("MoneyGram returned a non-withdrawal transaction.");
    }

    if (
      transaction.amountIn &&
      usdcToAtomicUnits(transaction.amountIn) !==
        usdcToAtomicUnits(payout.amount_usdc)
    ) {
      throw new Error("MoneyGram transfer amount does not match the settled USDC amount.");
    }

    const status = mapMoneyGramSep24Status(transaction.status);
    const txHash = normalizeLiveTransactionHash(transaction.stellarTransactionId);
    const transferInstructions = getMoneyGramWithdrawalTransferInstructions({
      expectedAmountUsdc: payout.amount_usdc,
      transaction,
    });

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
      transferInstructions,
    };
    const updated = await queryOne<AnchorPayoutRow>(
      `
      UPDATE anchor_payouts
      SET
        status = $2,
        pickup_url = COALESCE($3, pickup_url),
        stellar_transaction_id = COALESCE($4, stellar_transaction_id),
        reference_number = COALESCE($5, reference_number),
        failure_reason = $6,
        metadata_json = COALESCE(metadata_json, '{}'::jsonb) || $7::jsonb
      WHERE id = $1
      RETURNING *
      `,
      [
        payout.id,
        status,
        transaction.moreInfoUrl,
        txHash,
        transaction.externalTransactionId,
        failureReasonForMoneyGramTransaction(status, transaction),
        JSON.stringify(metadataPatch),
      ],
      db,
    );

    return {
      payout: toAnchorPayoutRecord(updated as AnchorPayoutRow),
      transaction,
      transferInstructions,
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
        w.tx_hash AS settlement_tx_hash
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
    SELECT
      e.id AS event_id,
      e.slug AS event_slug,
      e.title AS event_title,
      w.amount_usdc AS settlement_amount_usdc,
      w.tx_hash AS settlement_tx_hash,
      w.created_at AS settled_at,
      w.id AS withdrawal_id
    FROM withdrawals w
    JOIN events e ON e.id = w.event_id
    LEFT JOIN anchor_payouts a ON a.withdrawal_id = w.id
    WHERE w.collaborator_wallet = $1
      AND e.status = 'published'
      AND a.id IS NULL
    ORDER BY w.created_at DESC, e.title ASC
    `,
    [walletAddress],
  );

  return rows.map((row): AnchorPayoutOpportunity => ({
    eventId: row.event_id,
    eventSlug: row.event_slug,
    eventTitle: row.event_title,
    settlementAmountUsdc: formatUsdc(Number(row.settlement_amount_usdc)),
    settlementTxHash: row.settlement_tx_hash,
    settledAt: row.settled_at,
    withdrawalId: row.withdrawal_id,
  }));
}
