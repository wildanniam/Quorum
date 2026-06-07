import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  StrKey,
  TransactionBuilder,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";
import type {
  CheckInContractArgs,
  CreateEventContractArgs,
  PurchaseContractArgs,
  SplitRecipientArgs,
  WithdrawContractArgs,
} from "@/lib/stellar/live-encoding";
import type { PreparedLiveContractAction } from "@/lib/stellar/live-action";

export type UnsignedLiveTransactionOptions = {
  baseFee?: string;
  sourceSequence: string;
  timeoutSeconds?: number;
};

export type UnsignedLiveTransaction = {
  action: PreparedLiveContractAction["action"];
  contractId: string;
  functionName: PreparedLiveContractAction["functionName"];
  networkPassphrase: string;
  simulationRequired: true;
  source: string;
  sourceSequence: string;
  timeoutSeconds: number;
  unsignedTransactionXdr: string;
};

function assertHex32(value: string, label: string) {
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error(`${label} must be a 32-byte hex string.`);
  }
}

function assertUnsignedInteger(value: string, label: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be a non-negative integer string.`);
  }
}

function assertU32(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0 || value > 4_294_967_295) {
    throw new Error(`${label} must fit u32.`);
  }
}

function addressScVal(value: string, label: string) {
  if (
    !StrKey.isValidEd25519PublicKey(value) &&
    !StrKey.isValidContract(value)
  ) {
    throw new Error(`${label} must be a valid Stellar address.`);
  }

  return new Address(value).toScVal();
}

function bytesN32ScVal(value: string, label: string) {
  assertHex32(value, label);

  return nativeToScVal(Buffer.from(value, "hex"), { type: "bytes" });
}

function i128ScVal(value: string, label: string) {
  assertUnsignedInteger(value, label);

  return nativeToScVal(BigInt(value), { type: "i128" });
}

function u32ScVal(value: number, label: string) {
  assertU32(value, label);

  return nativeToScVal(value, { type: "u32" });
}

function u64ScVal(value: string, label: string) {
  assertUnsignedInteger(value, label);

  return nativeToScVal(BigInt(value), { type: "u64" });
}

function symbolKey(value: string) {
  return xdr.ScVal.scvSymbol(value);
}

function splitRecipientScVal(split: SplitRecipientArgs) {
  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({
      key: symbolKey("percent_bps"),
      val: u32ScVal(split.percentBps, "Split percent bps"),
    }),
    new xdr.ScMapEntry({
      key: symbolKey("wallet"),
      val: addressScVal(split.wallet, "Split wallet"),
    }),
  ]);
}

function createEventScVals(args: CreateEventContractArgs) {
  return [
    addressScVal(args.organizer, "Organizer"),
    bytesN32ScVal(args.eventIdHex, "Event ID"),
    i128ScVal(args.priceAtomic, "Price"),
    addressScVal(args.currencyContractId, "Currency contract ID"),
    u32ScVal(args.capacity, "Capacity"),
    nativeToScVal(args.isFree),
    xdr.ScVal.scvVec(args.splits.map(splitRecipientScVal)),
    bytesN32ScVal(args.metadataHashHex, "Event metadata hash"),
    addressScVal(args.passContractId, "Pass contract ID"),
  ];
}

function purchaseScVals(args: PurchaseContractArgs) {
  return [
    addressScVal(args.buyer, "Buyer"),
    bytesN32ScVal(args.eventIdHex, "Event ID"),
    i128ScVal(args.amountAtomic, "Amount"),
    nativeToScVal(args.metadataUri),
    bytesN32ScVal(args.metadataHashHex, "Pass metadata hash"),
  ];
}

function checkInScVals(args: CheckInContractArgs) {
  return [
    addressScVal(args.organizer, "Organizer"),
    bytesN32ScVal(args.eventIdHex, "Event ID"),
    u64ScVal(args.tokenId, "Token ID"),
  ];
}

function withdrawScVals(args: WithdrawContractArgs) {
  return [
    addressScVal(args.collaborator, "Collaborator"),
    bytesN32ScVal(args.eventIdHex, "Event ID"),
  ];
}

export function buildLiveContractInvocationScVals(
  preparedAction: PreparedLiveContractAction,
) {
  if (preparedAction.functionName === "create_event") {
    return createEventScVals(preparedAction.args as CreateEventContractArgs);
  }

  if (preparedAction.functionName === "purchase") {
    return purchaseScVals(preparedAction.args as PurchaseContractArgs);
  }

  if (preparedAction.functionName === "check_in") {
    return checkInScVals(preparedAction.args as CheckInContractArgs);
  }

  if (preparedAction.functionName === "withdraw") {
    return withdrawScVals(preparedAction.args as WithdrawContractArgs);
  }

  throw new Error("Unsupported live contract function.");
}

export function buildUnsignedLiveTransaction({
  options,
  preparedAction,
}: {
  options: UnsignedLiveTransactionOptions;
  preparedAction: PreparedLiveContractAction;
}): UnsignedLiveTransaction {
  if (!StrKey.isValidEd25519PublicKey(preparedAction.signer)) {
    throw new Error("Prepared action signer must be a valid Stellar public key.");
  }

  assertUnsignedInteger(options.sourceSequence, "Source sequence");

  const timeoutSeconds = options.timeoutSeconds ?? 300;
  const operation = new Contract(preparedAction.contractId).call(
    preparedAction.functionName,
    ...buildLiveContractInvocationScVals(preparedAction),
  );
  const transaction = new TransactionBuilder(
    new Account(preparedAction.signer, options.sourceSequence),
    {
      fee: options.baseFee ?? BASE_FEE,
      networkPassphrase: preparedAction.networkPassphrase,
    },
  )
    .addOperation(operation)
    .setTimeout(timeoutSeconds)
    .build();

  return {
    action: preparedAction.action,
    contractId: preparedAction.contractId,
    functionName: preparedAction.functionName,
    networkPassphrase: preparedAction.networkPassphrase,
    simulationRequired: true,
    source: preparedAction.signer,
    sourceSequence: options.sourceSequence,
    timeoutSeconds,
    unsignedTransactionXdr: transaction.toXDR(),
  };
}

export function parseLiveTransactionFunctionName({
  networkPassphrase,
  unsignedTransactionXdr,
}: {
  networkPassphrase: string;
  unsignedTransactionXdr: string;
}) {
  const transaction = TransactionBuilder.fromXDR(
    unsignedTransactionXdr,
    networkPassphrase,
  );
  const [operation] = transaction.operations;

  if (!operation || operation.type !== "invokeHostFunction") {
    throw new Error("Expected invokeHostFunction operation.");
  }

  return operation.func.invokeContract().functionName().toString();
}
