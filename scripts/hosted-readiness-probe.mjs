import assert from "node:assert/strict";
import fs from "node:fs";

const DEFAULT_HOSTED_URL = "https://quorum-sandy-eight.vercel.app";
const timeoutMs = 20_000;
const requireEvidenceReady = process.argv.includes("--require-evidence-ready");
const baseUrl = new URL(
  process.env.QUORUM_HOSTED_URL?.trim() || DEFAULT_HOSTED_URL,
);

assert.equal(baseUrl.protocol, "https:", "Hosted probe requires an HTTPS URL.");
assert.equal(
  baseUrl.username || baseUrl.password,
  "",
  "Hosted probe URL must not contain credentials.",
);

const deploymentEvidence = JSON.parse(
  fs.readFileSync("docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json", "utf8"),
);

async function get(pathname) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = new URL(pathname, baseUrl);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { accept: "text/html, application/json, text/plain" },
    });
    const body = await response.text();

    return {
      body,
      finalUrl: response.url,
      ok: response.ok,
      path: pathname,
      status: response.status,
    };
  } finally {
    clearTimeout(timeout);
  }
}

const routeResults = await Promise.all(
  [
    "/",
    "/discover",
    "/.well-known/stellar.toml",
    "/api/contracts/status",
    "/evidence",
  ].map(get),
);

const byPath = new Map(routeResults.map((result) => [result.path, result]));
const hardFailures = [];

for (const pathname of [
  "/",
  "/discover",
  "/.well-known/stellar.toml",
  "/api/contracts/status",
]) {
  const result = byPath.get(pathname);
  if (!result?.ok) {
    hardFailures.push(`${pathname} returned HTTP ${result?.status ?? "unknown"}.`);
  }
}

const toml = byPath.get("/.well-known/stellar.toml")?.body ?? "";
if (!toml.includes('NETWORK_PASSPHRASE="Test SDF Network ; September 2015"')) {
  hardFailures.push("stellar.toml does not advertise the Stellar testnet passphrase.");
}

let contractStatus = null;
try {
  contractStatus = JSON.parse(byPath.get("/api/contracts/status")?.body ?? "");
} catch {
  hardFailures.push("Contract status endpoint did not return valid JSON.");
}

if (contractStatus) {
  const expected = deploymentEvidence.contracts;
  const expectedFields = [
    ["coreContractId", expected.coreContractId],
    ["passContractId", expected.passContractId],
    ["usdcContractId", expected.usdcContractId],
  ];

  for (const [field, value] of expectedFields) {
    if (contractStatus[field] !== value) {
      hardFailures.push(`${field} does not match deployment evidence.`);
    }
  }

  if (
    contractStatus.network !== "TESTNET" ||
    contractStatus.rpcReachable !== true ||
    contractStatus.contractsConfigured !== true ||
    contractStatus.paymentAssetConfigured !== true
  ) {
    hardFailures.push("Contract status is not fully configured and RPC-reachable on testnet.");
  }
}

const evidenceResult = byPath.get("/evidence");
const evidenceDegraded =
  !evidenceResult?.ok ||
  /Evidence data is temporarily unavailable/i.test(evidenceResult.body);
const evidenceHealthy = Boolean(evidenceResult?.ok) && !evidenceDegraded;

if (requireEvidenceReady && !evidenceHealthy) {
  hardFailures.push("Evidence page is still in its degraded production state.");
}

const report = {
  ok: hardFailures.length === 0,
  mode: "read-only-get",
  baseUrl: baseUrl.origin,
  hostedSurfaceReady: hardFailures.length === 0 && evidenceHealthy,
  currentOriginEvidenceProven: false,
  routeResults: routeResults.map((result) => ({
    finalUrl: result.finalUrl,
    ok: result.ok,
    path: result.path,
    status: result.status,
  })),
  contractStatus: contractStatus
    ? {
        network: contractStatus.network,
        contractsConfigured: contractStatus.contractsConfigured,
        paymentAssetConfigured: contractStatus.paymentAssetConfigured,
        proofMode: contractStatus.proofMode,
        rpcReachable: contractStatus.rpcReachable,
      }
    : null,
  evidence: {
    healthy: evidenceHealthy,
    degraded: evidenceDegraded,
    status: evidenceResult?.status ?? null,
  },
  releaseBoundary:
    "This probe cannot prove migration history, cron execution, browser quality, " +
    "wallet signing, indexed events, or MoneyGram pickup.",
  failures: hardFailures,
};

console.log(JSON.stringify(report, null, 2));

if (!report.ok) {
  process.exit(1);
}
