import assert from "node:assert/strict";
import {
  DEFAULT_MONEYGRAM_HOME_DOMAIN,
  MONEYGRAM_TESTNET_USDC_ISSUER,
  resolveMoneyGramAnchorConfig,
} from "../src/lib/anchor/config";
import {
  fetchMoneyGramSep1Info,
  moneyGramTomlUrl,
  parseMoneyGramSep1Toml,
} from "../src/lib/anchor/moneygram/sep1";

async function main() {
  const fixtureToml = `
ACCOUNTS = []
VERSION = "0.1.0"
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
desc = "A test USDC issued by Circle."
`;

  const fixture = parseMoneyGramSep1Toml({
    homeDomain: DEFAULT_MONEYGRAM_HOME_DOMAIN,
    toml: fixtureToml,
  });

  assert.equal(fixture.homeDomain, DEFAULT_MONEYGRAM_HOME_DOMAIN);
  assert.equal(fixture.webAuthEndpoint.endsWith("/auth"), true);
  assert.equal(fixture.transferServerSep24.endsWith("/sep24"), true);
  assert.equal(fixture.usdc.code, "USDC");
  assert.equal(fixture.usdc.issuer, MONEYGRAM_TESTNET_USDC_ISSUER);

  const config = resolveMoneyGramAnchorConfig({
    MONEYGRAM_HOME_DOMAIN: DEFAULT_MONEYGRAM_HOME_DOMAIN,
    MONEYGRAM_TIMEOUT_MS: "30000",
  });
  const live = await fetchMoneyGramSep1Info({ config });

  assert.equal(live.homeDomain, DEFAULT_MONEYGRAM_HOME_DOMAIN);
  assert.equal(live.webAuthEndpoint.startsWith("https://"), true);
  assert.equal(live.transferServerSep24.startsWith("https://"), true);
  assert.equal(live.usdc.code, "USDC");
  assert.equal(live.usdc.issuer, MONEYGRAM_TESTNET_USDC_ISSUER);

  console.log(
    JSON.stringify(
      {
        checks: [
          "parse-moneygram-sep1-fixture",
          "live-moneygram-sep1-fetch",
          "moneygram-web-auth-endpoint",
          "moneygram-sep24-transfer-server",
          "moneygram-testnet-usdc-currency",
        ],
        ok: true,
        tomlUrl: moneyGramTomlUrl(config.homeDomain),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
