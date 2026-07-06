import { StrKey } from "@stellar/stellar-sdk";
import { parse as parseToml } from "smol-toml";
import {
  MONEYGRAM_TESTNET_USDC_ISSUER,
  resolveMoneyGramAnchorConfig,
  type MoneyGramAnchorConfig,
} from "@/lib/anchor/config";

type TomlRecord = Record<string, unknown>;

export type MoneyGramCurrency = {
  anchorAssetType: string | null;
  code: string;
  description: string | null;
  isAssetAnchored: boolean | null;
  issuer: string | null;
  status: string | null;
};

export type MoneyGramSep1Info = {
  currencies: MoneyGramCurrency[];
  homeDomain: string;
  signingKey: string;
  transferServerSep24: string;
  usdc: MoneyGramCurrency;
  webAuthEndpoint: string;
};

type DiscoveryFetcher = Pick<typeof globalThis, "fetch">["fetch"];

function asRecord(value: unknown): TomlRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as TomlRecord)
    : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function stringField(record: TomlRecord, key: string) {
  const value = asString(record[key]);

  if (!value) {
    throw new Error(`MoneyGram stellar.toml is missing ${key}.`);
  }

  return value;
}

function endpointField(record: TomlRecord, key: string) {
  const value = stringField(record, key);

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "https:") {
      throw new Error();
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`MoneyGram stellar.toml ${key} must be an HTTPS URL.`);
  }
}

function parseCurrency(value: unknown): MoneyGramCurrency | null {
  const record = asRecord(value);
  const code = asString(record.code);

  if (!code) return null;

  return {
    anchorAssetType: asString(record.anchor_asset_type),
    code,
    description: asString(record.desc),
    isAssetAnchored: asBoolean(record.is_asset_anchored),
    issuer: asString(record.issuer),
    status: asString(record.status),
  };
}

export function parseMoneyGramSep1Toml({
  homeDomain,
  expectedUsdcIssuer = MONEYGRAM_TESTNET_USDC_ISSUER,
  toml,
}: {
  expectedUsdcIssuer?: string;
  homeDomain: string;
  toml: string;
}): MoneyGramSep1Info {
  const parsed = asRecord(parseToml(toml));
  const signingKey = stringField(parsed, "SIGNING_KEY");

  if (!StrKey.isValidEd25519PublicKey(signingKey)) {
    throw new Error("MoneyGram stellar.toml SIGNING_KEY is not a valid Stellar key.");
  }

  const currencies = Array.isArray(parsed.CURRENCIES)
    ? parsed.CURRENCIES.map(parseCurrency).filter(
        (currency): currency is MoneyGramCurrency => Boolean(currency),
      )
    : [];
  const usdc = currencies.find(
    (currency) => currency.code === "USDC" && currency.issuer === expectedUsdcIssuer,
  );

  if (!usdc) {
    throw new Error(
      "MoneyGram stellar.toml does not advertise the expected testnet USDC asset.",
    );
  }

  return {
    currencies,
    homeDomain,
    signingKey,
    transferServerSep24: endpointField(parsed, "TRANSFER_SERVER_SEP0024"),
    usdc,
    webAuthEndpoint: endpointField(parsed, "WEB_AUTH_ENDPOINT"),
  };
}

export function moneyGramTomlUrl(homeDomain: string) {
  return `https://${homeDomain}/.well-known/stellar.toml`;
}

export async function fetchMoneyGramSep1Info({
  config = resolveMoneyGramAnchorConfig(),
  fetcher = fetch,
}: {
  config?: MoneyGramAnchorConfig;
  fetcher?: DiscoveryFetcher;
} = {}) {
  const response = await fetcher(moneyGramTomlUrl(config.homeDomain), {
    signal: AbortSignal.timeout(config.timeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      `MoneyGram SEP-1 discovery failed with HTTP ${response.status}.`,
    );
  }

  return parseMoneyGramSep1Toml({
    expectedUsdcIssuer: config.usdcIssuer,
    homeDomain: config.homeDomain,
    toml: await response.text(),
  });
}
