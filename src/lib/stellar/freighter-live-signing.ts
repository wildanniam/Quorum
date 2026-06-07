import {
  StrKey,
  Transaction,
  TransactionBuilder,
  type FeeBumpTransaction,
} from "@stellar/stellar-sdk";
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
    networkPassphrase: preparedTransaction.networkPassphrase,
    signedTransactionXdr: signed.signedTxXdr,
    signerAddress: signed.signerAddress,
  };
}
