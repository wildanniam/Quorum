import assert from "node:assert/strict";
import { Keypair } from "@stellar/stellar-sdk";
import {
  DEFAULT_MONEYGRAM_HOME_DOMAIN,
  DEFAULT_QUORUM_ANCHOR_CLIENT_DOMAIN,
  DEFAULT_QUORUM_ANCHOR_SIGNING_KEY,
  MONEYGRAM_TESTNET_USDC_ISSUER,
  assertMoneyGramSigningSecret,
  getAnchorProviderName,
  resolveAnchorRuntimeConfig,
  resolveMoneyGramAnchorConfig,
} from "../src/lib/anchor/config";

function expectReject(fn: () => unknown, message: RegExp) {
  assert.throws(fn, message);
}

const signingKey = Keypair.random();

const defaultConfig = resolveAnchorRuntimeConfig({});
assert.equal(defaultConfig.provider, "mock");
assert.equal(defaultConfig.moneygram.clientDomain, DEFAULT_QUORUM_ANCHOR_CLIENT_DOMAIN);
assert.equal(defaultConfig.moneygram.homeDomain, DEFAULT_MONEYGRAM_HOME_DOMAIN);
assert.equal(
  defaultConfig.moneygram.clientSigningPublicKey,
  DEFAULT_QUORUM_ANCHOR_SIGNING_KEY,
);
assert.equal(defaultConfig.moneygram.usdcIssuer, MONEYGRAM_TESTNET_USDC_ISSUER);
assert.equal(defaultConfig.moneygram.clientSigningSecret, null);

const moneygramConfig = resolveAnchorRuntimeConfig({
  ANCHOR_CLIENT_DOMAIN: "https://quorum-sandy-eight.vercel.app/",
  ANCHOR_CLIENT_SIGNING_PUBLIC_KEY: signingKey.publicKey(),
  ANCHOR_CLIENT_SIGNING_SECRET: signingKey.secret(),
  ANCHOR_PROVIDER: "moneygram",
  MONEYGRAM_HOME_DOMAIN: "https://extstellar.moneygram.com/",
  MONEYGRAM_TIMEOUT_MS: "4500",
  MONEYGRAM_USDC_ISSUER: MONEYGRAM_TESTNET_USDC_ISSUER,
});

assert.equal(moneygramConfig.provider, "moneygram");
assert.equal(moneygramConfig.moneygram.clientDomain, "quorum-sandy-eight.vercel.app");
assert.equal(moneygramConfig.moneygram.homeDomain, DEFAULT_MONEYGRAM_HOME_DOMAIN);
assert.equal(moneygramConfig.moneygram.clientSigningPublicKey, signingKey.publicKey());
assert.equal(moneygramConfig.moneygram.clientSigningSecret, signingKey.secret());
assert.equal(moneygramConfig.moneygram.timeoutMs, 4500);
assert.doesNotThrow(() => assertMoneyGramSigningSecret(moneygramConfig.moneygram));

expectReject(() => getAnchorProviderName("bogus"), /ANCHOR_PROVIDER/);
expectReject(
  () =>
    resolveMoneyGramAnchorConfig({
      ANCHOR_CLIENT_DOMAIN: "quorum-sandy-eight.vercel.app/path",
    }),
  /domain without a path/,
);
expectReject(
  () =>
    resolveMoneyGramAnchorConfig({
      ANCHOR_CLIENT_SIGNING_PUBLIC_KEY: "not-a-public-key",
    }),
  /valid Stellar public key/,
);
expectReject(
  () =>
    resolveMoneyGramAnchorConfig({
      ANCHOR_CLIENT_SIGNING_SECRET: "not-a-secret",
    }),
  /valid Stellar secret seed/,
);
expectReject(
  () =>
    resolveMoneyGramAnchorConfig({
      MONEYGRAM_TIMEOUT_MS: "0",
    }),
  /positive integer/,
);
expectReject(
  () =>
    assertMoneyGramSigningSecret(
      resolveMoneyGramAnchorConfig({
        ANCHOR_CLIENT_SIGNING_PUBLIC_KEY: signingKey.publicKey(),
      }),
    ),
  /ANCHOR_CLIENT_SIGNING_SECRET/,
);

console.log(
  JSON.stringify(
    {
      checks: [
        "default-mock-provider",
        "moneygram-env-normalization",
        "moneygram-signing-secret-required",
        "reject-invalid-provider",
        "reject-domain-paths",
        "reject-invalid-signing-public-key",
        "reject-invalid-signing-secret",
        "reject-invalid-timeout",
      ],
      ok: true,
    },
    null,
    2,
  ),
);
