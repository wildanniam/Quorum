import type {
  AnchorPayoutProvider,
  AnchorPayoutStatus,
} from "@/lib/db/models";

export type AnchorPayoutProviderInput = {
  amountUsdc: string;
  collaboratorWallet: string;
  eventId: string;
  payoutId: string;
};

export type AnchorPayoutProviderResult = {
  anchorTransactionId: string | null;
  metadataJson: Record<string, unknown>;
  pickupUrl: string | null;
  provider: AnchorPayoutProvider;
  referenceNumber: string | null;
  status: AnchorPayoutStatus;
};

export type AnchorPayoutProviderAdapter = {
  createPayout(input: AnchorPayoutProviderInput): Promise<AnchorPayoutProviderResult>;
  provider: AnchorPayoutProvider;
};

export function getAnchorProviderName(): AnchorPayoutProvider {
  const configured = process.env.ANCHOR_PROVIDER?.trim().toLowerCase();

  if (configured === "moneygram") return "moneygram";

  return "mock";
}

export function getAnchorPayoutProvider(): AnchorPayoutProviderAdapter {
  const provider = getAnchorProviderName();

  if (provider === "moneygram") {
    throw new Error(
      "MoneyGram anchor provider is not configured yet. Use ANCHOR_PROVIDER=mock until sandbox credentials are ready.",
    );
  }

  return {
    provider: "mock",
    async createPayout(input) {
      return {
        anchorTransactionId: `mock-anchor-${input.payoutId}`,
        metadataJson: {
          mode: "mock",
          note: "Mock anchor payout reserves withdrawable USDC for product testing.",
        },
        pickupUrl: null,
        provider: "mock",
        referenceNumber: `MOCK-${input.payoutId.slice(-8).toUpperCase()}`,
        status: "ready_for_pickup",
      };
    },
  };
}
