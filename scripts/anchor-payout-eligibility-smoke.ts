import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertAnchorPayoutSettlementEligibility,
  canStartAnchorPayout,
} from "../src/lib/anchor/payout-eligibility";

const liveHash = "b".repeat(64);

assert.equal(
  canStartAnchorPayout({ provider: "moneygram", settlementTxHash: liveHash }),
  true,
);
assert.equal(
  canStartAnchorPayout({
    provider: "moneygram",
    settlementTxHash: "local-withdrawal-reference",
  }),
  false,
);
assert.equal(
  canStartAnchorPayout({ provider: "moneygram", settlementTxHash: null }),
  false,
);
assert.equal(
  canStartAnchorPayout({
    provider: "mock",
    settlementTxHash: "local-withdrawal-reference",
  }),
  true,
);

assert.doesNotThrow(() =>
  assertAnchorPayoutSettlementEligibility({
    provider: "moneygram",
    settlementTxHash: liveHash,
  }),
);
assert.throws(
  () =>
    assertAnchorPayoutSettlementEligibility({
      provider: "moneygram",
      settlementTxHash: "local-withdrawal-reference",
    }),
  /explorer-verifiable Stellar settlement/i,
);

const payoutRepository = readFileSync("src/lib/anchor/payouts.ts", "utf8");
const createPayoutStart = payoutRepository.indexOf(
  "export async function createAnchorPayout",
);
const eligibilityCheck = payoutRepository.indexOf(
  "assertAnchorPayoutSettlementEligibility",
  createPayoutStart,
);
const providerInvocation = payoutRepository.indexOf(
  "const provider = getAnchorPayoutProvider()",
  createPayoutStart,
);

assert.ok(createPayoutStart >= 0, "createAnchorPayout must exist");
assert.ok(eligibilityCheck >= 0, "server eligibility check must be wired");
assert.ok(providerInvocation >= 0, "anchor provider invocation must exist");
assert.ok(
  eligibilityCheck < providerInvocation,
  "eligibility must be checked before the provider is invoked",
);
assert.match(payoutRepository, /w\.tx_hash/);

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "allow-live-settlement-for-moneygram",
        "reject-local-settlement-for-moneygram",
        "reject-missing-settlement-for-moneygram",
        "preserve-local-proof-for-mock-provider",
        "enforce-eligibility-before-provider-invocation",
      ],
    },
    null,
    2,
  ),
);
