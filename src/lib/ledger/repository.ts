import { StrKey } from "@stellar/stellar-sdk";
import type { LedgerEntryKind, LedgerEntryRecord } from "@/lib/db/models";
import { query } from "@/lib/db/client";
import { stellarExpertTransactionUrl } from "@/lib/stellar/explorer";

type LedgerEntryRow = {
  id: string;
  kind: LedgerEntryKind;
  event_id: string;
  event_slug: string;
  event_title: string;
  wallet_address: string;
  amount_usdc: string;
  source_id: string;
  source_label: string;
  token_id: string | null;
  tx_hash: string | null;
  occurred_at: string;
};

export type LedgerSummary = {
  totalEarnedUsdc: string;
  totalWithdrawnUsdc: string;
  withdrawableUsdc: string;
  eventCount: number;
  entryCount: number;
};

function assertWalletAddress(walletAddress: string) {
  if (!StrKey.isValidEd25519PublicKey(walletAddress)) {
    throw new Error(`Invalid Stellar wallet address: ${walletAddress}`);
  }
}

function formatUsdc(value: number) {
  if (!Number.isFinite(value)) return "0";

  return value.toFixed(7).replace(/\.?0+$/, "");
}

function toLedgerEntryRecord(
  row: LedgerEntryRow,
  balanceAfterUsdc: number,
): LedgerEntryRecord {
  return {
    id: row.id,
    kind: row.kind,
    eventId: row.event_id,
    eventSlug: row.event_slug,
    eventTitle: row.event_title,
    walletAddress: row.wallet_address,
    amountUsdc: formatUsdc(Number(row.amount_usdc)),
    asset: "USDC",
    balanceAfterUsdc: formatUsdc(balanceAfterUsdc),
    explorerUrl: stellarExpertTransactionUrl(row.tx_hash),
    sourceId: row.source_id,
    sourceLabel: row.source_label,
    tokenId: row.token_id,
    txHash: row.tx_hash,
    occurredAt: row.occurred_at,
  };
}

async function listLedgerRows(walletAddress: string) {
  assertWalletAddress(walletAddress);

  return query<LedgerEntryRow>(
    `
    WITH ledger_rows AS (
      SELECT
        'credit:' || p.id || ':' || c.id AS id,
        'credit'::text AS kind,
        e.id AS event_id,
        e.slug AS event_slug,
        e.title AS event_title,
        c.wallet_address AS wallet_address,
        (CAST(p.amount_usdc AS numeric) * c.split_percentage / 100)::text AS amount_usdc,
        p.id AS source_id,
        'Checkout split credit'::text AS source_label,
        p.token_id AS token_id,
        p.tx_hash AS tx_hash,
        p.created_at AS occurred_at
      FROM collaborators c
      JOIN events e ON e.id = c.event_id
      JOIN purchases p ON p.event_id = e.id
      WHERE c.wallet_address = $1
        AND p.status = 'succeeded'
        AND CAST(p.amount_usdc AS numeric) > 0

      UNION ALL

      SELECT
        'debit:' || w.id AS id,
        'debit'::text AS kind,
        e.id AS event_id,
        e.slug AS event_slug,
        e.title AS event_title,
        w.collaborator_wallet AS wallet_address,
        w.amount_usdc AS amount_usdc,
        COALESCE(a.id, w.id) AS source_id,
        CASE
          WHEN a.provider = 'moneygram' THEN 'MoneyGram payout debit'
          WHEN a.provider = 'mock' THEN 'Anchor payout debit'
          ELSE 'Collaborator withdrawal'
        END::text AS source_label,
        NULL::text AS token_id,
        w.tx_hash AS tx_hash,
        w.created_at AS occurred_at
      FROM withdrawals w
      JOIN events e ON e.id = w.event_id
      LEFT JOIN anchor_payouts a ON a.withdrawal_id = w.id
      WHERE w.collaborator_wallet = $1
    )
    SELECT *
    FROM ledger_rows
    ORDER BY occurred_at ASC, id ASC
    `,
    [walletAddress],
  );
}

export async function listCollaboratorLedger(walletAddress: string) {
  const rows = await listLedgerRows(walletAddress);
  let balance = 0;
  const entries = rows.map((row) => {
    const amount = Number(row.amount_usdc);
    balance += row.kind === "credit" ? amount : -amount;
    return toLedgerEntryRecord(row, Math.max(balance, 0));
  });

  return entries.reverse();
}

export async function getCollaboratorLedgerSummary(
  walletAddress: string,
): Promise<LedgerSummary> {
  const entries = await listCollaboratorLedger(walletAddress);
  const totalEarned = entries
    .filter((entry) => entry.kind === "credit")
    .reduce((total, entry) => total + Number(entry.amountUsdc), 0);
  const totalWithdrawn = entries
    .filter((entry) => entry.kind === "debit")
    .reduce((total, entry) => total + Number(entry.amountUsdc), 0);
  const eventIds = new Set(entries.map((entry) => entry.eventId));

  return {
    totalEarnedUsdc: formatUsdc(totalEarned),
    totalWithdrawnUsdc: formatUsdc(totalWithdrawn),
    withdrawableUsdc: formatUsdc(Math.max(totalEarned - totalWithdrawn, 0)),
    eventCount: eventIds.size,
    entryCount: entries.length,
  };
}
