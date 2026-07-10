import type {
  AnchorPayoutProvider,
  AnchorPayoutStatus,
} from "@/lib/db/models";
import {
  assertMoneyGramSigningSecret,
  getAnchorProviderName,
  resolveAnchorRuntimeConfig,
} from "@/lib/anchor/config";
import { initiateMoneyGramSep24Withdrawal } from "@/lib/anchor/moneygram/sep24";

export type AnchorPayoutProviderInput = {
  amountUsdc: string;
  collaboratorWallet: string;
  eventId: string;
  moneyGramAuthToken?: string | null;
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

    return {
      provider: "moneygram",
      async createPayout(input) {
        if (!input.moneyGramAuthToken) {
          throw new Error("MoneyGram wallet authorization required.");
        }

        const withdrawal = await initiateMoneyGramSep24Withdrawal({
          account: input.collaboratorWallet,
          amountUsdc: input.amountUsdc,
          authToken: input.moneyGramAuthToken,
          config: config.moneygram,
        });

        return {
          anchorTransactionId: withdrawal.id,
          metadataJson: {
            amountUsdc: input.amountUsdc,
            assetCode: config.moneygram.usdcAssetCode,
            assetIssuer: config.moneygram.usdcIssuer,
            eventId: input.eventId,
            homeDomain: config.moneygram.homeDomain,
            mode: "moneygram",
            responseType: withdrawal.type,
            sep: "SEP-24",
          },
          pickupUrl: withdrawal.url,
          provider: "moneygram",
          referenceNumber: null,
          status: "requested",
        };
      },
    };
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
