import assert from "node:assert/strict";
import { Networks, StrKey } from "@stellar/stellar-sdk";
import { getContractActionPolicy } from "../src/lib/stellar/action-policy";
import { getContractReadiness } from "../src/lib/stellar/contracts";

const envKeys = [
  "NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID",
  "NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID",
  "NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID",
  "NEXT_PUBLIC_STELLAR_NETWORK",
  "NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE",
] as const;

const fakeCoreContractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const fakePassContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
const fakeUsdcContractId = StrKey.encodeContract(Buffer.alloc(32, 9));

type EnvOverrides = Partial<Record<(typeof envKeys)[number], string>>;

function withEnv<T>(overrides: EnvOverrides, callback: () => T) {
  const previous = Object.fromEntries(
    envKeys.map((key) => [key, process.env[key]]),
  ) as Partial<Record<(typeof envKeys)[number], string>>;

  try {
    for (const key of envKeys) {
      delete process.env[key];
    }

    for (const [key, value] of Object.entries(overrides)) {
      process.env[key] = value;
    }

    return callback();
  } finally {
    for (const key of envKeys) {
      const value = previous[key];

      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

const validTestnetLiveEnv = {
  NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: fakeCoreContractId,
  NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID: fakePassContractId,
  NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID: fakeUsdcContractId,
  NEXT_PUBLIC_STELLAR_NETWORK: "TESTNET",
  NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: Networks.TESTNET,
} satisfies EnvOverrides;

withEnv(validTestnetLiveEnv, () => {
  const readiness = getContractReadiness();

  assert.equal(readiness.networkConfigured, true);
  assert.equal(readiness.contractsConfigured, true);
  assert.equal(readiness.paymentAssetConfigured, true);
  assert.equal(readiness.configured, true);
  assert.equal(readiness.proofMode, "live");
  assert.equal(
    getContractActionPolicy("checkout_pass").executionMode,
    "live_required",
  );
});

withEnv(
  {
    ...validTestnetLiveEnv,
    NEXT_PUBLIC_STELLAR_NETWORK: "PUBLIC",
    NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: Networks.PUBLIC,
  },
  () => {
    const readiness = getContractReadiness();

    assert.equal(readiness.networkConfigured, false);
    assert.equal(readiness.contractsConfigured, true);
    assert.equal(readiness.paymentAssetConfigured, true);
    assert.equal(readiness.configured, false);
    assert.equal(readiness.proofMode, "local");
    assert(readiness.invalid.includes("NEXT_PUBLIC_STELLAR_NETWORK"));
    assert(
      readiness.invalid.includes("NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE"),
    );
    assert.equal(
      getContractActionPolicy("checkout_pass").executionMode,
      "local_proof",
    );
  },
);

withEnv(
  {
    ...validTestnetLiveEnv,
    NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: Networks.PUBLIC,
  },
  () => {
    const readiness = getContractReadiness();

    assert.equal(readiness.networkConfigured, false);
    assert.equal(readiness.configured, false);
    assert(!readiness.invalid.includes("NEXT_PUBLIC_STELLAR_NETWORK"));
    assert(
      readiness.invalid.includes("NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE"),
    );
  },
);

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "accept-testnet-live-readiness",
        "reject-non-testnet-live-readiness",
        "reject-mismatched-testnet-passphrase",
      ],
    },
    null,
    2,
  ),
);
