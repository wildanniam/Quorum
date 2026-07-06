import type {
  AnchorPayoutProvider,
  AnchorPayoutStatus,
} from "@/lib/db/models";
import {
  assertMoneyGramSigningSecret,
  getAnchorProviderName,
  resolveAnchorRuntimeConfig,
} from "@/lib/anchor/config";

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

export function getAnchorPayoutProvider(): AnchorPayoutProviderAdapter {
  const config = resolveAnchorRuntimeConfig();
  const provider = getAnchorProviderName();

  if (provider === "moneygram") {
    assertMoneyGramSigningSecret(config.moneygram);

    throw new Error(
      "MoneyGram anchor provider is not implemented yet. Use ANCHOR_PROVIDER=mock until the MoneyGram provider phase is complete.",
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
