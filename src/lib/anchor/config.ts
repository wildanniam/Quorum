import { StrKey } from "@stellar/stellar-sdk";
import type { AnchorPayoutProvider } from "@/lib/db/models";

export const DEFAULT_MONEYGRAM_HOME_DOMAIN = "extstellar.moneygram.com";
export const DEFAULT_QUORUM_ANCHOR_CLIENT_DOMAIN =
  "quorum-sandy-eight.vercel.app";
export const DEFAULT_QUORUM_ANCHOR_SIGNING_KEY =
  "GA3EWCMNMXYSRTMHHJNR5TXMISGTNUWAPFQWI7Z5R7HQJJHSTJ2YWV4W";
export const MONEYGRAM_TESTNET_USDC_ISSUER =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export type MoneyGramAnchorConfig = {
  clientDomain: string;
  clientSigningPublicKey: string;
  clientSigningSecret: string | null;
  homeDomain: string;
  timeoutMs: number;
  usdcAssetCode: "USDC";
  usdcIssuer: string;
};

export type AnchorRuntimeConfig = {
  moneygram: MoneyGramAnchorConfig;
  provider: AnchorPayoutProvider;
};

type AnchorEnv = Partial<Record<string, string | undefined>>;

function optionalEnv(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function normalizeDomain(value: string, label: string) {
  const trimmed = value.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");

  if (!/^[A-Za-z0-9.-]+(:\d+)?$/.test(trimmed)) {
    throw new Error(`${label} must be a domain without a path.`);
  }

  return trimmed.toLowerCase();
}

function positiveIntegerEnv(value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("MONEYGRAM_TIMEOUT_MS must be a positive integer.");
  }

  return parsed;
}

export function getAnchorProviderName(
  value = process.env.ANCHOR_PROVIDER,
): AnchorPayoutProvider {
  const configured = optionalEnv(value)?.toLowerCase();

  if (!configured || configured === "mock") return "mock";
  if (configured === "moneygram") return "moneygram";

  throw new Error("ANCHOR_PROVIDER must be either mock or moneygram.");
}

export function resolveMoneyGramAnchorConfig(
  env: AnchorEnv = process.env,
): MoneyGramAnchorConfig {
  const clientDomain = normalizeDomain(
    optionalEnv(env.ANCHOR_CLIENT_DOMAIN) ??
      DEFAULT_QUORUM_ANCHOR_CLIENT_DOMAIN,
    "ANCHOR_CLIENT_DOMAIN",
  );
  const homeDomain = normalizeDomain(
    optionalEnv(env.MONEYGRAM_HOME_DOMAIN) ?? DEFAULT_MONEYGRAM_HOME_DOMAIN,
    "MONEYGRAM_HOME_DOMAIN",
  );
  const clientSigningPublicKey =
    optionalEnv(env.ANCHOR_CLIENT_SIGNING_PUBLIC_KEY) ??
    DEFAULT_QUORUM_ANCHOR_SIGNING_KEY;
  const clientSigningSecret = optionalEnv(env.ANCHOR_CLIENT_SIGNING_SECRET);
  const usdcIssuer =
    optionalEnv(env.MONEYGRAM_USDC_ISSUER) ?? MONEYGRAM_TESTNET_USDC_ISSUER;

  if (!StrKey.isValidEd25519PublicKey(clientSigningPublicKey)) {
    throw new Error(
      "ANCHOR_CLIENT_SIGNING_PUBLIC_KEY must be a valid Stellar public key.",
    );
  }

  if (
    clientSigningSecret &&
    !StrKey.isValidEd25519SecretSeed(clientSigningSecret)
  ) {
    throw new Error(
      "ANCHOR_CLIENT_SIGNING_SECRET must be a valid Stellar secret seed.",
    );
  }

  if (!StrKey.isValidEd25519PublicKey(usdcIssuer)) {
    throw new Error("MONEYGRAM_USDC_ISSUER must be a valid Stellar public key.");
  }

  return {
    clientDomain,
    clientSigningPublicKey,
    clientSigningSecret,
    homeDomain,
    timeoutMs: positiveIntegerEnv(env.MONEYGRAM_TIMEOUT_MS, 15000),
    usdcAssetCode: "USDC",
    usdcIssuer,
  };
}

export function resolveAnchorRuntimeConfig(
  env: AnchorEnv = process.env,
): AnchorRuntimeConfig {
  return {
    moneygram: resolveMoneyGramAnchorConfig(env),
    provider: getAnchorProviderName(env.ANCHOR_PROVIDER),
  };
}

export function assertMoneyGramSigningSecret(config: MoneyGramAnchorConfig) {
  if (!config.clientSigningSecret) {
    throw new Error(
      "ANCHOR_CLIENT_SIGNING_SECRET is required when ANCHOR_PROVIDER=moneygram.",
    );
  }
}
