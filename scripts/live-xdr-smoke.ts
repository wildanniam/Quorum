import assert from "node:assert/strict";
import {
  Networks,
  StrKey,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import type { ContractAction } from "../src/lib/stellar/action-policy";
import type {
  CheckInContractArgs,
  CreateEventContractArgs,
  PurchaseContractArgs,
  WithdrawContractArgs,
} from "../src/lib/stellar/live-encoding";
import type {
  LiveContractFunctionName,
  PreparedLiveContractAction,
} from "../src/lib/stellar/live-action";
import {
  buildLiveContractInvocationArgsXdr,
  buildUnsignedLiveTransaction,
  parseLiveTransactionFunctionName,
} from "../src/lib/stellar/live-xdr";

type LiveActionArgs =
  | CheckInContractArgs
  | CreateEventContractArgs
  | PurchaseContractArgs
  | WithdrawContractArgs;

const fakeCoreContractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const fakePassContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
const fakeUsdcContractId = StrKey.encodeContract(Buffer.alloc(32, 9));
const organizerWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 1));
const speakerWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 2));
const attendeeWallet = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 4));
const eventIdHex = "a7e602bb740076b86ae7a7f4d23b6738bc9eddf6d600ca67db3b72fe8d20aa67";
const metadataHashHex =
  "84aa0f60f0db1e95387b09ace00af75db46d7e7f2ea2ae0b499f7f94045fd7a8";

function preparedAction({
  action,
  args,
  functionName,
  signer,
}: {
  action: ContractAction;
  args: LiveActionArgs;
  functionName: LiveContractFunctionName;
  signer: string;
}): PreparedLiveContractAction {
  return {
    action,
    args,
    contractId: fakeCoreContractId,
    coreContractId: fakeCoreContractId,
    executionMode: "live_required",
    functionName,
    network: "TESTNET",
    networkPassphrase: Networks.TESTNET,
    passContractId: fakePassContractId,
    proofMode: "live",
    rpcUrl: "https://soroban-testnet.stellar.org",
    signer,
    usdcContractId: fakeUsdcContractId,
  };
}

function parseInvokeArgs(unsignedTransactionXdr: string) {
  const transaction = TransactionBuilder.fromXDR(
    unsignedTransactionXdr,
    Networks.TESTNET,
  );
  const [operation] = transaction.operations;

  assert(operation, "transaction should include one operation");
  assert.equal(operation.type, "invokeHostFunction");

  return operation.func.invokeContract().args();
}

function assertScValSwitch(value: xdr.ScVal, switchName: string) {
  assert.equal(value.switch().name, switchName);
}

const cases = [
  {
    expectedArgCount: 9,
    expectedFunctionName: "create_event",
    expectedSwitches: [
      "scvAddress",
      "scvBytes",
      "scvI128",
      "scvAddress",
      "scvU32",
      "scvBool",
      "scvVec",
      "scvBytes",
      "scvAddress",
    ],
    preparedAction: preparedAction({
      action: "publish_event",
      functionName: "create_event",
      signer: organizerWallet,
      args: {
        organizer: organizerWallet,
        eventIdHex,
        priceAtomic: "50000000",
        currencyContractId: fakeUsdcContractId,
        capacity: 80,
        isFree: false,
        splits: [
          { wallet: organizerWallet, percentBps: 7000 },
          { wallet: speakerWallet, percentBps: 3000 },
        ],
        metadataHashHex,
        passContractId: fakePassContractId,
      },
    }),
  },
  {
    expectedArgCount: 5,
    expectedFunctionName: "purchase",
    expectedSwitches: [
      "scvAddress",
      "scvBytes",
      "scvI128",
      "scvString",
      "scvBytes",
    ],
    preparedAction: preparedAction({
      action: "checkout_pass",
      functionName: "purchase",
      signer: attendeeWallet,
      args: {
        buyer: attendeeWallet,
        eventIdHex,
        amountAtomic: "50000000",
        metadataUri: `quorum://events/apac-stellar-builder-meetup/passes/${attendeeWallet}`,
        metadataHashHex,
      },
    }),
  },
  {
    expectedArgCount: 3,
    expectedFunctionName: "check_in",
    expectedSwitches: ["scvAddress", "scvBytes", "scvU64"],
    preparedAction: preparedAction({
      action: "check_in_pass",
      functionName: "check_in",
      signer: organizerWallet,
      args: {
        organizer: organizerWallet,
        eventIdHex,
        tokenId: "42",
      },
    }),
  },
  {
    expectedArgCount: 2,
    expectedFunctionName: "withdraw",
    expectedSwitches: ["scvAddress", "scvBytes"],
    preparedAction: preparedAction({
      action: "withdraw_balance",
      functionName: "withdraw",
      signer: speakerWallet,
      args: {
        collaborator: speakerWallet,
        eventIdHex,
      },
    }),
  },
] as const;

const results = cases.map((item) => {
  const transaction = buildUnsignedLiveTransaction({
    options: {
      sourceSequence: "0",
      timeoutSeconds: 300,
    },
    preparedAction: item.preparedAction,
  });
  const functionName = parseLiveTransactionFunctionName({
    networkPassphrase: Networks.TESTNET,
    unsignedTransactionXdr: transaction.unsignedTransactionXdr,
  });
  const args = parseInvokeArgs(transaction.unsignedTransactionXdr);
  const parsedArgsXdr = args.map((arg) => arg.toXDR("base64"));
  const expectedArgsXdr = buildLiveContractInvocationArgsXdr(
    item.preparedAction,
  );

  assert.equal(functionName, item.expectedFunctionName);
  assert.equal(transaction.simulationRequired, true);
  assert.equal(transaction.source, item.preparedAction.signer);
  assert.equal(args.length, item.expectedArgCount);
  assert.deepEqual(transaction.invocationArgsXdr, expectedArgsXdr);
  assert.deepEqual(transaction.invocationArgsXdr, parsedArgsXdr);
  item.expectedSwitches.forEach((switchName, index) => {
    assertScValSwitch(args[index], switchName);
  });

  if (item.expectedFunctionName === "create_event") {
    const splitVec = args[6].vec();
    assert.equal(splitVec?.length, 2);
    const [firstSplit] = splitVec ?? [];
    const [percentBpsEntry, walletEntry] = firstSplit.map() ?? [];
    assert.equal(percentBpsEntry.key().switch().name, "scvSymbol");
    assert.equal(percentBpsEntry.key().sym().toString(), "percent_bps");
    assert.equal(percentBpsEntry.val().switch().name, "scvU32");
    assert.equal(percentBpsEntry.val().u32(), 7000);
    assert.equal(walletEntry.key().sym().toString(), "wallet");
    assert.equal(walletEntry.val().switch().name, "scvAddress");
  }

  return {
    action: item.preparedAction.action,
    argCount: args.length,
    functionName,
    xdrLength: transaction.unsignedTransactionXdr.length,
  };
});

assert.throws(
  () =>
    buildUnsignedLiveTransaction({
      options: {
        sourceSequence: "bad-sequence",
      },
      preparedAction: cases[0].preparedAction,
    }),
  /Source sequence/,
);

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "create-event-xdr",
        "purchase-xdr",
        "check-in-xdr",
        "withdraw-xdr",
        "invocation-args-xdr",
        "split-recipient-symbol-map",
        "invalid-source-sequence",
      ],
      results,
    },
    null,
    2,
  ),
);
