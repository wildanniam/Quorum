import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isIP } from "node:net";
import { Keypair, Networks, StrKey } from "@stellar/stellar-sdk";
import { parse as parseToml } from "smol-toml";
import { CONTRACT_ACTIONS } from "../src/lib/stellar/action-policy";
import { resolveSessionSecret } from "../src/lib/auth/session";
import {
  DEFAULT_MONEYGRAM_HOME_DOMAIN,
  DEFAULT_QUORUM_ANCHOR_SIGNING_KEY,
  MONEYGRAM_TESTNET_USDC_ISSUER,
  assertMoneyGramSigningSecret,
  getAnchorProviderName,
  resolveMoneyGramAnchorConfig,
} from "../src/lib/anchor/config";
import { fetchMoneyGramSep1Info } from "../src/lib/anchor/moneygram/sep1";
import { fetchMoneyGramSep24Info } from "../src/lib/anchor/moneygram/sep24";

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

type FetchLike = Pick<typeof globalThis, "fetch">["fetch"];

const evidencePath = "docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json";
const productionSecret = "hosted-production-session-secret-32-chars-minimum";
const operatorOnlyEnvKeys = [
  "STELLAR_ACCOUNT",
  "QUORUM_LIVE_SIGNING_APPROVED",
  "ADMIN_ADDRESS",
  "QUORUM_PLATFORM_FEE_BPS",
  "QUORUM_NONZERO_PLATFORM_FEE_APPROVED",
] as const;
const forbiddenHostedEnvKeys = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
] as const;
const fixtureAnchorKey = Keypair.random();

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

function assertNoBrowserSupabaseEnv(env: EnvMap) {
  for (const key of Object.keys(env)) {
    assert(
      !key.startsWith("NEXT_PUBLIC_SUPABASE_"),
      `${key} must not be present; Quorum uses Supabase only as server-side Postgres.`,
    );
  }

  for (const key of forbiddenHostedEnvKeys) {
    assert(
      !env[key] || env[key]?.trim() === "",
      `${key} must not be present in the hosted runtime preflight env.`,
    );
  }
}

function assertPostgresUrl(value: string | undefined, label: string, options = { requireSsl: true }) {
  assert(value && value.trim(), `${label} must be set.`);

  const url = new URL(value);
  assert(
    url.protocol === "postgres:" || url.protocol === "postgresql:",
    `${label} must be a Postgres URL.`,
  );
  assert.notEqual(url.username, "", `${label} must include a username.`);
  assert.notEqual(url.password, "", `${label} must include a password.`);
  assert.notEqual(url.hostname, "", `${label} must include a host.`);
  assert.notEqual(url.pathname, "/", `${label} must include a database name.`);

  if (options.requireSsl) {
    assert.equal(
      url.searchParams.get("sslmode"),
      "require",
      `${label} must include sslmode=require for hosted Supabase/Vercel usage.`,
    );
  }
}

function assertHostedDatabaseEnv(env: EnvMap) {
  assertPostgresUrl(env.DATABASE_URL, "DATABASE_URL");

  if (env.DIRECT_DATABASE_URL?.trim()) {
    assertPostgresUrl(env.DIRECT_DATABASE_URL, "DIRECT_DATABASE_URL");
  }

  if (env.QUORUM_DB_SCHEMA?.trim()) {
    assert(
      /^[A-Za-z_][A-Za-z0-9_]*$/.test(env.QUORUM_DB_SCHEMA),
      "QUORUM_DB_SCHEMA must contain only letters, numbers, and underscores, and cannot start with a number.",
    );
  }
}

function assertHostedSessionSecret(env: EnvMap) {
  resolveSessionSecret({
    NODE_ENV: "production",
    QUORUM_SESSION_SECRET: env.QUORUM_SESSION_SECRET,
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseHostedStellarToml(toml: string) {
  return asRecord(parseToml(toml));
}

async function assertHostedAnchorRuntime({
  env,
  fetcher,
  hostedUrl,
}: {
  env: EnvMap;
  fetcher: FetchLike;
  hostedUrl: URL;
}) {
  const provider = getAnchorProviderName(env.ANCHOR_PROVIDER);
  const moneygramConfig = resolveMoneyGramAnchorConfig(env);

  assert.equal(
    moneygramConfig.clientDomain,
    hostedUrl.host,
    "ANCHOR_CLIENT_DOMAIN must match the hosted app domain.",
  );

  const stellarTomlUrl = new URL("/.well-known/stellar.toml", hostedUrl).toString();
  const stellarTomlResponse = await fetcher(stellarTomlUrl, {
    headers: { accept: "text/plain" },
  });

  assert.equal(
    stellarTomlResponse.ok,
    true,
    `${stellarTomlUrl} returned HTTP ${stellarTomlResponse.status}.`,
  );

  const hostedToml = parseHostedStellarToml(await stellarTomlResponse.text());

  assert.equal(
    hostedToml.SIGNING_KEY,
    moneygramConfig.clientSigningPublicKey,
    "Hosted stellar.toml SIGNING_KEY must match ANCHOR_CLIENT_SIGNING_PUBLIC_KEY.",
  );
  assert(
    Array.isArray(hostedToml.ACCOUNTS) &&
      hostedToml.ACCOUNTS.includes(moneygramConfig.clientSigningPublicKey),
    "Hosted stellar.toml ACCOUNTS must include ANCHOR_CLIENT_SIGNING_PUBLIC_KEY.",
  );

  if (provider === "moneygram") {
    assertMoneyGramSigningSecret(moneygramConfig);

    const sep1 = await fetchMoneyGramSep1Info({
      config: moneygramConfig,
      fetcher,
    });
    const sep24 = await fetchMoneyGramSep24Info({
      config: moneygramConfig,
      discovery: sep1,
      fetcher,
    });
    const usdcWithdraw = asRecord(sep24.withdraw.USDC);

    assert.equal(sep1.homeDomain, moneygramConfig.homeDomain);
    assert.equal(sep1.usdc.issuer, moneygramConfig.usdcIssuer);
    assert.equal(
      usdcWithdraw.enabled,
      true,
      "MoneyGram SEP-24 must enable USDC withdrawals.",
    );
  }

  return provider;
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
  assertHostedDatabaseEnv(options.env);
  assertHostedEnvMatchesEvidence(options.env, expected);
  assertOperatorOnlyEnvAbsent(options.env);
  assertNoBrowserSupabaseEnv(options.env);

  const fetcher = options.fetcher ?? fetch;
  const anchorProvider = await assertHostedAnchorRuntime({
    env: options.env,
    fetcher,
    hostedUrl,
  });
  const response = await fetcher(statusUrl, {
    headers: { accept: "application/json" },
  });

  assert.equal(response.ok, true, `${statusUrl} returned HTTP ${response.status}.`);

  const statusPayload = await response.json();
  assertContractStatusPayload(statusPayload, expected);

  return {
    hostedAppUrl: expected.hostedAppUrl,
    anchorProvider,
    contractStatusUrl: statusUrl,
    checks: [
      "hosted-url-public-https",
      "production-session-secret-present",
      "server-postgres-database-url-present",
      "hosted-anchor-client-domain-matches-url",
      "hosted-stellar-toml-signing-key-matches-anchor-env",
      "moneygram-sep1-discovery-ready",
      "moneygram-sep24-usdc-withdraw-ready",
      "runtime-env-matches-deployment-evidence",
      "operator-signing-env-absent",
      "browser-supabase-env-absent",
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
    ANCHOR_PROVIDER: "moneygram",
    ANCHOR_CLIENT_DOMAIN: "quorum.example.com",
    ANCHOR_CLIENT_SIGNING_PUBLIC_KEY: fixtureAnchorKey.publicKey(),
    ANCHOR_CLIENT_SIGNING_SECRET: fixtureAnchorKey.secret(),
    MONEYGRAM_HOME_DOMAIN: DEFAULT_MONEYGRAM_HOME_DOMAIN,
    MONEYGRAM_USDC_ISSUER: MONEYGRAM_TESTNET_USDC_ISSUER,
    DATABASE_URL:
      "postgresql://postgres:postgres@db.quorum.example.com:6543/postgres?sslmode=require",
    DIRECT_DATABASE_URL:
      "postgresql://postgres:postgres@db.quorum.example.com:5432/postgres?sslmode=require",
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

function moneyGramFixtureToml() {
  return `
VERSION = "2.0.0"
NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
SIGNING_KEY = "GCSESAP5ILVM6CWIEGK2SDOCQU7PHVFYYT7JNKRDAQNVQWKD5YEE5ZJ4"
WEB_AUTH_ENDPOINT = "https://extstellar.moneygram.com/stellaradapterservice/auth"
TRANSFER_SERVER_SEP0024 = "https://extstellar.moneygram.com/stellaradapterservice/sep24"

[[CURRENCIES]]
code = "USDC"
issuer = "${MONEYGRAM_TESTNET_USDC_ISSUER}"
status = "test"
is_asset_anchored = true
anchor_asset_type = "fiat"
`;
}

function hostedStellarToml(signingKey = fixtureAnchorKey.publicKey()) {
  return `
VERSION="2.0.0"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
SIGNING_KEY="${signingKey}"
ACCOUNTS=["${signingKey}"]

[DOCUMENTATION]
ORG_NAME="Quorum"
ORG_URL="https://quorum.example.com"
`;
}

function preflightFetcher({
  anchorSigningKey = fixtureAnchorKey.publicKey(),
  statusPayload = fixtureStatus(),
}: {
  anchorSigningKey?: string;
  statusPayload?: unknown;
} = {}): FetchLike {
  return async (input) => {
    const url = String(input);

    if (url === "https://quorum.example.com/api/contracts/status") {
      return Response.json(statusPayload);
    }

    if (url === "https://quorum.example.com/.well-known/stellar.toml") {
      return new Response(hostedStellarToml(anchorSigningKey), {
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (url === "https://extstellar.moneygram.com/.well-known/stellar.toml") {
      return new Response(moneyGramFixtureToml(), {
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (url === "https://extstellar.moneygram.com/stellaradapterservice/sep24/info") {
      return Response.json({
        deposit: {},
        fee: { enabled: false },
        features: {},
        withdraw: {
          USDC: {
            enabled: true,
            fee_fixed: 0,
            max_amount: 2500,
            min_amount: 1,
          },
        },
      });
    }

    return Response.json({ error: `Unexpected preflight URL: ${url}` }, { status: 404 });
  };
}

async function runSmoke() {
  const pass = await runHostedDeploymentPreflight({
    env: fixtureEnv(),
    fetcher: preflightFetcher(),
  });

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({ QUORUM_HOSTED_APP_URL: "http://localhost:3000" }),
        fetcher: preflightFetcher(),
      }),
    /HTTPS/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({ NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: StrKey.encodeContract(Buffer.alloc(32, 5)) }),
        fetcher: preflightFetcher(),
      }),
    /NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({ STELLAR_ACCOUNT: "quorum-admin-testnet" }),
        fetcher: preflightFetcher(),
      }),
    /STELLAR_ACCOUNT/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({ QUORUM_SESSION_SECRET: "short" }),
        fetcher: preflightFetcher(),
      }),
    /QUORUM_SESSION_SECRET/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({ DATABASE_URL: "file:./data/quorum.db" }),
        fetcher: preflightFetcher(),
      }),
    /DATABASE_URL must be a Postgres URL/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({
          DATABASE_URL:
            "postgresql://postgres:postgres@db.quorum.example.com:6543/postgres",
        }),
        fetcher: preflightFetcher(),
      }),
    /sslmode=require/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({
          NEXT_PUBLIC_SUPABASE_URL: "https://quorum.supabase.co",
        }),
        fetcher: preflightFetcher(),
      }),
    /NEXT_PUBLIC_SUPABASE_URL/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({
          SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
        }),
        fetcher: preflightFetcher(),
      }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv(),
        fetcher: preflightFetcher({
          statusPayload: fixtureStatus({ proofMode: "local" }),
        }),
      }),
    /Expected values to be strictly equal/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv(),
        fetcher: preflightFetcher({
          statusPayload: fixtureStatus({
            actions: CONTRACT_ACTIONS.map((action) => ({
              action,
              executionMode: action === "checkout_pass" ? "local_proof" : "live_required",
              proofMode: action === "checkout_pass" ? "local" : "live",
            })),
          }),
        }),
      }),
    /Expected values to be strictly equal/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({
          ANCHOR_CLIENT_DOMAIN: "wrong.example.com",
        }),
        fetcher: preflightFetcher(),
      }),
    /ANCHOR_CLIENT_DOMAIN/,
  );

  await assert.rejects(
    () =>
      runHostedDeploymentPreflight({
        env: fixtureEnv({
          ANCHOR_CLIENT_SIGNING_PUBLIC_KEY: DEFAULT_QUORUM_ANCHOR_SIGNING_KEY,
        }),
        fetcher: preflightFetcher(),
      }),
    /SIGNING_KEY/,
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
          "reject-non-postgres-database-url",
          "reject-hosted-postgres-url-without-sslmode",
          "reject-browser-supabase-env",
          "reject-supabase-service-role-env",
          "reject-local-contract-status",
          "reject-non-live-action-policy",
          "reject-anchor-client-domain-mismatch",
          "reject-hosted-stellar-toml-signing-key-mismatch",
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
