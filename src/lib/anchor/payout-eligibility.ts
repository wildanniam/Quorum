import type { AnchorPayoutProvider } from "@/lib/db/models";
import { isLiveTransactionHash } from "@/lib/stellar/explorer";

type AnchorPayoutEligibilityInput = {
  provider: AnchorPayoutProvider;
  settlementTxHash: string | null;
};

export function canStartAnchorPayout({
  provider,
  settlementTxHash,
}: AnchorPayoutEligibilityInput) {
  return provider === "mock" || isLiveTransactionHash(settlementTxHash);
}

export function assertAnchorPayoutSettlementEligibility(
  input: AnchorPayoutEligibilityInput,
) {
  if (canStartAnchorPayout(input)) return;

  throw new Error(
    "MoneyGram requires an explorer-verifiable Stellar settlement to this wallet.",
  );
}
