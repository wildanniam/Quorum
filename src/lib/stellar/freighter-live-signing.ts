import {
  Networks,
  StrKey,
  Transaction,
  TransactionBuilder,
  type FeeBumpTransaction,
} from "@stellar/stellar-sdk";
import type { LiveTransactionForSigning } from "@/lib/stellar/live-preflight";

export type FreighterLiveSigner = {
  getNetworkDetails?: () => Promise<{
    error?: unknown;
    network?: string;
    networkPassphrase?: string;
  }>;
  signTransaction(
    transactionXdr: string,
    options?: {
      address?: string;
      networkPassphrase?: string;
    },
  ): Promise<{
    error?: unknown;
    signedTxXdr: string;
    signerAddress: string;
  }>;
};

export type SignedLiveTransaction = {
  action: LiveTransactionForSigning["action"];
  contractId: string;
  functionName: LiveTransactionForSigning["functionName"];
  invocationArgsXdr: LiveTransactionForSigning["invocationArgsXdr"];
  networkPassphrase: string;
  signedTransactionXdr: string;
  signerAddress: string;
};

function normalizeError(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  if (error && typeof error === "object" && "error" in error) {
    return normalizeError((error as { error: unknown }).error);
  }
  if (error && typeof error === "object" && "errorMessage" in error) {
    return String((error as { errorMessage: unknown }).errorMessage);
  }
  return "Freighter transaction signing failed.";
}

function normalizeWalletAddress(value: unknown): string | null {
  if (typeof value === "string") {
    return StrKey.isValidEd25519PublicKey(value) ? value : null;
  }

  if (!value || typeof value !== "object") return null;

  for (const key of [
    "address",
    "publicKey",
    "public_key",
    "signerAddress",
    "accountId",
  ]) {
    if (key in value) {
      const normalized = normalizeWalletAddress(
        (value as Record<string, unknown>)[key],
      );
      if (normalized) return normalized;
    }
  }

  return null;
}

async function assertFreighterNetworkMatchesPrepared(
  signer: FreighterLiveSigner,
  preparedTransaction: LiveTransactionForSigning,
) {
  if (!signer.getNetworkDetails) return;

  const networkDetails = await signer.getNetworkDetails();

  if (networkDetails.error) {
    throw new FreighterLiveSigningError(normalizeError(networkDetails.error));
  }

  const network = networkDetails.network?.trim().toUpperCase();
  const networkPassphrase = networkDetails.networkPassphrase?.trim();

  if (
    network !== "TESTNET" ||
    networkPassphrase !== Networks.TESTNET ||
    networkPassphrase !== preparedTransaction.networkPassphrase
  ) {
    throw new FreighterLiveSigningError(
      `Switch Freighter to Stellar Testnet before signing. Current network: ${
        networkDetails.network || "unknown"
      }.`,
    );
  }
}

export class FreighterLiveSigningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FreighterLiveSigningError";
  }
}

function assertParseableTransactionXdr(xdr: string, networkPassphrase: string) {
  try {
    return TransactionBuilder.fromXDR(xdr, networkPassphrase);
  } catch (error) {
    throw new FreighterLiveSigningError(normalizeError(error));
  }
}

function getSubmittedTransaction(transaction: Transaction | FeeBumpTransaction) {
  return transaction instanceof Transaction
    ? transaction
    : transaction.innerTransaction;
}

function assertTransactionMatchesPrepared({
  label,
  preparedTransaction,
  transaction,
}: {
  label: string;
  preparedTransaction: LiveTransactionForSigning;
  transaction: Transaction | FeeBumpTransaction;
}) {
  const submittedTransaction = getSubmittedTransaction(transaction);
  const [operation] = submittedTransaction.operations;

  if (submittedTransaction.source !== preparedTransaction.source) {
    throw new FreighterLiveSigningError(
      `${label} source does not match the prepared transaction source.`,
    );
  }

  if (submittedTransaction.operations.length !== 1 || !operation) {
    throw new FreighterLiveSigningError(
      `${label} must contain exactly one live contract invocation.`,
    );
  }

  if (
    operation.type !== "invokeHostFunction" ||
    operation.func.switch().name !== "hostFunctionTypeInvokeContract"
  ) {
    throw new FreighterLiveSigningError(
      `${label} is not a live contract invocation.`,
    );
  }

  const invocation = operation.func.invokeContract();
  const contractAddress = invocation.contractAddress();

  if (contractAddress.switch().name !== "scAddressTypeContract") {
    throw new FreighterLiveSigningError(
      `${label} does not target a contract address.`,
    );
  }

  const contractId = StrKey.encodeContract(contractAddress.contractId());
  const functionName = invocation.functionName().toString();

  if (contractId !== preparedTransaction.contractId) {
    throw new FreighterLiveSigningError(
      `${label} contract ID does not match the prepared transaction.`,
    );
  }

  if (functionName !== preparedTransaction.functionName) {
    throw new FreighterLiveSigningError(
      `${label} function does not match the prepared transaction.`,
    );
  }

  const invocationArgsXdr = invocation
    .args()
    .map((arg) => arg.toXDR("base64"));

  if (
    invocationArgsXdr.length !== preparedTransaction.invocationArgsXdr.length ||
    invocationArgsXdr.some(
      (argXdr, index) => argXdr !== preparedTransaction.invocationArgsXdr[index],
    )
  ) {
    throw new FreighterLiveSigningError(
      `${label} arguments do not match the prepared transaction.`,
    );
  }
}

export async function loadFreighterLiveSigner(): Promise<FreighterLiveSigner> {
  return import("@stellar/freighter-api");
}

export async function signPreparedLiveTransaction({
  preparedTransaction,
  signer,
}: {
  preparedTransaction: LiveTransactionForSigning;
  signer?: FreighterLiveSigner;
}): Promise<SignedLiveTransaction> {
  const liveSigner = signer ?? (await loadFreighterLiveSigner());

  if (!StrKey.isValidEd25519PublicKey(preparedTransaction.source)) {
    throw new FreighterLiveSigningError(
      "Prepared transaction source must be a valid Stellar public key.",
    );
  }

  const parsedPreparedTransaction = assertParseableTransactionXdr(
    preparedTransaction.preparedTransactionXdr,
    preparedTransaction.networkPassphrase,
  );
  assertTransactionMatchesPrepared({
    label: "Prepared transaction XDR",
    preparedTransaction,
    transaction: parsedPreparedTransaction,
  });

  await assertFreighterNetworkMatchesPrepared(liveSigner, preparedTransaction);

  const signed = await liveSigner.signTransaction(
    preparedTransaction.preparedTransactionXdr,
    {
      address: preparedTransaction.source,
      networkPassphrase: preparedTransaction.networkPassphrase,
    },
  );

  if (signed.error) {
    throw new FreighterLiveSigningError(normalizeError(signed.error));
  }

  const signerAddress = normalizeWalletAddress(signed.signerAddress);

  if (!signerAddress) {
    throw new FreighterLiveSigningError(
      "Freighter did not return a valid signer address.",
    );
  }

  if (signerAddress !== preparedTransaction.source) {
    throw new FreighterLiveSigningError(
      "Freighter signed with a different wallet than the prepared transaction source.",
    );
  }

  if (!signed.signedTxXdr) {
    throw new FreighterLiveSigningError("Freighter did not return signed XDR.");
  }

  const parsedSignedTransaction = assertParseableTransactionXdr(
    signed.signedTxXdr,
    preparedTransaction.networkPassphrase,
  );
  assertTransactionMatchesPrepared({
    label: "Freighter signed XDR",
    preparedTransaction,
    transaction: parsedSignedTransaction,
  });

  return {
    action: preparedTransaction.action,
    contractId: preparedTransaction.contractId,
    functionName: preparedTransaction.functionName,
    invocationArgsXdr: preparedTransaction.invocationArgsXdr,
    networkPassphrase: preparedTransaction.networkPassphrase,
    signedTransactionXdr: signed.signedTxXdr,
    signerAddress,
  };
}
