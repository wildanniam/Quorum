import type {
  CheckInRecord,
  EventRecord,
  PassRecord,
  PurchaseRecord,
} from "@/lib/db/models";
import { queryOne } from "@/lib/db/client";
import { getPassByTokenId } from "@/lib/events/repository";
import {
  isLiveTransactionHash,
  stellarExpertTransactionUrl,
} from "@/lib/stellar/explorer";

type CheckInLookupRow = {
  id: string;
  event_id: string;
  token_id: string;
  owner_wallet: string;
  checked_in_by_wallet: string;
  tx_hash: string | null;
  created_at: string;
};

export type ReceiptProofKind =
  | "check_in"
  | "metadata"
  | "mint"
  | "payment"
  | "publish";

export type ReceiptProofStatus = "live" | "local" | "metadata" | "pending";

export type ReceiptProofRow = {
  description: string;
  explorerUrl: string | null;
  kind: ReceiptProofKind;
  label: string;
  status: ReceiptProofStatus;
  value: string | null;
};

export type PassReceipt = {
  checkIn: CheckInRecord | null;
  event: EventRecord;
  eventProofUrl: string;
  pass: PassRecord;
  purchase: PurchaseRecord | null;
  receiptNumber: string;
  resourceUrl: string;
  rows: ReceiptProofRow[];
};

function toCheckInRecord(row: CheckInLookupRow): CheckInRecord {
  return {
    checkedInByWallet: row.checked_in_by_wallet,
    createdAt: row.created_at,
    eventId: row.event_id,
    id: row.id,
    ownerWallet: row.owner_wallet,
    tokenId: row.token_id,
    txHash: row.tx_hash,
  };
}

function proofStatus(value: string | null | undefined): ReceiptProofStatus {
  if (!value) return "pending";
  if (value.startsWith("sha256:")) return "metadata";
  if (value.startsWith("stub:") || value.includes("stub")) return "local";
  if (isLiveTransactionHash(value)) return "live";

  return "metadata";
}

function proofRow({
  description,
  kind,
  label,
  value,
}: {
  description: string;
  kind: ReceiptProofKind;
  label: string;
  value: string | null | undefined;
}): ReceiptProofRow {
  const normalizedValue = value?.trim() || null;

  return {
    description,
    explorerUrl: stellarExpertTransactionUrl(normalizedValue),
    kind,
    label,
    status: proofStatus(normalizedValue),
    value: normalizedValue,
  };
}

async function getLatestCheckInForPass(eventId: string, tokenId: string | null) {
  if (!tokenId) return null;

  const row = await queryOne<CheckInLookupRow>(
    `
    SELECT *
    FROM check_ins
    WHERE event_id = $1 AND token_id = $2
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [eventId, tokenId],
  );

  return row ? toCheckInRecord(row) : null;
}

export async function getPassReceipt(tokenId: string): Promise<PassReceipt | null> {
  const proof = await getPassByTokenId(tokenId);

  if (!proof) return null;

  const { event, pass, purchase } = proof;
  const checkIn = await getLatestCheckInForPass(event.id, pass.tokenId);
  const receiptToken = pass.tokenId ?? pass.id;

  return {
    checkIn,
    event,
    eventProofUrl: `/events/${event.slug}/proof`,
    pass,
    purchase,
    receiptNumber: receiptToken,
    resourceUrl: `/events/${event.slug}/resources`,
    rows: [
      proofRow({
        description: "Event publication proof from Quorum event setup.",
        kind: "publish",
        label: "Publish proof",
        value: event.publishTxHash,
      }),
      proofRow({
        description: "USDC checkout or free-claim record for this pass.",
        kind: "payment",
        label: purchase?.amountUsdc === "0" ? "Claim proof" : "Payment proof",
        value: purchase?.txHash,
      }),
      proofRow({
        description: "Pass mint proof tied to this wallet-bound token.",
        kind: "mint",
        label: "Mint proof",
        value: pass.mintTxHash,
      }),
      proofRow({
        description: "Metadata fingerprint for the non-transferable pass.",
        kind: "metadata",
        label: "Metadata hash",
        value: pass.metadataHash,
      }),
      proofRow({
        description: "Door check-in proof recorded by the organizer wallet.",
        kind: "check_in",
        label: "Check-in proof",
        value: checkIn?.txHash,
      }),
    ],
  };
}
