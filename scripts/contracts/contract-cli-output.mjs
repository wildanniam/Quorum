import { StrKey } from "@stellar/stellar-sdk";

const contractIdPattern = /\bC[A-Z2-7]{55}\b/g;

export function extractContractIdFromOutput(output, label) {
  const candidates = String(output ?? "").match(contractIdPattern) ?? [];
  const contractId = candidates.find((candidate) => StrKey.isValidContract(candidate));

  if (!contractId) {
    throw new Error(`${label} did not return a valid Soroban contract ID.`);
  }

  return contractId;
}
