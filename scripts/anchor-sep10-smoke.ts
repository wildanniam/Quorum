import assert from "node:assert/strict";
import {
  Account,
  Keypair,
  Networks,
  Operation,
  Transaction,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import {
  assertMoneyGramSigningSecret,
  resolveMoneyGramAnchorConfig,
  type MoneyGramAnchorConfig,
} from "../src/lib/anchor/config";
import {
  fetchMoneyGramSep1Info,
  type MoneyGramSep1Info,
} from "../src/lib/anchor/moneygram/sep1";
import {
  assertMoneyGramSep10SignedChallenge,
  authenticateMoneyGramSep10,
  requestMoneyGramSep10Challenge,
  signMoneyGramClientDomainChallenge,
} from "../src/lib/anchor/moneygram/sep10";

function fixtureConfig(clientDomainKey: Keypair): MoneyGramAnchorConfig {
  return {
    clientDomain: "quorum.example",
    clientSigningPublicKey: clientDomainKey.publicKey(),
    clientSigningSecret: clientDomainKey.secret(),
    homeDomain: "anchor.example",
    timeoutMs: 5_000,
    usdcAssetCode: "USDC",
    usdcIssuer: Keypair.random().publicKey(),
  };
}

function fixtureDiscovery({
  config,
  serverKey,
}: {
  config: MoneyGramAnchorConfig;
  serverKey: Keypair;
}): MoneyGramSep1Info {
  const usdc = {
    anchorAssetType: "stellar",
    code: "USDC",
    description: "Fixture USDC",
    isAssetAnchored: true,
    issuer: config.usdcIssuer,
    status: "test",
  };

  return {
    currencies: [usdc],
    homeDomain: config.homeDomain,
    signingKey: serverKey.publicKey(),
    transferServerSep24: "https://anchor.example/sep24",
    usdc,
    webAuthEndpoint: "https://anchor.example/auth",
  };
}

function buildServerSignedChallenge({
  account,
  config,
  serverKey,
}: {
  account: string;
  config: MoneyGramAnchorConfig;
  serverKey: Keypair;
}) {
  const transaction = new TransactionBuilder(
    new Account(serverKey.publicKey(), "0"),
    {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    },
  )
    .addOperation(
      Operation.manageData({
        name: "web_auth_domain",
        source: account,
        value: config.homeDomain,
      }),
    )
    .addOperation(
      Operation.manageData({
        name: "client_domain",
        source: config.clientSigningPublicKey,
        value: config.clientDomain,
      }),
    )
    .setTimeout(300)
    .build();

  transaction.sign(serverKey);
  return transaction.toXDR();
}

async function runFixtureSmoke() {
  const wallet = Keypair.random();
  const clientDomainKey = Keypair.random();
  const serverKey = Keypair.random();
  const config = fixtureConfig(clientDomainKey);
  const discovery = fixtureDiscovery({ config, serverKey });
  const serverSignedXdr = buildServerSignedChallenge({
    account: wallet.publicKey(),
    config,
    serverKey,
  });
  let challengeRequestUrl = "";

  const challenge = await requestMoneyGramSep10Challenge({
    account: wallet.publicKey(),
    config,
    discovery,
    fetcher: async (input) => {
      challengeRequestUrl = input.toString();
      return new Response(
        JSON.stringify({
          network_passphrase: Networks.TESTNET,
          transaction: serverSignedXdr,
        }),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      );
    },
  });

  const challengeRequest = new URL(challengeRequestUrl);
  assert.equal(challengeRequest.searchParams.get("account"), wallet.publicKey());
  assert.equal(
    challengeRequest.searchParams.get("client_domain"),
    config.clientDomain,
  );

  assert.throws(
    () =>
      assertMoneyGramSep10SignedChallenge({
        account: wallet.publicKey(),
        config,
        networkPassphrase: challenge.networkPassphrase,
        serverSigningKey: discovery.signingKey,
        transactionXdr: challenge.transactionXdr,
      }),
    /not signed by Quorum client-domain key/,
  );

  const clientDomainSignedXdr = signMoneyGramClientDomainChallenge({
    challenge,
    config,
  });

  assertMoneyGramSep10SignedChallenge({
    account: wallet.publicKey(),
    config,
    networkPassphrase: challenge.networkPassphrase,
    requireWalletSignature: false,
    serverSigningKey: discovery.signingKey,
    transactionXdr: clientDomainSignedXdr,
  });

  const parsed = TransactionBuilder.fromXDR(
    clientDomainSignedXdr,
    challenge.networkPassphrase,
  );
  assert.ok(parsed instanceof Transaction);
  parsed.sign(wallet);
  const walletSignedXdr = parsed.toXDR();

  assertMoneyGramSep10SignedChallenge({
    account: wallet.publicKey(),
    config,
    networkPassphrase: challenge.networkPassphrase,
    serverSigningKey: discovery.signingKey,
    transactionXdr: walletSignedXdr,
  });

  let submittedTransaction: string | null = null;
  const token = await authenticateMoneyGramSep10({
    config,
    discovery,
    fetcher: async (_input, init) => {
      const payload = JSON.parse(String(init?.body)) as { transaction?: string };
      submittedTransaction = payload.transaction ?? null;
      return new Response(JSON.stringify({ token: "fixture-sep10-token" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    },
    signedTransactionXdr: walletSignedXdr,
  });

  assert.equal(submittedTransaction, walletSignedXdr);
  assert.equal(token.token, "fixture-sep10-token");

  console.log(
    JSON.stringify(
      {
        checks: [
          "fixture-sep10-challenge-request",
          "server-signature-verified",
          "missing-client-domain-signature-rejected",
          "client-domain-signature-verified",
          "wallet-signature-verified",
          "fixture-sep10-token-response",
        ],
        mode: "fixture",
        ok: true,
      },
      null,
      2,
    ),
  );
}

async function runLiveSmoke() {
  const config = resolveMoneyGramAnchorConfig(process.env);
  assertMoneyGramSigningSecret(config);

  const discovery = await fetchMoneyGramSep1Info({ config });
  const wallet = Keypair.random();
  const challenge = await requestMoneyGramSep10Challenge({
    account: wallet.publicKey(),
    config,
    discovery,
  });
  const clientDomainSignedXdr = signMoneyGramClientDomainChallenge({
    challenge,
    config,
  });

  assertMoneyGramSep10SignedChallenge({
    account: wallet.publicKey(),
    config,
    networkPassphrase: challenge.networkPassphrase,
    requireWalletSignature: false,
    serverSigningKey: discovery.signingKey,
    transactionXdr: clientDomainSignedXdr,
  });

  const parsed = TransactionBuilder.fromXDR(
    clientDomainSignedXdr,
    challenge.networkPassphrase,
  );
  assert.ok(parsed instanceof Transaction);
  parsed.sign(wallet);
  const walletSignedXdr = parsed.toXDR();

  assertMoneyGramSep10SignedChallenge({
    account: wallet.publicKey(),
    config,
    networkPassphrase: challenge.networkPassphrase,
    serverSigningKey: discovery.signingKey,
    transactionXdr: walletSignedXdr,
  });

  const token = await authenticateMoneyGramSep10({
    config,
    discovery,
    signedTransactionXdr: walletSignedXdr,
  });

  assert.ok(token.token.length > 10);

  console.log(
    JSON.stringify(
      {
        checks: [
          "live-moneygram-sep10-challenge",
          "moneygram-server-signature-verified",
          "quorum-client-domain-signature-verified",
          "wallet-signature-verified",
          "live-moneygram-sep10-token",
        ],
        clientDomain: config.clientDomain,
        homeDomain: config.homeDomain,
        mode: "live",
        ok: true,
        tokenLength: token.token.length,
      },
      null,
      2,
    ),
  );
}

const run = process.argv.includes("--live") ? runLiveSmoke : runFixtureSmoke;

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
