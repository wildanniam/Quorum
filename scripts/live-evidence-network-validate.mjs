import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scValToNative, xdr } from "@stellar/stellar-sdk";

const DEFAULT_HORIZON_URL = "https://horizon-testnet.stellar.org";
const USDC_DECIMALS = 7;
const FINAL_EVIDENCE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

const flowSpecs = [
  {
    id: "publishPaidEvent",
    hashPath: "liveFlows.publishPaidEvent.txHash",
    walletPath: "wallets.organizer",
    functionName: "create_event",
  },
  {
    id: "paidCheckout",
    hashPath: "liveFlows.paidCheckout.txHash",
    walletPath: "wallets.paidAttendee",
    functionName: "purchase",
  },
  {
    id: "publishFreeEvent",
    hashPath: "liveFlows.publishFreeEvent.txHash",
    walletPath: "wallets.organizer",
    functionName: "create_event",
  },
  {
    id: "freeClaim",
    hashPath: "liveFlows.freeClaim.txHash",
    walletPath: "wallets.freeAttendee",
    functionName: "purchase",
  },
  {
    id: "checkIn",
    hashPath: "liveFlows.checkIn.txHash",
    walletPath: "wallets.organizer",
    functionName: "check_in",
  },
  {
    id: "collaboratorWithdraw",
    hashPath: "liveFlows.collaboratorWithdraw.txHash",
    walletPath: "wallets.collaborator",
    functionName: "withdraw",
  },
];

function getPath(source, dottedPath) {
  return dottedPath
    .split(".")
    .reduce(
      (current, segment) =>
        current && Object.prototype.hasOwnProperty.call(current, segment)
          ? current[segment]
          : undefined,
      source,
    );
}

function decodeOperationParams(operation) {
  return (operation.parameters ?? []).map((parameter) =>
    scValToNative(xdr.ScVal.fromXDR(parameter.value, "base64")),
  );
}

function toBigInt(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return BigInt(value);
  }
  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    return BigInt(value);
  }
  return null;
}

function decimalToAtomic(value, decimals = USDC_DECIMALS) {
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?$/.test(value)) {
    return null;
  }

  const [whole, fraction = ""] = value.split(".");

  if (fraction.length > decimals) return null;

  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0") || "0")
  );
}

function eventIdFor(value) {
  return Buffer.isBuffer(value) && value.length > 0 ? value.toString("hex") : null;
}

function splitTotalBps(value) {
  if (!Array.isArray(value) || value.length === 0) return null;

  let total = 0n;

  for (const split of value) {
    const bps = toBigInt(split?.percent_bps);

    if (bps === null || typeof split?.wallet !== "string") return null;
    total += bps;
  }

  return total;
}

function transactionTimestamp(bundle) {
  const parsed = Date.parse(bundle?.transaction?.created_at);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasEffect(effects, expected) {
  return effects.some((effect) => {
    if (effect.type !== expected.type) return false;
    if (effect.asset_code !== "USDC") return false;

    const amount = decimalToAtomic(effect.amount);
    if (amount !== expected.amountAtomic) return false;

    if (expected.account && effect.account !== expected.account) return false;
    if (expected.contract && effect.contract !== expected.contract) return false;

    return true;
  });
}

async function fetchJson(fetchImpl, url) {
  const response = await fetchImpl(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchTransactionBundle(fetchImpl, horizonUrl, txHash) {
  const baseUrl = horizonUrl.replace(/\/$/, "");
  const [transaction, operations, effects] = await Promise.all([
    fetchJson(fetchImpl, `${baseUrl}/transactions/${txHash}`),
    fetchJson(fetchImpl, `${baseUrl}/transactions/${txHash}/operations?limit=20`),
    fetchJson(fetchImpl, `${baseUrl}/transactions/${txHash}/effects?limit=200`),
  ]);

  return {
    transaction,
    operations: operations._embedded?.records ?? [],
    effects: effects._embedded?.records ?? [],
  };
}

export async function validateEvidenceAgainstHorizon(
  evidence,
  {
    decodeParams = decodeOperationParams,
    fetchImpl = fetch,
    horizonUrl = DEFAULT_HORIZON_URL,
  } = {},
) {
  const failures = [];
  const bundles = new Map();
  const transactions = [];
  const generatedAt = Date.parse(evidence?.generatedAt);
  const approvedAt = Date.parse(evidence?.approval?.approvedAt);
  const coreContractId = evidence?.contracts?.coreContractId;

  const fail = (message) => failures.push(message);

  if (evidence?.network !== "TESTNET") {
    fail("network must be TESTNET for Horizon evidence validation.");
  }

  if (!Number.isFinite(generatedAt)) {
    fail("generatedAt must be a valid timestamp.");
  }

  if (!Number.isFinite(approvedAt)) {
    fail("approval.approvedAt must be a valid timestamp.");
  }

  for (const spec of flowSpecs) {
    const txHash = getPath(evidence, spec.hashPath);
    const expectedWallet = getPath(evidence, spec.walletPath);

    if (!/^[0-9a-f]{64}$/i.test(txHash ?? "")) {
      fail(`${spec.hashPath} must be a 64-character transaction hash.`);
      continue;
    }

    let bundle;

    try {
      bundle = await fetchTransactionBundle(fetchImpl, horizonUrl, txHash);
    } catch (error) {
      fail(`${spec.id} could not be verified on Horizon: ${error.message}`);
      continue;
    }

    const operation = bundle.operations[0];
    const closedAt = transactionTimestamp(bundle);

    if (bundle.transaction.hash !== txHash) {
      fail(`${spec.id} Horizon hash does not match the evidence packet.`);
    }
    if (bundle.transaction.successful !== true) {
      fail(`${spec.id} transaction is not successful on Stellar testnet.`);
    }
    if (bundle.transaction.operation_count !== 1 || bundle.operations.length !== 1) {
      fail(`${spec.id} must contain exactly one contract operation.`);
    }
    if (bundle.transaction.source_account !== expectedWallet) {
      fail(`${spec.id} transaction source does not match ${spec.walletPath}.`);
    }
    if (!operation || operation.type !== "invoke_host_function") {
      fail(`${spec.id} must be an invoke_host_function operation.`);
      continue;
    }
    if (
      operation.function !==
      "HostFunctionTypeHostFunctionTypeInvokeContract"
    ) {
      fail(`${spec.id} must invoke a Soroban contract.`);
    }
    if (operation.transaction_successful !== true) {
      fail(`${spec.id} operation is not marked successful.`);
    }
    if (operation.source_account !== expectedWallet) {
      fail(`${spec.id} operation source does not match ${spec.walletPath}.`);
    }

    let params;

    try {
      params = decodeParams(operation);
    } catch (error) {
      fail(`${spec.id} parameters could not be decoded: ${error.message}`);
      continue;
    }

    if (params[0] !== coreContractId) {
      fail(`${spec.id} invokes the wrong core contract.`);
    }
    if (params[1] !== spec.functionName) {
      fail(`${spec.id} must invoke ${spec.functionName}.`);
    }
    if (params[2] !== expectedWallet) {
      fail(`${spec.id} contract actor does not match ${spec.walletPath}.`);
    }

    if (closedAt === null) {
      fail(`${spec.id} has an invalid Horizon created_at timestamp.`);
    } else if (Number.isFinite(generatedAt)) {
      const ageAtCapture = generatedAt - closedAt;

      if (ageAtCapture < -FUTURE_TOLERANCE_MS) {
        fail(`${spec.id} closed after the evidence packet was generated.`);
      } else if (ageAtCapture > FINAL_EVIDENCE_MAX_AGE_MS) {
        fail(`${spec.id} is too old for the final current-origin evidence packet.`);
      }
    }

    if (
      closedAt !== null &&
      Number.isFinite(approvedAt) &&
      closedAt < approvedAt - FUTURE_TOLERANCE_MS
    ) {
      fail(`${spec.id} predates the recorded signing approval.`);
    }

    bundles.set(spec.id, { ...bundle, params });
    transactions.push({
      id: spec.id,
      txHash,
      ledger: bundle.transaction.ledger,
      closedAt: bundle.transaction.created_at,
      functionName: params[1],
    });
  }

  const paidPublish = bundles.get("publishPaidEvent");
  const paidCheckout = bundles.get("paidCheckout");
  const freePublish = bundles.get("publishFreeEvent");
  const freeClaim = bundles.get("freeClaim");
  const checkIn = bundles.get("checkIn");
  const withdraw = bundles.get("collaboratorWithdraw");
  const expectedPaidAtomic = 10n ** BigInt(USDC_DECIMALS);

  if (paidPublish) {
    if (toBigInt(paidPublish.params[4]) !== expectedPaidAtomic) {
      fail("publishPaidEvent contract price must be exactly 1 USDC.");
    }
    if (paidPublish.params[5] !== evidence.contracts.usdcContractId) {
      fail("publishPaidEvent uses the wrong USDC contract.");
    }
    if (paidPublish.params[7] !== false) {
      fail("publishPaidEvent must be marked as paid.");
    }
    if (splitTotalBps(paidPublish.params[8]) !== 10_000n) {
      fail("publishPaidEvent on-chain split total must be 10000 bps.");
    }
    if (paidPublish.params[10] !== evidence.contracts.passContractId) {
      fail("publishPaidEvent uses the wrong pass contract.");
    }
  }

  if (freePublish) {
    if (toBigInt(freePublish.params[4]) !== 0n) {
      fail("publishFreeEvent contract price must be 0 USDC.");
    }
    if (freePublish.params[5] !== evidence.contracts.usdcContractId) {
      fail("publishFreeEvent uses the wrong USDC contract.");
    }
    if (freePublish.params[7] !== true) {
      fail("publishFreeEvent must be marked as free.");
    }
    if (splitTotalBps(freePublish.params[8]) !== 10_000n) {
      fail("publishFreeEvent on-chain split total must be 10000 bps.");
    }
    if (freePublish.params[10] !== evidence.contracts.passContractId) {
      fail("publishFreeEvent uses the wrong pass contract.");
    }
  }

  if (paidCheckout) {
    if (toBigInt(paidCheckout.params[4]) !== expectedPaidAtomic) {
      fail("paidCheckout contract amount must be exactly 1 USDC.");
    }
    if (
      !hasEffect(paidCheckout.effects, {
        type: "account_debited",
        amountAtomic: expectedPaidAtomic,
        account: evidence.wallets.paidAttendee,
      }) ||
      !hasEffect(paidCheckout.effects, {
        type: "contract_credited",
        amountAtomic: expectedPaidAtomic,
        contract: coreContractId,
      })
    ) {
      fail("paidCheckout must debit 1 USDC and credit the Quorum core contract.");
    }
  }

  if (freeClaim) {
    if (toBigInt(freeClaim.params[4]) !== 0n) {
      fail("freeClaim contract amount must be 0 USDC.");
    }

    const movedAsset = freeClaim.effects.some(
      (effect) => decimalToAtomic(effect.amount) > 0n,
    );

    if (movedAsset) {
      fail("freeClaim must not move an asset balance.");
    }
  }

  if (checkIn) {
    const recordedTokenId = evidence.liveFlows?.paidCheckout?.tokenId;
    const checkInTokenId = toBigInt(checkIn.params[4])?.toString();

    if (checkInTokenId !== recordedTokenId) {
      fail("checkIn contract token ID must match paidCheckout.tokenId.");
    }
  }

  if (withdraw) {
    const withdrawAtomic = decimalToAtomic(
      evidence.liveFlows?.collaboratorWithdraw?.withdrawAmountUsdc,
    );

    if (withdrawAtomic === null || withdrawAtomic <= 0n) {
      fail("collaboratorWithdraw.withdrawAmountUsdc must be non-zero.");
    } else if (
      !hasEffect(withdraw.effects, {
        type: "contract_debited",
        amountAtomic: withdrawAtomic,
        contract: coreContractId,
      }) ||
      !hasEffect(withdraw.effects, {
        type: "account_credited",
        amountAtomic: withdrawAtomic,
        account: evidence.wallets.collaborator,
      })
    ) {
      fail("collaboratorWithdraw effects do not prove the recorded USDC payout.");
    }
  }

  const paidEventIds = [paidPublish, paidCheckout, checkIn, withdraw].map((bundle) =>
    eventIdFor(bundle?.params?.[3]),
  );
  const freeEventIds = [freePublish, freeClaim].map((bundle) =>
    eventIdFor(bundle?.params?.[3]),
  );

  if (paidEventIds.some((value) => !value) || new Set(paidEventIds).size !== 1) {
    fail("Paid publish, checkout, check-in, and withdraw must use one event ID.");
  }
  if (freeEventIds.some((value) => !value) || new Set(freeEventIds).size !== 1) {
    fail("Free publish and claim must use one event ID.");
  }
  if (paidEventIds[0] && paidEventIds[0] === freeEventIds[0]) {
    fail("Paid and free evidence must use distinct event IDs.");
  }

  const paidOrder = [paidPublish, paidCheckout, checkIn, withdraw].map(
    transactionTimestamp,
  );
  const freeOrder = [freePublish, freeClaim].map(transactionTimestamp);

  if (
    paidOrder.some((value) => value === null) ||
    paidOrder.some((value, index) => index > 0 && value < paidOrder[index - 1])
  ) {
    fail("Paid flow transactions are not in publish, checkout, check-in, withdraw order.");
  }
  if (
    freeOrder.some((value) => value === null) ||
    freeOrder.some((value, index) => index > 0 && value < freeOrder[index - 1])
  ) {
    fail("Free flow transactions are not in publish then claim order.");
  }

  return {
    ok: failures.length === 0,
    network: evidence?.network ?? null,
    horizonUrl,
    checkedFlows: flowSpecs.length,
    transactions,
    failures,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const evidenceArg =
    args.find((arg) => !arg.startsWith("--")) ??
    "docs/LIVE_TESTNET_EVIDENCE.json";
  const horizonArg = args.find((arg) => arg.startsWith("--horizon-url="));
  const horizonUrl = horizonArg?.slice("--horizon-url=".length) || DEFAULT_HORIZON_URL;
  const evidencePath = path.isAbsolute(evidenceArg)
    ? evidenceArg
    : path.join(process.cwd(), evidenceArg);

  let evidence;

  try {
    evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          evidencePath,
          horizonUrl,
          failures: [`Unable to read live evidence JSON: ${error.message}`],
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  const report = await validateEvidenceAgainstHorizon(evidence, { horizonUrl });

  console.log(JSON.stringify({ ...report, evidencePath }, null, 2));

  if (!report.ok) process.exit(1);
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  await main();
}
