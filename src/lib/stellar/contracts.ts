import { Contract, Networks, StrKey, rpc } from "@stellar/stellar-sdk";

const DEFAULT_TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";

export type ContractReadiness = {
  network: string;
  rpcUrl: string;
  networkPassphrase: string;
  coreContractId: string | null;
  passContractId: string | null;
  usdcContractId: string | null;
  proofMode: "live" | "local";
  configured: boolean;
  contractsConfigured: boolean;
  paymentAssetConfigured: boolean;
  missing: string[];
  invalid: string[];
};

function optionalEnv(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function isValidContractId(value: string | null) {
  return Boolean(value && StrKey.isValidContract(value));
}

export function getContractReadiness(): ContractReadiness {
  const coreContractId = optionalEnv(process.env.NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID);
  const passContractId = optionalEnv(process.env.NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID);
  const usdcContractId = optionalEnv(process.env.NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID);
  const rpcUrl =
    optionalEnv(process.env.NEXT_PUBLIC_STELLAR_RPC_URL) ?? DEFAULT_TESTNET_RPC_URL;
  const network = optionalEnv(process.env.NEXT_PUBLIC_STELLAR_NETWORK) ?? "TESTNET";
  const networkPassphrase =
    optionalEnv(process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE) ??
    Networks.TESTNET;
  const missing = [
    coreContractId ? null : "NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID",
    passContractId ? null : "NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID",
    usdcContractId ? null : "NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID",
  ].filter((item): item is string => Boolean(item));
  const invalid = [
    coreContractId && !isValidContractId(coreContractId)
      ? "NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID"
      : null,
    passContractId && !isValidContractId(passContractId)
      ? "NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID"
      : null,
    usdcContractId && !isValidContractId(usdcContractId)
      ? "NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID"
      : null,
  ].filter((item): item is string => Boolean(item));
  const contractsConfigured =
    Boolean(coreContractId && passContractId) &&
    !invalid.includes("NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID") &&
    !invalid.includes("NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID");
  const paymentAssetConfigured =
    Boolean(usdcContractId) &&
    !invalid.includes("NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID");
  const configured = contractsConfigured && paymentAssetConfigured;

  return {
    network,
    rpcUrl,
    networkPassphrase,
    coreContractId,
    passContractId,
    usdcContractId,
    proofMode: configured ? "live" : "local",
    configured,
    contractsConfigured,
    paymentAssetConfigured,
    missing,
    invalid,
  };
}

export function getRpcServer() {
  return new rpc.Server(getContractReadiness().rpcUrl);
}

export function getCoreContract() {
  const { coreContractId, invalid } = getContractReadiness();
  if (!coreContractId || invalid.includes("NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID")) {
    return null;
  }

  return new Contract(coreContractId);
}

export function getPassContract() {
  const { passContractId, invalid } = getContractReadiness();
  if (!passContractId || invalid.includes("NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID")) {
    return null;
  }

  return new Contract(passContractId);
}

export function getUsdcContract() {
  const { usdcContractId, invalid } = getContractReadiness();
  if (!usdcContractId || invalid.includes("NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID")) {
    return null;
  }

  return new Contract(usdcContractId);
}

export function normalizeContractError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "Stellar contract request failed.";
}
