import assert from "node:assert/strict";
import { Keypair, Transaction, TransactionBuilder } from "@stellar/stellar-sdk";
import {
  assertMoneyGramSigningSecret,
  resolveMoneyGramAnchorConfig,
} from "../src/lib/anchor/config";
import { fetchMoneyGramSep1Info } from "../src/lib/anchor/moneygram/sep1";
import {
  authenticateMoneyGramSep10,
  requestMoneyGramSep10Challenge,
  signMoneyGramClientDomainChallenge,
} from "../src/lib/anchor/moneygram/sep10";
import {
  fetchMoneyGramSep24Info,
  initiateMoneyGramSep24Withdrawal,
} from "../src/lib/anchor/moneygram/sep24";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function main() {
  const config = resolveMoneyGramAnchorConfig(process.env);
  const discovery = await fetchMoneyGramSep1Info({ config });
  const info = await fetchMoneyGramSep24Info({ config, discovery });
  const usdcWithdraw = asRecord(info.withdraw.USDC);

  assert.equal(usdcWithdraw.enabled, true);

  const requests: Array<{
    body: Record<string, unknown>;
    headers: Headers;
    url: string;
  }> = [];
  const mockWithdrawal = await initiateMoneyGramSep24Withdrawal({
    account: config.clientSigningPublicKey,
    amountUsdc: "1",
    authToken: "test-token",
    config,
    discovery,
    fetcher: async (url, init) => {
      requests.push({
        body: JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>,
        headers: new Headers(init?.headers),
        url: String(url),
      });

      return new Response(
        JSON.stringify({
          id: "mock-moneygram-withdrawal-id",
          type: "interactive_customer_info_needed",
          url: "https://extstellar.moneygram.com/mock-interactive",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    },
  });

  assert.equal(mockWithdrawal.id, "mock-moneygram-withdrawal-id");
  assert.equal(mockWithdrawal.type, "interactive_customer_info_needed");
  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].url,
    `${discovery.transferServerSep24}/transactions/withdraw/interactive`,
  );
  assert.equal(requests[0].headers.get("Authorization"), "Bearer test-token");
  assert.equal(
    requests[0].headers.get("Content-Type"),
    "application/json",
  );
  assert.equal(requests[0].body.asset_code, "USDC");
  assert.equal(requests[0].body.asset_issuer, config.usdcIssuer);
  assert.equal(requests[0].body.account, config.clientSigningPublicKey);
  assert.equal(requests[0].body.amount, "1");

  let liveWithdrawal: { id: string | null; type: string; urlHost: string | null } | null =
    null;

  if (process.env.MONEYGRAM_SEP24_LIVE === "1") {
    assertMoneyGramSigningSecret(config);

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
    const parsed = TransactionBuilder.fromXDR(
      clientDomainSignedXdr,
      challenge.networkPassphrase,
    );

    assert.ok(parsed instanceof Transaction);
    parsed.sign(wallet);

    const token = await authenticateMoneyGramSep10({
      config,
      discovery,
      signedTransactionXdr: parsed.toXDR(),
    });
    const withdrawal = await initiateMoneyGramSep24Withdrawal({
      account: wallet.publicKey(),
      amountUsdc: "1",
      authToken: token.token,
      config,
      discovery,
    });

    liveWithdrawal = {
      id: withdrawal.id,
      type: withdrawal.type,
      urlHost: withdrawal.url ? new URL(withdrawal.url).host : null,
    };
  }

  console.log(
    JSON.stringify(
      {
        checks: [
          "live-moneygram-sep24-info",
          "moneygram-usdc-withdraw-enabled",
          "sep24-withdrawal-request-shape",
          "sep24-withdrawal-response-parse",
        ],
        liveWithdrawal,
        ok: true,
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
