import type { AnchorPayoutProvider, EvidenceRecord } from "@/lib/db/models";
import type { ContractReadiness } from "@/lib/stellar/contracts";
import { isLiveTransactionHash } from "@/lib/stellar/explorer";

type EvidenceProofInput = Pick<EvidenceRecord, "ledger" | "txHash">;

export function hasLiveStellarProof(record: EvidenceProofInput) {
  return isLiveTransactionHash(record.txHash);
}

export function getEvidenceProofPresentation(record: EvidenceProofInput) {
  if (hasLiveStellarProof(record)) {
    return {
      helper: "Verifiable through a Stellar testnet transaction hash.",
      label: "Stellar tx",
      tone: "live" as const,
    };
  }

  if (record.ledger !== null) {
    return {
      helper: "Observed from an indexed Stellar contract event.",
      label: "Indexed ledger",
      tone: "cyan" as const,
    };
  }

  if (record.txHash) {
    return {
      helper:
        "Stored by Quorum with an app transaction reference, not an explorer hash.",
      label: "App reference",
      tone: "local" as const,
    };
  }

  return {
    helper: "Stored as Quorum app proof without an external transaction hash.",
    label: "App proof",
    tone: "local" as const,
  };
}

export function getContractSetupPresentation(
  readiness: Pick<ContractReadiness, "configured">,
) {
  if (readiness.configured) {
    return {
      description:
        "Required Stellar testnet contract IDs and payment asset settings are present. A wallet-approved transaction is still required to prove execution.",
      proofMode: "Testnet configured",
      status: "Configuration detected",
      title: "Testnet settings configured",
      tone: "cyan" as const,
    };
  }

  return {
    description:
      "Quorum uses local proof records until all required Stellar testnet settings are valid.",
    proofMode: "Local proof mode",
    status: "Setup pending",
    title: "Testnet setup incomplete",
    tone: "local" as const,
  };
}

export function getAnchorProviderPresentation(provider: AnchorPayoutProvider) {
  if (provider === "moneygram") {
    return {
      accessDescription:
        "MoneyGram controls domain and wallet access. Quorum can prepare the flow, but pickup is only available after the provider accepts the request.",
      accessTitle: "MoneyGram provider access required",
      description:
        "Quorum only offers the MoneyGram testnet flow for an explorer-verifiable settlement to this wallet. Each eligible settlement can back one request.",
      eyebrow: "MoneyGram testnet cash-out",
      historyDescription:
        "Contract settlement proof and MoneyGram transfer proof stay separate, so provider-dependent steps remain explicit.",
      providerLabel: "MoneyGram",
      title: "Move settled testnet funds into the cash-out flow.",
    };
  }

  return {
    accessDescription:
      "Mock mode records the product flow without contacting MoneyGram. No external cash pickup is created.",
    accessTitle: "Cash-out demo mode",
    description:
      "Quorum is using its mock anchor provider. Settled wallet funds can demonstrate the workflow, but no external cash pickup is created.",
    eyebrow: "Anchor cash-out demo",
    historyDescription:
      "Contract settlement proof and mock provider records stay separate so demo evidence cannot be mistaken for a MoneyGram transfer.",
    providerLabel: "Mock demo",
    title: "Preview the settled-funds cash-out workflow.",
  };
}

export function canStartAnchorPayout({
  provider,
  settlementTxHash,
}: {
  provider: AnchorPayoutProvider;
  settlementTxHash: string | null;
}) {
  return provider === "mock" || isLiveTransactionHash(settlementTxHash);
}
