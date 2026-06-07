import {
  Account,
  TransactionBuilder,
  type FeeBumpTransaction,
  type Transaction,
} from "@stellar/stellar-sdk";
import { getRpcServer, normalizeContractError } from "@/lib/stellar/contracts";
import type { PreparedLiveContractAction } from "@/lib/stellar/live-action";
import {
  type UnsignedLiveTransaction,
  buildUnsignedLiveTransaction,
} from "@/lib/stellar/live-xdr";

export type LiveTransactionPreflightRpc = {
  getAccount(address: string): Promise<Account>;
  prepareTransaction(
    transaction: Transaction | FeeBumpTransaction,
  ): Promise<Transaction | FeeBumpTransaction>;
};

export type LiveTransactionForSigning = Omit<
  UnsignedLiveTransaction,
  "simulationRequired"
> & {
  preparedForSigning: true;
  preparedTransactionXdr: string;
  simulationRequired: false;
};

export class LiveTransactionPreflightError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveTransactionPreflightError";
  }
}

export async function prepareLiveTransactionForSigning({
  baseFee,
  preparedAction,
  rpcServer = getRpcServer(),
  timeoutSeconds,
}: {
  baseFee?: string;
  preparedAction: PreparedLiveContractAction;
  rpcServer?: LiveTransactionPreflightRpc;
  timeoutSeconds?: number;
}): Promise<LiveTransactionForSigning> {
  try {
    const sourceAccount = await rpcServer.getAccount(preparedAction.signer);
    const unsignedTransaction = buildUnsignedLiveTransaction({
      options: {
        baseFee,
        sourceSequence: sourceAccount.sequenceNumber(),
        timeoutSeconds,
      },
      preparedAction,
    });
    const rawTransaction = TransactionBuilder.fromXDR(
      unsignedTransaction.unsignedTransactionXdr,
      preparedAction.networkPassphrase,
    );
    const preparedTransaction = await rpcServer.prepareTransaction(rawTransaction);

    return {
      ...unsignedTransaction,
      preparedForSigning: true,
      preparedTransactionXdr: preparedTransaction.toXDR(),
      simulationRequired: false,
    };
  } catch (error) {
    throw new LiveTransactionPreflightError(normalizeContractError(error));
  }
}
