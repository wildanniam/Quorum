import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const args = process.argv.slice(2);
const requireFilled = args.includes("--require-filled");
const requireCurrentOrigin = args.includes("--require-current-origin");
const expectedOriginArg = args.find((arg) =>
  arg.startsWith("--expected-origin="),
);
const expectedOriginValue = expectedOriginArg?.slice(
  "--expected-origin=".length,
);
const currentEvidenceMaxAgeHours = 7 * 24;
const currentIndexerMaxAgeHours = 24;
const evidenceArg =
  args.find((arg) => !arg.startsWith("--")) ??
  "docs/LIVE_TESTNET_EVIDENCE.example.json";
const evidencePath = path.isAbsolute(evidenceArg)
  ? evidenceArg
  : path.join(projectRoot, evidenceArg);

const coreWasmHash =
  "73ad1844be4fbcf16c76206b18461b020c68c6e230e4fb8b37d50e2dcddb2ac0";
const passWasmHash =
  "e78624a8bf8dbb1babdf808ff38bc29053fe8a91c3761ee64c519983797202ec";

const requiredFields = [
  ["generatedAt", "isoDate"],
  ["network", "literal:TESTNET"],
  ["rpcUrl", "url"],
  ["hostedAppUrl", "url"],
  ["wallets.admin", "accountId"],
  ["wallets.organizer", "accountId"],
  ["wallets.paidAttendee", "accountId"],
  ["wallets.freeAttendee", "accountId"],
  ["wallets.collaborator", "accountId"],
  ["contracts.coreContractId", "contractId"],
  ["contracts.passContractId", "contractId"],
  ["contracts.usdcContractId", "contractId"],
  ["contracts.coreWasmHash", `literal:${coreWasmHash}`],
  ["contracts.passWasmHash", `literal:${passWasmHash}`],
  ["contracts.platformFeeBps", "feeBps"],
  ["deploymentTransactions.passDeployTxHash", "hex64"],
  ["deploymentTransactions.coreDeployTxHash", "hex64"],
  ["deploymentTransactions.passInitTxHash", "hex64"],
  ["deploymentTransactions.coreInitTxHash", "hex64"],
  ["deploymentTransactions.passSetCoreTxHash", "hex64"],
  ["liveFlows.publishPaidEvent.txHash", "hex64"],
  ["liveFlows.publishPaidEvent.eventUrl", "url"],
  ["liveFlows.paidCheckout.txHash", "hex64"],
  ["liveFlows.paidCheckout.tokenId", "positiveIntegerString"],
  ["liveFlows.paidCheckout.paymentAsset", "literal:USDC"],
  ["liveFlows.publishFreeEvent.txHash", "hex64"],
  ["liveFlows.publishFreeEvent.eventUrl", "url"],
  ["liveFlows.freeClaim.txHash", "hex64"],
  ["liveFlows.freeClaim.tokenId", "positiveIntegerString"],
  ["liveFlows.checkIn.txHash", "hex64"],
  ["liveFlows.checkIn.tokenId", "positiveIntegerString"],
  ["liveFlows.collaboratorWithdraw.txHash", "hex64"],
  ["liveFlows.collaboratorWithdraw.withdrawAmountUsdc", "positiveDecimalString"],
  ["browserProof.contractStatusUrl", "url"],
  ["browserProof.contractStatusProofMode", "literal:live"],
  ["browserProof.contractStatusActionsLive", "booleanTrue"],
  ["browserProof.paidResourceUnlockedUrl", "url"],
  ["browserProof.browserQaDeployed", "string"],
  ["verification.commands.contractsDoctor.command", "literal:npm run contracts:doctor"],
  ["verification.commands.contractsDoctor.status", "passStatus"],
  ["verification.commands.contractsDoctor.exitCode", "zeroExit"],
  ["verification.commands.contractsTest.command", "literal:npm run contracts:test"],
  ["verification.commands.contractsTest.status", "passStatus"],
  ["verification.commands.contractsTest.exitCode", "zeroExit"],
  ["verification.commands.contractsBuild.command", "literal:npm run contracts:build"],
  ["verification.commands.contractsBuild.status", "passStatus"],
  ["verification.commands.contractsBuild.exitCode", "zeroExit"],
  ["verification.commands.lint.command", "literal:npm run lint"],
  ["verification.commands.lint.status", "passStatus"],
  ["verification.commands.lint.exitCode", "zeroExit"],
  ["verification.commands.build.command", "literal:npm run build"],
  ["verification.commands.build.status", "passStatus"],
  ["verification.commands.build.exitCode", "zeroExit"],
  ["verification.commands.readinessAudit.command", "literal:npm run readiness:audit"],
  ["verification.commands.readinessAudit.status", "passStatus"],
  ["verification.commands.readinessAudit.exitCode", "zeroExit"],
  ["approval.explicitApprovalRecorded", "booleanTrue"],
  ["approval.approvedBy", "string"],
  ["approval.approvedAt", "isoDate"],
  ["approval.notes", "string"],
];

const transactionHashFields = [
  "deploymentTransactions.passDeployTxHash",
  "deploymentTransactions.coreDeployTxHash",
  "deploymentTransactions.passInitTxHash",
  "deploymentTransactions.coreInitTxHash",
  "deploymentTransactions.passSetCoreTxHash",
  "liveFlows.publishPaidEvent.txHash",
  "liveFlows.paidCheckout.txHash",
  "liveFlows.publishFreeEvent.txHash",
  "liveFlows.freeClaim.txHash",
  "liveFlows.checkIn.txHash",
  "liveFlows.collaboratorWithdraw.txHash",
];

const hostedProofUrlFields = [
  "liveFlows.publishPaidEvent.eventUrl",
  "liveFlows.publishFreeEvent.eventUrl",
  "browserProof.contractStatusUrl",
  "browserProof.paidResourceUnlockedUrl",
];

const contractIdFields = [
  "contracts.coreContractId",
  "contracts.passContractId",
  "contracts.usdcContractId",
];

const currentOriginFields = [
  ["liveFlows.publishPaidEvent.priceUsdc", "1"],
  ["liveFlows.publishPaidEvent.splitTotalBps", 10000],
  ["liveFlows.paidCheckout.amountUsdc", "1"],
  ["liveFlows.publishFreeEvent.priceUsdc", "0"],
  ["liveFlows.publishFreeEvent.splitTotalBps", 10000],
  ["liveFlows.freeClaim.amountUsdc", "0"],
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function isPlaceholder(value) {
  return typeof value === "string" && /^<[^>]+>$/.test(value.trim());
}

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

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isUrl(value) {
  if (!hasText(value)) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function isPrivateIpv4(hostname) {
  const octets = hostname.split(".").map((part) => Number(part));

  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  const [first, second] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isLocalOrPrivateHostname(hostname) {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  return (
    normalized === "localhost" ||
    normalized === "localhost.localdomain" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80") ||
    isPrivateIpv4(normalized)
  );
}

function isPublicHttpsUrl(value) {
  if (!hasText(value)) return false;

  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      Boolean(parsed.hostname) &&
      !isLocalOrPrivateHostname(parsed.hostname)
    );
  } catch {
    return false;
  }
}

function isIsoDate(value) {
  return hasText(value) && !Number.isNaN(Date.parse(value));
}

function originFor(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function normalizeExpectedOrigin(value) {
  if (!hasText(value)) return null;

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "https:" || !parsed.hostname) return null;

    return parsed.origin;
  } catch {
    return null;
  }
}

function indexerCursorParts(value) {
  if (typeof value !== "string" || !/^\d+-\d+$/.test(value)) return null;

  return value.split("-").map((part) => BigInt(part));
}

function compareIndexerCursors(left, right) {
  const leftParts = indexerCursorParts(left);
  const rightParts = indexerCursorParts(right);

  if (!leftParts || !rightParts) return null;
  if (leftParts[0] !== rightParts[0]) {
    return leftParts[0] > rightParts[0] ? 1 : -1;
  }
  if (leftParts[1] === rightParts[1]) return 0;

  return leftParts[1] > rightParts[1] ? 1 : -1;
}

function assertUniqueValues(source, fieldPaths, label) {
  const seen = new Map();

  for (const fieldPath of fieldPaths) {
    const value = getPath(source, fieldPath);

    if (!hasText(value)) continue;

    const normalized = value.toLowerCase();
    const previous = seen.get(normalized);

    if (previous) {
      fail(`${fieldPath} must be unique; it duplicates ${previous} (${label}).`);
    } else {
      seen.set(normalized, fieldPath);
    }
  }
}

function validateFilledEvidenceConsistency(source) {
  assertUniqueValues(source, transactionHashFields, "transaction hash");
  assertUniqueValues(source, contractIdFields, "contract ID");

  const paidTokenId = getPath(source, "liveFlows.paidCheckout.tokenId");
  const freeTokenId = getPath(source, "liveFlows.freeClaim.tokenId");
  const checkInTokenId = getPath(source, "liveFlows.checkIn.tokenId");

  if (paidTokenId && checkInTokenId && paidTokenId !== checkInTokenId) {
    fail("liveFlows.checkIn.tokenId must match liveFlows.paidCheckout.tokenId.");
  }

  if (paidTokenId && freeTokenId && paidTokenId === freeTokenId) {
    fail("liveFlows.freeClaim.tokenId must be distinct from liveFlows.paidCheckout.tokenId.");
  }

  const paidEventUrl = getPath(source, "liveFlows.publishPaidEvent.eventUrl");
  const freeEventUrl = getPath(source, "liveFlows.publishFreeEvent.eventUrl");

  if (paidEventUrl && freeEventUrl && paidEventUrl === freeEventUrl) {
    fail("liveFlows.publishFreeEvent.eventUrl must be distinct from liveFlows.publishPaidEvent.eventUrl.");
  }

  const hostedOrigin = originFor(getPath(source, "hostedAppUrl"));

  if (hostedOrigin) {
    for (const fieldPath of hostedProofUrlFields) {
      const proofOrigin = originFor(getPath(source, fieldPath));

      if (proofOrigin && proofOrigin !== hostedOrigin) {
        fail(`${fieldPath} must use the same origin as hostedAppUrl.`);
      }
    }
  }
}

function validateCurrentOriginEvidence(source) {
  const expectedOrigin = normalizeExpectedOrigin(expectedOriginValue);
  const hostedOrigin = originFor(getPath(source, "hostedAppUrl"));

  if (!expectedOrigin) {
    fail(
      "--require-current-origin needs a public HTTPS --expected-origin=<origin> value.",
    );
  } else if (hostedOrigin !== expectedOrigin) {
    fail(
      `hostedAppUrl must use the current release origin ${expectedOrigin}.`,
    );
  }

  for (const [fieldPath, expected] of currentOriginFields) {
    const actual = getPath(source, fieldPath);

    if (actual !== expected) {
      fail(`${fieldPath} must be ${JSON.stringify(expected)} for the final evidence run.`);
    }
  }

  const generatedAt = Date.parse(getPath(source, "generatedAt"));
  const approvedAt = Date.parse(getPath(source, "approval.approvedAt"));
  const evidenceAgeMs = Date.now() - generatedAt;
  const maxAgeMs = currentEvidenceMaxAgeHours * 60 * 60 * 1000;

  if (!Number.isFinite(generatedAt) || evidenceAgeMs < -5 * 60 * 1000) {
    fail("generatedAt must be a valid timestamp that is not in the future.");
  } else if (evidenceAgeMs > maxAgeMs) {
    fail(
      `generatedAt must be no more than ${currentEvidenceMaxAgeHours} hours old for current-origin evidence.`,
    );
  }

  if (
    Number.isFinite(generatedAt) &&
    Number.isFinite(approvedAt) &&
    approvedAt > generatedAt
  ) {
    fail("approval.approvedAt must not be later than generatedAt.");
  }

  const stateId = getPath(source, "indexerProof.stateId");
  const lastRunStatus = getPath(source, "indexerProof.lastRunStatus");
  const baselineCursor = getPath(source, "indexerProof.baselineCursor");
  const finalCursor = getPath(source, "indexerProof.finalCursor");
  const baselineLatestLedger = getPath(
    source,
    "indexerProof.baselineLatestLedger",
  );
  const finalLatestLedger = getPath(source, "indexerProof.finalLatestLedger");
  const lastSuccessAt = Date.parse(getPath(source, "indexerProof.lastSuccessAt"));
  const indexedEventCount = getPath(source, "indexerProof.indexedEventCount");
  const indexedTransactionHashes = getPath(
    source,
    "indexerProof.indexedTransactionHashes",
  );
  const evidenceUrl = getPath(source, "indexerProof.evidenceUrl");

  if (stateId !== "quorum-testnet-contracts") {
    fail('indexerProof.stateId must be "quorum-testnet-contracts".');
  }
  if (lastRunStatus !== "success") {
    fail('indexerProof.lastRunStatus must be "success".');
  }
  if (compareIndexerCursors(finalCursor, baselineCursor) !== 1) {
    fail("indexerProof.finalCursor must advance beyond baselineCursor.");
  }
  if (
    !Number.isInteger(baselineLatestLedger) ||
    !Number.isInteger(finalLatestLedger) ||
    baselineLatestLedger < 0 ||
    finalLatestLedger <= baselineLatestLedger
  ) {
    fail("indexerProof.finalLatestLedger must advance beyond baselineLatestLedger.");
  }

  const indexerAgeMs = generatedAt - lastSuccessAt;
  const maxIndexerAgeMs = currentIndexerMaxAgeHours * 60 * 60 * 1000;

  if (!Number.isFinite(lastSuccessAt) || indexerAgeMs < -5 * 60 * 1000) {
    fail("indexerProof.lastSuccessAt must be valid and not later than generatedAt.");
  } else if (indexerAgeMs > maxIndexerAgeMs) {
    fail(
      `indexerProof.lastSuccessAt must be no more than ${currentIndexerMaxAgeHours} hours before generatedAt.`,
    );
  }

  const liveTransactionHashes = transactionHashFields
    .filter((fieldPath) => fieldPath.startsWith("liveFlows."))
    .map((fieldPath) => getPath(source, fieldPath));
  const normalizedIndexedHashes = Array.isArray(indexedTransactionHashes)
    ? indexedTransactionHashes.map((value) =>
        typeof value === "string" ? value.toLowerCase() : value,
      )
    : [];
  const normalizedLiveHashes = liveTransactionHashes.map((value) =>
    typeof value === "string" ? value.toLowerCase() : value,
  );

  if (
    !Array.isArray(indexedTransactionHashes) ||
    indexedTransactionHashes.length !== liveTransactionHashes.length ||
    new Set(normalizedIndexedHashes).size !== indexedTransactionHashes.length ||
    indexedTransactionHashes.some((value) => !/^[0-9a-f]{64}$/i.test(value)) ||
    normalizedLiveHashes.some((value) => !normalizedIndexedHashes.includes(value))
  ) {
    fail(
      "indexerProof.indexedTransactionHashes must contain each unique app-flow transaction hash.",
    );
  }
  if (
    !Number.isInteger(indexedEventCount) ||
    indexedEventCount < liveTransactionHashes.length
  ) {
    fail("indexerProof.indexedEventCount must cover every app-flow transaction.");
  }

  let parsedEvidenceUrl = null;

  try {
    parsedEvidenceUrl = new URL(evidenceUrl);
  } catch {
    // One stable validation error is emitted below.
  }

  if (
    !parsedEvidenceUrl ||
    parsedEvidenceUrl.origin !== expectedOrigin ||
    parsedEvidenceUrl.pathname !== "/evidence"
  ) {
    fail(`indexerProof.evidenceUrl must be ${expectedOrigin}/evidence.`);
  }
}

function validateType(fieldPath, value, type) {
  if (type.startsWith("literal:")) {
    const expected = type.slice("literal:".length);
    if (value !== expected) {
      fail(`${fieldPath} must be ${JSON.stringify(expected)}.`);
    }
    return;
  }

  if (isPlaceholder(value)) {
    if (requireFilled) {
      fail(`${fieldPath} must be filled, not a placeholder.`);
    }
    return;
  }

  switch (type) {
    case "accountId":
      if (!/^G[A-Z2-7]{55}$/.test(value ?? "")) {
        fail(`${fieldPath} must be a Stellar account ID.`);
      }
      break;
    case "booleanTrue":
      if (requireFilled && value !== true) {
        fail(`${fieldPath} must be true for filled live evidence.`);
      }
      break;
    case "contractId":
      if (!/^C[A-Z2-7]{55}$/.test(value ?? "")) {
        fail(`${fieldPath} must be a Soroban contract ID.`);
      }
      break;
    case "feeBps":
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < 0 ||
        value > 10000
      ) {
        fail(`${fieldPath} must be an integer from 0 to 10000.`);
      }
      break;
    case "hex64":
      if (!/^[0-9a-fA-F]{64}$/.test(value ?? "")) {
        fail(`${fieldPath} must be a 64-character hex transaction hash.`);
      }
      break;
    case "isoDate":
      if (!isIsoDate(value)) {
        fail(`${fieldPath} must be an ISO timestamp.`);
      }
      break;
    case "passStatus":
      if (requireFilled && value !== "PASS") {
        fail(`${fieldPath} must be PASS for filled live evidence.`);
      }
      break;
    case "positiveDecimalString":
      if (
        !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value ?? "") ||
        Number(value) <= 0
      ) {
        fail(`${fieldPath} must be a positive decimal string.`);
      }
      break;
    case "positiveIntegerString":
      if (!/^[1-9]\d*$/.test(value ?? "")) {
        fail(`${fieldPath} must be a positive integer string.`);
      }
      break;
    case "string":
      if (!hasText(value)) {
        fail(`${fieldPath} must be a non-empty string.`);
      }
      break;
    case "url":
      if (!isUrl(value)) {
        fail(`${fieldPath} must be an http(s) URL.`);
      } else if (requireFilled && !isPublicHttpsUrl(value)) {
        fail(`${fieldPath} must be a public HTTPS URL for filled live evidence.`);
      }
      break;
    case "zeroExit":
      if (requireFilled && value !== 0) {
        fail(`${fieldPath} must be 0 for filled live evidence.`);
      }
      break;
    default:
      fail(`Unknown validator for ${fieldPath}: ${type}`);
  }
}

let evidence = null;

try {
  evidence = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
} catch (error) {
  fail(`Unable to read live evidence JSON: ${error.message}`);
}

if (evidence) {
  for (const [fieldPath, type] of requiredFields) {
    const value = getPath(evidence, fieldPath);

    if (value === undefined || value === null || value === "") {
      fail(`${fieldPath} is required.`);
      continue;
    }

    validateType(fieldPath, value, type);
  }

  if (requireFilled) {
    validateFilledEvidenceConsistency(evidence);
  }

  if (requireCurrentOrigin) {
    validateCurrentOriginEvidence(evidence);
  }
}

const report = {
  ok: failures.length === 0,
  mode: requireFilled ? "filled-live-evidence" : "template",
  evidencePath,
  requireFilled,
  requireCurrentOrigin,
  expectedOrigin: normalizeExpectedOrigin(expectedOriginValue),
  liveEvidenceComplete: requireFilled && failures.length === 0,
  checkedFields: requiredFields.length,
  failures,
};

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
