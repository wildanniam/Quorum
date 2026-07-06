import assert from "node:assert/strict";
import { Keypair, Transaction, TransactionBuilder } from "@stellar/stellar-sdk";
import {
  assertMoneyGramSigningSecret,
  resolveMoneyGramAnchorConfig,
} from "../src/lib/anchor/config";
import { fetchMoneyGramSep1Info } from "../src/lib/anchor/moneygram/sep1";
import {
  assertMoneyGramSep10SignedChallenge,
  authenticateMoneyGramSep10,
  requestMoneyGramSep10Challenge,
  signMoneyGramClientDomainChallenge,
} from "../src/lib/anchor/moneygram/sep10";

async function main() {
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
        ok: true,
        tokenLength: token.token.length,
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
