import {
  TransactionBuilder,
  rpc,
  type FeeBumpTransaction,
  type Transaction,
} from "@stellar/stellar-sdk";
import { getRpcServer, normalizeContractError } from "@/lib/stellar/contracts";
import type { SignedLiveTransaction } from "@/lib/stellar/freighter-live-signing";

type SendTransactionResponse = Awaited<
  ReturnType<rpc.Server["sendTransaction"]>
>;
type GetTransactionResponse = Awaited<
  ReturnType<rpc.Server["getTransaction"]>
>;

export type LiveTransactionSubmissionRpc = {
  getTransaction(hash: string): Promise<GetTransactionResponse>;
  sendTransaction(
    transaction: Transaction | FeeBumpTransaction,
  ): Promise<SendTransactionResponse>;
};

export type LiveTransactionSubmissionOptions = {
  pollIntervalMs?: number;
  rpcServer?: LiveTransactionSubmissionRpc;
  timeoutMs?: number;
};

export type LiveTransactionSubmissionResult = {
  action: SignedLiveTransaction["action"];
  contractId: string;
  functionName: SignedLiveTransaction["functionName"];
  ledger: number;
  status: "SUCCESS";
  txHash: string;
};

export class LiveTransactionSubmissionError extends Error {
  readonly txHash?: string;

  constructor(message: string, txHash?: string) {
    super(message);
    this.name = "LiveTransactionSubmissionError";
    this.txHash = txHash;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseSignedTransaction(signedTransaction: SignedLiveTransaction) {
  try {
    return TransactionBuilder.fromXDR(
      signedTransaction.signedTransactionXdr,
      signedTransaction.networkPassphrase,
    );
  } catch (error) {
    throw new LiveTransactionSubmissionError(normalizeContractError(error));
  }
}

function assertTransactionHash(txHash: string) {
  if (!/^[a-f0-9]{64}$/i.test(txHash)) {
    throw new LiveTransactionSubmissionError(
      "Stellar RPC returned an invalid transaction hash.",
      txHash,
    );
  }
}

export async function submitSignedLiveTransaction({
  options = {},
  signedTransaction,
}: {
  options?: LiveTransactionSubmissionOptions;
  signedTransaction: SignedLiveTransaction;
}): Promise<LiveTransactionSubmissionResult> {
  const rpcServer = options.rpcServer ?? getRpcServer();
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const transaction = parseSignedTransaction(signedTransaction);

  let submitted: SendTransactionResponse;

  try {
    submitted = await rpcServer.sendTransaction(transaction);
  } catch (error) {
    throw new LiveTransactionSubmissionError(normalizeContractError(error));
  }

  assertTransactionHash(submitted.hash);

  if (submitted.status === "ERROR") {
    throw new LiveTransactionSubmissionError(
      "Stellar RPC rejected the signed transaction.",
      submitted.hash,
    );
  }

  if (submitted.status === "TRY_AGAIN_LATER") {
    throw new LiveTransactionSubmissionError(
      "Stellar RPC asked to retry signed transaction submission later.",
      submitted.hash,
    );
  }

  if (submitted.status !== "PENDING" && submitted.status !== "DUPLICATE") {
    throw new LiveTransactionSubmissionError(
      `Unexpected Stellar RPC submission status: ${submitted.status}.`,
      submitted.hash,
    );
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    let transactionStatus: GetTransactionResponse;

    try {
      transactionStatus = await rpcServer.getTransaction(submitted.hash);
    } catch (error) {
      throw new LiveTransactionSubmissionError(
        normalizeContractError(error),
        submitted.hash,
      );
    }

    if (transactionStatus.status === rpc.Api.GetTransactionStatus.SUCCESS) {
      return {
        action: signedTransaction.action,
        contractId: signedTransaction.contractId,
        functionName: signedTransaction.functionName,
        ledger: transactionStatus.ledger,
        status: "SUCCESS",
        txHash: submitted.hash.toLowerCase(),
      };
    }

    if (transactionStatus.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new LiveTransactionSubmissionError(
        "Stellar RPC reported the transaction failed.",
        submitted.hash,
      );
    }

    await delay(pollIntervalMs);
  }

  throw new LiveTransactionSubmissionError(
    "Timed out waiting for Stellar RPC transaction finality.",
    submitted.hash,
  );
}
