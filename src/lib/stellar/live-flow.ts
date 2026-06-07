import {
  signPreparedLiveTransaction,
  type FreighterLiveSigner,
  type SignedLiveTransaction,
} from "@/lib/stellar/freighter-live-signing";
import type { PreparedLiveContractAction } from "@/lib/stellar/live-action";
import {
  prepareLiveTransactionForSigning,
  type LiveTransactionForSigning,
  type LiveTransactionPreflightRpc,
} from "@/lib/stellar/live-preflight";
import {
  submitSignedLiveTransaction,
  type LiveTransactionSubmissionOptions,
  type LiveTransactionSubmissionResult,
} from "@/lib/stellar/live-submission";

export type LiveTransactionFlowOptions = {
  baseFee?: string;
  preflightRpc?: LiveTransactionPreflightRpc;
  preparedAction: PreparedLiveContractAction;
  signer?: FreighterLiveSigner;
  submissionOptions?: LiveTransactionSubmissionOptions;
  timeoutSeconds?: number;
};

export type LiveTransactionFlowResult = {
  preparedTransaction: LiveTransactionForSigning;
  signedTransaction: SignedLiveTransaction;
  submission: LiveTransactionSubmissionResult;
};

export async function executePreparedLiveTransactionFlow({
  baseFee,
  preflightRpc,
  preparedAction,
  signer,
  submissionOptions,
  timeoutSeconds,
}: LiveTransactionFlowOptions): Promise<LiveTransactionFlowResult> {
  const preparedTransaction = await prepareLiveTransactionForSigning({
    baseFee,
    preparedAction,
    rpcServer: preflightRpc,
    timeoutSeconds,
  });
  const signedTransaction = await signPreparedLiveTransaction({
    preparedTransaction,
    signer,
  });
  const submission = await submitSignedLiveTransaction({
    options: submissionOptions,
    signedTransaction,
  });

  return {
    preparedTransaction,
    signedTransaction,
    submission,
  };
}
