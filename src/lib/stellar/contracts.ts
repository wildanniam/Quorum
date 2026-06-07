import { Contract, Networks, rpc } from "@stellar/stellar-sdk";

const DEFAULT_TESTNET_RPC_URL = "https://soroban-testnet.stellar.org";

export type ContractReadiness = {
  network: string;
  rpcUrl: string;
  networkPassphrase: string;
  coreContractId: string | null;
  passContractId: string | null;
  configured: boolean;
  missing: string[];
};

function optionalEnv(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function getContractReadiness(): ContractReadiness {
  const coreContractId = optionalEnv(process.env.NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID);
  const passContractId = optionalEnv(process.env.NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID);
  const rpcUrl =
    optionalEnv(process.env.NEXT_PUBLIC_STELLAR_RPC_URL) ?? DEFAULT_TESTNET_RPC_URL;
  const network = optionalEnv(process.env.NEXT_PUBLIC_STELLAR_NETWORK) ?? "TESTNET";
  const networkPassphrase =
    optionalEnv(process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE) ??
    Networks.TESTNET;
  const missing = [
    coreContractId ? null : "NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID",
    passContractId ? null : "NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID",
  ].filter((item): item is string => Boolean(item));

  return {
    network,
    rpcUrl,
    networkPassphrase,
    coreContractId,
    passContractId,
    configured: missing.length === 0,
    missing,
  };
}

export function getRpcServer() {
  return new rpc.Server(getContractReadiness().rpcUrl);
}

export function getCoreContract() {
  const { coreContractId } = getContractReadiness();
  if (!coreContractId) return null;

  return new Contract(coreContractId);
}

export function getPassContract() {
  const { passContractId } = getContractReadiness();
  if (!passContractId) return null;

  return new Contract(passContractId);
}

export function normalizeContractError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "Stellar contract request failed.";
}
