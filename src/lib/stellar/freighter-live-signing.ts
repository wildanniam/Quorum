import { StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import type { LiveTransactionForSigning } from "@/lib/stellar/live-preflight";

export type FreighterLiveSigner = {
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
  networkPassphrase: string;
  signedTransactionXdr: string;
  signerAddress: string;
};

function normalizeError(error: unknown) {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Freighter transaction signing failed.";
}

export class FreighterLiveSigningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FreighterLiveSigningError";
  }
}

function assertParseableTransactionXdr(xdr: string, networkPassphrase: string) {
  try {
    TransactionBuilder.fromXDR(xdr, networkPassphrase);
  } catch (error) {
    throw new FreighterLiveSigningError(normalizeError(error));
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

  assertParseableTransactionXdr(
    preparedTransaction.preparedTransactionXdr,
    preparedTransaction.networkPassphrase,
  );

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

  if (signed.signerAddress !== preparedTransaction.source) {
    throw new FreighterLiveSigningError(
      "Freighter signed with a different wallet than the prepared transaction source.",
    );
  }

  if (!signed.signedTxXdr) {
    throw new FreighterLiveSigningError("Freighter did not return signed XDR.");
  }

  assertParseableTransactionXdr(
    signed.signedTxXdr,
    preparedTransaction.networkPassphrase,
  );

  return {
    action: preparedTransaction.action,
    contractId: preparedTransaction.contractId,
    functionName: preparedTransaction.functionName,
    networkPassphrase: preparedTransaction.networkPassphrase,
    signedTransactionXdr: signed.signedTxXdr,
    signerAddress: signed.signerAddress,
  };
}
