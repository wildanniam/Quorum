import assert from "node:assert/strict";
import { resolveMoneyGramAnchorConfig } from "../src/lib/anchor/config";
import { fetchMoneyGramSep1Info } from "../src/lib/anchor/moneygram/sep1";
import { fetchMoneyGramSep24Transaction } from "../src/lib/anchor/moneygram/sep24";
import { mapMoneyGramSep24Status } from "../src/lib/anchor/payouts";

async function main() {
  const config = resolveMoneyGramAnchorConfig(process.env);
  const discovery = await fetchMoneyGramSep1Info({ config });
  const requests: Array<{ headers: Headers; url: string }> = [];
  const transaction = await fetchMoneyGramSep24Transaction({
    authToken: "test-token",
    config,
    discovery,
    fetcher: async (url, init) => {
      requests.push({
        headers: new Headers(init?.headers),
        url: String(url),
      });

      return new Response(
        JSON.stringify({
          transaction: {
            amount_in: "1",
            external_transaction_id: "ext-123",
            id: "mg-123",
            kind: "withdrawal",
            more_info_url: "https://extstellar.moneygram.com/status/mg-123",
            status: "pending_user_transfer_complete",
            stellar_transaction_id:
              "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
            withdraw_anchor_account:
              "GCVU24AUYIXAJNIRWCAXX5OKF6AZY23R6IYGPMRGFN5XDDFMW6I7XKUW",
            withdraw_memo: "memo-123",
            withdraw_memo_type: "text",
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    },
    id: "mg-123",
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].headers.get("Authorization"), "Bearer test-token");
  assert.equal(
    requests[0].url,
    `${discovery.transferServerSep24}/transaction?id=mg-123`,
  );
  assert.equal(transaction.id, "mg-123");
  assert.equal(transaction.status, "pending_user_transfer_complete");
  assert.equal(
    mapMoneyGramSep24Status(transaction.status),
    "ready_for_pickup",
  );
  assert.equal(mapMoneyGramSep24Status("completed"), "completed");
  assert.equal(mapMoneyGramSep24Status("refunded"), "cancelled");
  assert.equal(mapMoneyGramSep24Status("expired"), "failed");
  assert.equal(mapMoneyGramSep24Status("pending_user_transfer_start"), "pending_anchor");

  console.log(
    JSON.stringify(
      {
        checks: [
          "sep24-transaction-request-shape",
          "sep24-transaction-response-parse",
          "moneygram-status-map-ready-for-pickup",
          "moneygram-status-map-terminal-states",
        ],
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
