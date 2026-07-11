export type EventStatus = "draft" | "published";
export type LocationType = "physical" | "virtual" | "hybrid";
export type ResourceType = "link" | "file" | "text";
export type PassSource = "purchase" | "free_claim";
export type PurchaseStatus = "pending" | "succeeded" | "failed";
export type AnchorPayoutProvider = "mock" | "moneygram";
export type AnchorPayoutStatus =
  | "cancelled"
  | "completed"
  | "failed"
  | "pending_anchor"
  | "ready_for_pickup"
  | "requested";
export type EvidenceKind =
  | "anchor_payout"
  | "check_in"
  | "free_claim"
  | "indexed_event"
  | "paid_checkout"
  | "publish"
  | "withdrawal";
export type LedgerEntryKind = "credit" | "debit";

export type UserRecord = {
  id: string;
  walletAddress: string;
  createdAt: string;
  lastSeenAt: string;
};

export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  eventType: string;
  shortDescription: string;
  coverImageUrl: string | null;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  locationType: LocationType;
  locationText: string | null;
  meetingUrl: string | null;
  priceUsdc: string;
  isFree: boolean;
  capacity: number;
  status: EventStatus;
  organizerWallet: string;
  metadataHash: string | null;
  coreEventId: string | null;
  publishTxHash: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CollaboratorRecord = {
  id: string;
  eventId: string;
  displayName: string;
  role: string;
  walletAddress: string;
  splitPercentage: number;
  createdAt: string;
};

export type ResourceRecord = {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string | null;
  sortOrder: number;
  createdAt: string;
};

export type PassRecord = {
  id: string;
  eventId: string;
  ownerWallet: string;
  tokenId: string | null;
  metadataUri: string | null;
  metadataHash: string | null;
  mintTxHash: string | null;
  source: PassSource;
  checkedIn: boolean;
  createdAt: string;
};

export type PurchaseRecord = {
  id: string;
  eventId: string;
  buyerWallet: string;
  amountUsdc: string;
  tokenId: string | null;
  txHash: string | null;
  status: PurchaseStatus;
  createdAt: string;
};

export type WithdrawalRecord = {
  id: string;
  eventId: string;
  collaboratorWallet: string;
  amountUsdc: string;
  txHash: string;
  createdAt: string;
};

export type CheckInRecord = {
  id: string;
  eventId: string;
  tokenId: string;
  ownerWallet: string;
  checkedInByWallet: string;
  txHash: string | null;
  createdAt: string;
};

export type AnchorPayoutRecord = {
  id: string;
  eventId: string;
  collaboratorWallet: string;
  amountUsdc: string;
  asset: "USDC";
  provider: AnchorPayoutProvider;
  status: AnchorPayoutStatus;
  anchorTransactionId: string | null;
  stellarTransactionId: string | null;
  referenceNumber: string | null;
  pickupUrl: string | null;
  withdrawalId: string | null;
  failureReason: string | null;
  metadataJson: unknown;
  createdAt: string;
  updatedAt: string;
};

export type IndexerStateRecord = {
  id: string;
  network: string;
  rpcUrl: string;
  contractIds: string[];
  cursor: string | null;
  latestLedger: number | null;
  lastStartedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StellarEventRecord = {
  eventKey: string;
  contractId: string;
  eventType: string;
  topicKey: string | null;
  appEventId: string | null;
  coreEventId: string | null;
  txHash: string | null;
  ledger: number;
  eventIndex: number;
  pagingToken: string;
  successful: boolean;
  topicsJson: unknown;
  valueJson: unknown;
  valueXdr: string | null;
  rawEventJson: unknown;
  observedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type EvidenceRecord = {
  id: string;
  kind: EvidenceKind;
  eventId: string | null;
  eventSlug: string | null;
  eventTitle: string | null;
  actorWallet: string | null;
  amountUsdc: string | null;
  asset: "USDC" | null;
  explorerUrl: string | null;
  ledger: number | null;
  sourceLabel: string;
  status: string;
  tokenId: string | null;
  txHash: string | null;
  occurredAt: string;
};

export type LedgerEntryRecord = {
  id: string;
  kind: LedgerEntryKind;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  walletAddress: string;
  amountUsdc: string;
  asset: "USDC";
  balanceAfterUsdc: string;
  explorerUrl: string | null;
  sourceId: string;
  sourceLabel: string;
  tokenId: string | null;
  txHash: string | null;
  occurredAt: string;
};
