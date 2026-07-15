import assert from "node:assert/strict";
import {
  validateEvidenceAgainstHorizon,
} from "./live-evidence-network-validate.mjs";

const coreContractId =
  "CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV";
const passContractId =
  "CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH";
const usdcContractId =
  "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const wallet = "GDP5NPBC6QKUCFL6G7CRK2THY57Q3IYNAFX6225XNWXYRFJPMS4K4UMO";
const generatedAt = Date.now();
const paidEventId = Buffer.alloc(32, 1);
const freeEventId = Buffer.alloc(32, 2);

const hashes = {
  publishPaidEvent: "11".repeat(32),
  paidCheckout: "22".repeat(32),
  publishFreeEvent: "33".repeat(32),
  freeClaim: "44".repeat(32),
  checkIn: "55".repeat(32),
  collaboratorWithdraw: "66".repeat(32),
};

function buildEvidence() {
  return {
    generatedAt: new Date(generatedAt).toISOString(),
    network: "TESTNET",
    approval: {
      approvedAt: new Date(generatedAt - 60_000).toISOString(),
    },
    wallets: {
      organizer: wallet,
      paidAttendee: wallet,
      freeAttendee: wallet,
      collaborator: wallet,
    },
    contracts: { coreContractId, passContractId, usdcContractId },
    liveFlows: {
      publishPaidEvent: { txHash: hashes.publishPaidEvent },
      paidCheckout: { txHash: hashes.paidCheckout, tokenId: "2" },
      publishFreeEvent: { txHash: hashes.publishFreeEvent },
      freeClaim: { txHash: hashes.freeClaim, tokenId: "1" },
      checkIn: { txHash: hashes.checkIn, tokenId: "2" },
      collaboratorWithdraw: {
        txHash: hashes.collaboratorWithdraw,
        withdrawAmountUsdc: "1",
      },
    },
  };
}

function buildBundle(id) {
  const index = Object.keys(hashes).indexOf(id);
  const closedAt = new Date(generatedAt - (6 - index) * 1_000).toISOString();
  const common = {
    transaction: {
      hash: hashes[id],
      successful: true,
      operation_count: 1,
      source_account: wallet,
      ledger: 100 + index,
      created_at: closedAt,
    },
    effects: [],
  };
  const split = [{ percent_bps: 10_000, wallet }];
  let params;

  switch (id) {
    case "publishPaidEvent":
      params = [
        coreContractId,
        "create_event",
        wallet,
        paidEventId,
        10_000_000n,
        usdcContractId,
        10,
        false,
        split,
        Buffer.alloc(32, 3),
        passContractId,
      ];
      break;
    case "paidCheckout":
      params = [
        coreContractId,
        "purchase",
        wallet,
        paidEventId,
        10_000_000n,
        "quorum://paid",
        Buffer.alloc(32, 4),
      ];
      common.effects = [
        {
          type: "account_debited",
          asset_code: "USDC",
          amount: "1.0000000",
          account: wallet,
        },
        {
          type: "contract_credited",
          asset_code: "USDC",
          amount: "1.0000000",
          contract: coreContractId,
        },
      ];
      break;
    case "publishFreeEvent":
      params = [
        coreContractId,
        "create_event",
        wallet,
        freeEventId,
        0n,
        usdcContractId,
        10,
        true,
        split,
        Buffer.alloc(32, 5),
        passContractId,
      ];
      break;
    case "freeClaim":
      params = [
        coreContractId,
        "purchase",
        wallet,
        freeEventId,
        0n,
        "quorum://free",
        Buffer.alloc(32, 6),
      ];
      break;
    case "checkIn":
      params = [coreContractId, "check_in", wallet, paidEventId, 2n];
      break;
    case "collaboratorWithdraw":
      params = [coreContractId, "withdraw", wallet, paidEventId];
      common.effects = [
        {
          type: "contract_debited",
          asset_code: "USDC",
          amount: "1.0000000",
          contract: coreContractId,
        },
        {
          type: "account_credited",
          asset_code: "USDC",
          amount: "1.0000000",
          account: wallet,
        },
      ];
      break;
    default:
      throw new Error(`Unknown flow fixture: ${id}`);
  }

  common.operations = [
    {
      type: "invoke_host_function",
      function: "HostFunctionTypeHostFunctionTypeInvokeContract",
      transaction_successful: true,
      source_account: wallet,
      decodedParams: params,
    },
  ];

  return common;
}

function createFetch(bundles) {
  return async (url) => {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const txHash = parts[1];
    const id = Object.entries(hashes).find(([, hash]) => hash === txHash)?.[0];
    const bundle = id ? bundles.get(id) : null;

    if (!bundle) {
      return { ok: false, status: 404, json: async () => ({}) };
    }

    if (parts[2] === "operations") {
      return {
        ok: true,
        status: 200,
        json: async () => ({ _embedded: { records: bundle.operations } }),
      };
    }
    if (parts[2] === "effects") {
      return {
        ok: true,
        status: 200,
        json: async () => ({ _embedded: { records: bundle.effects } }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => bundle.transaction,
    };
  };
}

async function validate(evidence, bundles) {
  return validateEvidenceAgainstHorizon(evidence, {
    decodeParams: (operation) => operation.decodedParams,
    fetchImpl: createFetch(bundles),
    horizonUrl: "https://horizon.example.com",
  });
}

const buildBundles = () =>
  new Map(Object.keys(hashes).map((id) => [id, buildBundle(id)]));

const validBundles = buildBundles();
const validResult = await validate(buildEvidence(), validBundles);
assert.equal(validResult.ok, true, validResult.failures.join("\n"));

const wrongFunctionBundles = buildBundles();
wrongFunctionBundles.get("checkIn").operations[0].decodedParams[1] = "purchase";
const wrongFunctionResult = await validate(buildEvidence(), wrongFunctionBundles);
assert.equal(wrongFunctionResult.ok, false);
assert.match(wrongFunctionResult.failures.join("\n"), /checkIn must invoke check_in/);

const wrongAmountBundles = buildBundles();
wrongAmountBundles.get("paidCheckout").operations[0].decodedParams[4] = 50_000_000n;
const wrongAmountResult = await validate(buildEvidence(), wrongAmountBundles);
assert.equal(wrongAmountResult.ok, false);
assert.match(wrongAmountResult.failures.join("\n"), /exactly 1 USDC/);

const missingEffectsBundles = buildBundles();
missingEffectsBundles.get("collaboratorWithdraw").effects = [];
const missingEffectsResult = await validate(buildEvidence(), missingEffectsBundles);
assert.equal(missingEffectsResult.ok, false);
assert.match(missingEffectsResult.failures.join("\n"), /do not prove the recorded USDC payout/);

const wrongSignerBundles = buildBundles();
wrongSignerBundles.get("freeClaim").transaction.source_account =
  "GCVU24AUYIXAJNIRWCAXX5OKF6AZY23R6IYGPMRGFN5XDDFMW6I7XKUW";
const wrongSignerResult = await validate(buildEvidence(), wrongSignerBundles);
assert.equal(wrongSignerResult.ok, false);
assert.match(wrongSignerResult.failures.join("\n"), /freeClaim transaction source/);

const staleBundles = buildBundles();
staleBundles.get("publishPaidEvent").transaction.created_at = new Date(
  generatedAt - 8 * 24 * 60 * 60 * 1000,
).toISOString();
const staleResult = await validate(buildEvidence(), staleBundles);
assert.equal(staleResult.ok, false);
assert.match(staleResult.failures.join("\n"), /too old/);

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "accept-valid-horizon-final-flow",
        "reject-wrong-contract-function",
        "reject-wrong-paid-amount",
        "reject-missing-withdraw-effects",
        "reject-wrong-signer",
        "reject-stale-transaction",
      ],
    },
    null,
    2,
  ),
);
