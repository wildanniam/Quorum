import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import { Networks, StrKey } from "@stellar/stellar-sdk";
import { CONTRACT_ACTIONS } from "../src/lib/stellar/action-policy";
import { resolveSessionSecret } from "../src/lib/auth/session";

type EnvMap = Record<string, string | undefined>;

type DeploymentEvidence = {
  network?: unknown;
  rpcUrl?: unknown;
  contracts?: {
    coreContractId?: unknown;
    passContractId?: unknown;
    usdcContractId?: unknown;
  };
};

type ExpectedHostedRuntime = {
  hostedAppUrl: string;
  network: "TESTNET";
  rpcUrl: string;
  networkPassphrase: typeof Networks.TESTNET;
  coreContractId: string;
  passContractId: string;
  usdcContractId: string;
};

type FetchLike = (
  input: string,
  init?: { headers?: Record<string, string> },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

const evidencePath = "docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json";
const productionSecret = "hosted-production-session-secret-32-chars-minimum";
const operatorOnlyEnvKeys = [
  "STELLAR_ACCOUNT",
  "QUORUM_LIVE_SIGNING_APPROVED",
  "ADMIN_ADDRESS",
  "QUORUM_PLATFORM_FEE_BPS",
  "QUORUM_NONZERO_PLATFORM_FEE_APPROVED",
] as const;

function getArgValue(name: string) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;

  return process.argv[index + 1] ?? null;
}

function stripOptionalQuotes(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseEnvFile(path: string): EnvMap {
  const env: EnvMap = {};
  const source = readFileSync(path, "utf8");

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const assignment = line.startsWith("export ") ? line.slice(7).trim() : line;
    const equalsIndex = assignment.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = assignment.slice(0, equalsIndex).trim();
    const value = assignment.slice(equalsIndex + 1);
    if (!/^[A-Z0-9_]+$/.test(key)) continue;

    env[key] = stripOptionalQuotes(value);
  }

  return env;
}

function mergeEnv(...sources: EnvMap[]) {
  return Object.assign({}, ...sources) as EnvMap;
}

function readDeploymentEvidence(): DeploymentEvidence {
  return JSON.parse(readFileSync(evidencePath, "utf8")) as DeploymentEvidence;
}

function requireString(value: unknown, label: string) {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  assert.notEqual(value.trim(), "", `${label} must not be blank.`);

  return value;
}

function requireContractId(value: unknown, label: string) {
  const contractId = requireString(value, label);
  assert(StrKey.isValidContract(contractId), `${label} must be a contract ID.`);

  return contractId;
}

function buildExpectedRuntime(
  evidence: DeploymentEvidence,
  env: EnvMap,
  hostedUrlOverride?: string | null,
): ExpectedHostedRuntime {
  assert.equal(evidence.network, "TESTNET", "deployment evidence must be TESTNET.");

  const hostedAppUrl = hostedUrlOverride ?? env.QUORUM_HOSTED_APP_URL;
  const requiredHostedAppUrl = requireString(
    hostedAppUrl,
    "QUORUM_HOSTED_APP_URL or --url",
  );

  return {
    hostedAppUrl: requiredHostedAppUrl,
    network: "TESTNET",
    rpcUrl: requireString(evidence.rpcUrl, "evidence.rpcUrl"),
    networkPassphrase: Networks.TESTNET,
    coreContractId: requireContractId(
      evidence.contracts?.coreContractId,
      "evidence.contracts.coreContractId",
    ),
    passContractId: requireContractId(
      evidence.contracts?.passContractId,
      "evidence.contracts.passContractId",
    ),
    usdcContractId: requireContractId(
      evidence.contracts?.usdcContractId,
      "evidence.contracts.usdcContractId",
    ),
  };
}

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function assertPublicHttpsUrl(value: string, label: string) {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();

  assert.equal(url.protocol, "https:", `${label} must use HTTPS.`);
  assert(!hostname.endsWith(".local"), `${label} must not use .local hosts.`);
  assert.notEqual(hostname, "localhost", `${label} must not use localhost.`);
  assert.notEqual(hostname, "0.0.0.0", `${label} must not use 0.0.0.0.`);
  assert.notEqual(hostname, "::1", `${label} must not use loopback hosts.`);
  assert(
    !(isIP(hostname) === 4 && isPrivateIpv4(hostname)),
    `${label} must not use private or loopback IP ranges.`,
  );

  return url;
}

function assertHostedEnvMatchesEvidence(env: EnvMap, expected: ExpectedHostedRuntime) {
  assert.equal(
    env.NEXT_PUBLIC_STELLAR_NETWORK,
    expected.network,
    "NEXT_PUBLIC_STELLAR_NETWORK must match deployment evidence.",
  );
  assert.equal(
    env.NEXT_PUBLIC_STELLAR_RPC_URL,
    expected.rpcUrl,
    "NEXT_PUBLIC_STELLAR_RPC_URL must match deployment evidence.",
  );
  assert.equal(
    env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
    expected.networkPassphrase,
    "NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE must match deployment evidence.",
  );
  assert.equal(
    env.NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID,
    expected.coreContractId,
    "NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID must match deployment evidence.",
  );
  assert.equal(
    env.NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID,
    expected.passContractId,
    "NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID must match deployment evidence.",
  );
  assert.equal(
    env.NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID,
    expected.usdcContractId,
    "NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID must match deployment evidence.",
  );
}

function assertOperatorOnlyEnvAbsent(env: EnvMap) {
  for (const key of operatorOnlyEnvKeys) {
    assert(
      !env[key] || env[key]?.trim() === "",
      `${key} must not be present in the hosted runtime preflight env.`,
    );
  }
}

function assertHostedSessionSecret(env: EnvMap) {
  resolveSessionSecret({
    NODE_ENV: "production",
    QUORUM_SESSION_SECRET: env.QUORUM_SESSION_SECRET,
  });
}

function readField(source: unknown, field: string) {
  if (!source || typeof source !== "object") return undefined;

  return (source as Record<string, unknown>)[field];
}

function assertContractStatusPayload(
  payload: unknown,
  expected: ExpectedHostedRuntime,
) {
  assert.equal(readField(payload, "proofMode"), "live");
  assert.equal(readField(payload, "configured"), true);
  assert.equal(readField(payload, "network"), expected.network);
  assert.equal(readField(payload, "rpcUrl"), expected.rpcUrl);
  assert.equal(readField(payload, "networkPassphrase"), expected.networkPassphrase);
  assert.equal(readField(payload, "coreContractId"), expected.coreContractId);
  assert.equal(readField(payload, "passContractId"), expected.passContractId);
  assert.equal(readField(payload, "usdcContractId"), expected.usdcContractId);
  assert.equal(readField(payload, "rpcReachable"), true);
  assert.equal(readField(payload, "rpcNetworkPassphrase"), expected.networkPassphrase);

  const actions = readField(payload, "actions");
  assert(Array.isArray(actions), "contract status actions must be an array.");
  const actionPolicies: unknown[] = actions;

  for (const action of CONTRACT_ACTIONS) {
    const policy = actionPolicies.find(
      (item: unknown) =>
        item &&
        typeof item === "object" &&
        (item as Record<string, unknown>).action === action,
    );

    assert(policy, `contract status is missing ${action} policy.`);
    assert.equal(readField(policy, "executionMode"), "live_required");
    assert.equal(readField(policy, "proofMode"), "live");
  }
}

async function runHostedDeploymentPreflight(options: {
  env: EnvMap;
  fetcher?: FetchLike;
  hostedUrlOverride?: string | null;
}) {
  const expected = buildExpectedRuntime(
    readDeploymentEvidence(),
    options.env,
    options.hostedUrlOverride,
  );
  const hostedUrl = assertPublicHttpsUrl(expected.hostedAppUrl, "hosted app URL");
  const statusUrl = new URL("/api/contracts/status", hostedUrl).toString();

  assertHostedSessionSecret(options.env);
  assertHostedEnvMatchesEvidence(options.env, expected);
  assertOperatorOnlyEnvAbsent(options.env);

  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(statusUrl, {
    headers: { accept: "application/json" },
  });

  assert.equal(response.ok, true, `${statusUrl} returned HTTP ${response.status}.`);

  const statusPayload = await response.json();
  assertContractStatusPayload(statusPayload, expected);

  return {
    hostedAppUrl: expected.hostedAppUrl,
    contractStatusUrl: statusUrl,
    checks: [
      "hosted-url-public-https",
      "production-session-secret-present",
      "runtime-env-matches-deployment-evidence",
      "operator-signing-env-absent",
      "contract-status-live-proof-mode",
      "contract-status-rpc-reachable",
      "contract-status-actions-live-required",
    ],
  };
}

function fixtureEnv(overrides: EnvMap = {}) {
  const evidence = readDeploymentEvidence();
  const expected = buildExpectedRuntime(evidence, {
    QUORUM_HOSTED_APP_URL: "https://quorum.example.com",
  });

  return {
    QUORUM_HOSTED_APP_URL: "https://quorum.example.com",
    QUORUM_SESSION_SECRET: productionSecret,
    NEXT_PUBLIC_STELLAR_NETWORK: expected.network,
    NEXT_PUBLIC_STELLAR_RPC_URL: expected.rpcUrl,
    NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: expected.networkPassphrase,
    NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: expected.coreContractId,
    NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID: expected.passContractId,
    NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID: expected.usdcContractId,
    ...overrides,
  };
}

function fixtureStatus(overrides: Record<string, unknown> = {}) {
  const evidence = readDeploymentEvidence();
  const expected = buildExpectedRuntime(evidence, {
    QUORUM_HOSTED_APP_URL: "https://quorum.example.com",
  });

  return {
    network: expected.network,
    rpcUrl: expected.rpcUrl,
    networkPassphrase: expected.networkPassphrase,
    networkConfigured: true,
    coreContractId: expected.coreContractId,
    passContractId: expected.passContractId,
    usdcContractId: expected.usdcContractId,
    proofMode: "live",
    configured: true,
    contractsConfigured: true,
    paymentAssetConfigured: true,
    missing: [],
    invalid: [],
    actions: CONTRACT_ACTIONS.map((action) => ({
      action,
      executionMode: "live_required",
      proofMode: "live",
      message: `${action} must be submitted as a live Stellar transaction.`,
    })),
    rpcReachable: true,
    rpcNetworkPassphrase: expected.networkPassphrase,
    ...overrides,
  };
}

function jsonFetcher(payload: unknown): FetchLike {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => payload,
  });
}

async function runSmoke() {
  const pass = await runHostedDeploymentPreflight({
    env: fixtureEnv(),
    fetcher: jsonFetcher(fixtureStatus()),
  });

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({ QUORUM_HOSTED_APP_URL: "http://localhost:3000" }),
        fetcher: jsonFetcher(fixtureStatus()),
      }),
    /HTTPS/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({ NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: StrKey.encodeContract(Buffer.alloc(32, 5)) }),
        fetcher: jsonFetcher(fixtureStatus()),
      }),
    /NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({ STELLAR_ACCOUNT: "quorum-admin-testnet" }),
        fetcher: jsonFetcher(fixtureStatus()),
      }),
    /STELLAR_ACCOUNT/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({ QUORUM_SESSION_SECRET: "short" }),
        fetcher: jsonFetcher(fixtureStatus()),
      }),
    /QUORUM_SESSION_SECRET/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv(),
        fetcher: jsonFetcher(fixtureStatus({ proofMode: "local" })),
      }),
    /Expected values to be strictly equal/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv(),
        fetcher: jsonFetcher(
          fixtureStatus({
            actions: CONTRACT_ACTIONS.map((action) => ({
              action,
              executionMode: action === "checkout_pass" ? "local_proof" : "live_required",
              proofMode: action === "checkout_pass" ? "local" : "live",
            })),
          }),
        ),
      }),
    /Expected values to be strictly equal/,
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "smoke",
        checks: [
          ...pass.checks,
          "reject-localhost-hosted-url",
          "reject-contract-id-mismatch",
          "reject-operator-signing-env",
          "reject-invalid-production-session-secret",
          "reject-local-contract-status",
          "reject-non-live-action-policy",
        ],
      },
      null,
      2,
    ),
  );
}

async function runCli() {
  const envFile = getArgValue("--env-file");
  const env = mergeEnv(
    process.env as EnvMap,
    envFile ? parseEnvFile(envFile) : {},
  );
  const hostedUrlOverride = getArgValue("--url");
  const result = await runHostedDeploymentPreflight({
    env,
    hostedUrlOverride,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "hosted",
        ...result,
      },
      null,
      2,
    ),
  );
}

async function main() {
  if (process.argv.includes("--smoke")) {
    await runSmoke();
  } else {
    await runCli();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
