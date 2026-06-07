import { createHash } from "node:crypto";
import { StrKey } from "@stellar/stellar-sdk";
import type {
  CollaboratorRecord,
  EventRecord,
  ResourceRecord,
} from "@/lib/db/models";

export const USDC_DECIMALS = 7;
export const BPS_DENOMINATOR = 10_000;

export type SplitRecipientArgs = {
  wallet: string;
  percentBps: number;
};

export type CreateEventContractArgs = {
  organizer: string;
  eventIdHex: string;
  priceAtomic: string;
  currencyContractId: string;
  capacity: number;
  isFree: boolean;
  splits: SplitRecipientArgs[];
  metadataHashHex: string;
  passContractId: string;
};

export type PurchaseContractArgs = {
  buyer: string;
  eventIdHex: string;
  amountAtomic: string;
  metadataUri: string;
  metadataHashHex: string;
};

export type CheckInContractArgs = {
  organizer: string;
  eventIdHex: string;
  tokenId: string;
};

export type WithdrawContractArgs = {
  collaborator: string;
  eventIdHex: string;
};

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
}

function assertWalletAddress(walletAddress: string, label: string) {
  if (!StrKey.isValidEd25519PublicKey(walletAddress)) {
    throw new Error(`${label} must be a valid Stellar public key.`);
  }
}

function assertContractId(contractId: string, label: string) {
  if (!StrKey.isValidContract(contractId)) {
    throw new Error(`${label} must be a valid Stellar contract ID.`);
  }
}

export function deriveEventIdHex(eventId: string) {
  if (!eventId.trim()) {
    throw new Error("Event ID is required.");
  }

  return sha256Hex(`quorum:event:${eventId}`);
}

export function normalizeMetadataHashHex(value: string) {
  const normalized = value.trim().replace(/^sha256:/i, "");

  if (/^[a-f0-9]{64}$/i.test(normalized)) {
    return normalized.toLowerCase();
  }

  return sha256Hex(value);
}

export function usdcToAtomicUnits(amountUsdc: string, decimals = USDC_DECIMALS) {
  const value = amountUsdc.trim();

  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error("USDC amount must be a non-negative decimal string.");
  }

  const [whole, fraction = ""] = value.split(".");

  if (fraction.length > decimals) {
    throw new Error(`USDC amount supports at most ${decimals} decimal places.`);
  }

  return BigInt(`${whole}${fraction.padEnd(decimals, "0")}`);
}

export function splitPercentageToBps(splitPercentage: number) {
  if (!Number.isFinite(splitPercentage)) {
    throw new Error("Split percentage must be finite.");
  }

  const bps = Math.round(splitPercentage * 100);

  if (bps < 0 || bps > BPS_DENOMINATOR) {
    throw new Error("Split percentage must be between 0 and 100.");
  }

  return bps;
}

export function buildEventMetadataHashHex({
  collaborators,
  event,
  resources,
}: {
  collaborators: CollaboratorRecord[];
  event: EventRecord;
  resources: ResourceRecord[];
}) {
  return sha256Hex(
    stableJson({
      capacity: event.capacity,
      collaborators: collaborators.map((collaborator) => ({
        role: collaborator.role,
        splitPercentage: collaborator.splitPercentage,
        walletAddress: collaborator.walletAddress,
      })),
      eventId: event.id,
      locationType: event.locationType,
      priceUsdc: event.priceUsdc,
      resources: resources.map((resource) => ({
        sortOrder: resource.sortOrder,
        title: resource.title,
        type: resource.type,
        url: resource.url,
      })),
      slug: event.slug,
      startDateTime: event.startDateTime,
      title: event.title,
    }),
  );
}

export function buildPassMetadataUri(event: EventRecord, buyerWallet: string) {
  assertWalletAddress(buyerWallet, "Buyer wallet");

  return `quorum://events/${event.slug}/passes/${buyerWallet}`;
}

export function buildPassMetadataHashHex(event: EventRecord, buyerWallet: string) {
  return sha256Hex(
    stableJson({
      buyerWallet,
      eventId: event.id,
      eventMetadataHash: event.metadataHash,
      slug: event.slug,
    }),
  );
}

export function prepareCreateEventContractArgs({
  collaborators,
  event,
  passContractId,
  resources,
  usdcContractId,
}: {
  collaborators: CollaboratorRecord[];
  event: EventRecord;
  passContractId: string;
  resources: ResourceRecord[];
  usdcContractId: string;
}): CreateEventContractArgs {
  assertWalletAddress(event.organizerWallet, "Organizer wallet");
  assertContractId(passContractId, "Pass contract ID");
  assertContractId(usdcContractId, "USDC contract ID");

  const splits = collaborators.map((collaborator) => {
    assertWalletAddress(collaborator.walletAddress, "Collaborator wallet");

    return {
      wallet: collaborator.walletAddress,
      percentBps: splitPercentageToBps(collaborator.splitPercentage),
    };
  });
  const splitTotal = splits.reduce((total, split) => total + split.percentBps, 0);

  if (splitTotal !== BPS_DENOMINATOR) {
    throw new Error("Collaborator split bps must total 10000.");
  }

  return {
    organizer: event.organizerWallet,
    eventIdHex: deriveEventIdHex(event.id),
    priceAtomic: (event.isFree ? BigInt(0) : usdcToAtomicUnits(event.priceUsdc)).toString(),
    currencyContractId: usdcContractId,
    capacity: event.capacity,
    isFree: event.isFree,
    splits,
    metadataHashHex: buildEventMetadataHashHex({ collaborators, event, resources }),
    passContractId,
  };
}

export function preparePurchaseContractArgs({
  buyerWallet,
  event,
}: {
  buyerWallet: string;
  event: EventRecord;
}): PurchaseContractArgs {
  assertWalletAddress(buyerWallet, "Buyer wallet");

  return {
    buyer: buyerWallet,
    eventIdHex: deriveEventIdHex(event.id),
    amountAtomic: (event.isFree ? BigInt(0) : usdcToAtomicUnits(event.priceUsdc)).toString(),
    metadataUri: buildPassMetadataUri(event, buyerWallet),
    metadataHashHex: buildPassMetadataHashHex(event, buyerWallet),
  };
}

export function prepareCheckInContractArgs({
  event,
  organizerWallet,
  tokenId,
}: {
  event: EventRecord;
  organizerWallet: string;
  tokenId: string | number | bigint;
}): CheckInContractArgs {
  assertWalletAddress(organizerWallet, "Organizer wallet");

  const normalizedTokenId = String(tokenId);

  if (!/^\d+$/.test(normalizedTokenId)) {
    throw new Error("Token ID must be a non-negative integer.");
  }

  return {
    organizer: organizerWallet,
    eventIdHex: deriveEventIdHex(event.id),
    tokenId: normalizedTokenId,
  };
}

export function prepareWithdrawContractArgs({
  collaboratorWallet,
  event,
}: {
  collaboratorWallet: string;
  event: EventRecord;
}): WithdrawContractArgs {
  assertWalletAddress(collaboratorWallet, "Collaborator wallet");

  return {
    collaborator: collaboratorWallet,
    eventIdHex: deriveEventIdHex(event.id),
  };
}
