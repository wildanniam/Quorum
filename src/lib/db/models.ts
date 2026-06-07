export type EventStatus = "draft" | "published";
export type LocationType = "physical" | "virtual" | "hybrid";
export type ResourceType = "link" | "file" | "text";
export type PassSource = "purchase" | "free_claim";
export type PurchaseStatus = "pending" | "succeeded" | "failed";

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
