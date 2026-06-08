import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const args = process.argv.slice(2);
const requireFilled = args.includes("--require-filled");
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

function isIsoDate(value) {
  return hasText(value) && !Number.isNaN(Date.parse(value));
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
      if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value ?? "")) {
        fail(`${fieldPath} must be a non-negative decimal string.`);
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
}

const report = {
  ok: failures.length === 0,
  mode: requireFilled ? "filled-live-evidence" : "template",
  evidencePath,
  requireFilled,
  liveEvidenceComplete: requireFilled && failures.length === 0,
  checkedFields: requiredFields.length,
  failures,
};

console.log(JSON.stringify(report, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
