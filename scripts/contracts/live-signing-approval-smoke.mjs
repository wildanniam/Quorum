import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { StrKey } from "@stellar/stellar-sdk";
import { extractContractIdFromOutput } from "./contract-cli-output.mjs";
import {
  hasLiveSigningApproval,
  liveSigningApprovalEnv,
  liveSigningApprovalMessage,
  liveSigningApprovalValue,
} from "./live-signing-approval.mjs";

const fakeAdminAddress = "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const fakeCoreContractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const fakePassContractId = StrKey.encodeContract(Buffer.alloc(32, 8));
const nonTestnetMessage = /locked to Stellar testnet/;

function runNode(script, env) {
  const childEnv = {
    ...process.env,
    STELLAR_ACCOUNT: fakeAdminAddress,
    ADMIN_ADDRESS: fakeAdminAddress,
    NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: fakeCoreContractId,
    NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID: fakePassContractId,
    ...env,
  };
  delete childEnv[liveSigningApprovalEnv];

  return spawnSync("node", [script], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: childEnv,
  });
}

function parseJsonOutput(result) {
  const output = `${result.stdout}${result.stderr}`;
  const first = output.indexOf("{");
  const last = output.lastIndexOf("}");

  assert.notEqual(first, -1, "Expected command to emit JSON.");
  assert.notEqual(last, -1, "Expected command to emit JSON.");

  return JSON.parse(output.slice(first, last + 1));
}

assert.equal(hasLiveSigningApproval({}), false);
assert.equal(
  hasLiveSigningApproval({
    [liveSigningApprovalEnv]: liveSigningApprovalValue,
  }),
  true,
);
assert.match(liveSigningApprovalMessage(), /explicit approval/);
assert.equal(
  extractContractIdFromOutput(
    `stellar output\nContract deployed: ${fakeCoreContractId}\n`,
    "fake deploy",
  ),
  fakeCoreContractId,
);
assert.throws(
  () => extractContractIdFromOutput("stellar output without a contract id", "fake deploy"),
  /valid Soroban contract ID/,
);

const deployWithoutApproval = runNode("scripts/contracts/deploy-testnet.mjs", {});
assert.equal(deployWithoutApproval.status, 1);
assert.match(
  `${deployWithoutApproval.stdout}${deployWithoutApproval.stderr}`,
  new RegExp(liveSigningApprovalEnv),
);

const initWithoutApproval = runNode("scripts/contracts/init-testnet.mjs", {});
assert.equal(initWithoutApproval.status, 1);
assert.match(
  `${initWithoutApproval.stdout}${initWithoutApproval.stderr}`,
  new RegExp(liveSigningApprovalEnv),
);

const deployWrongNetwork = runNode("scripts/contracts/deploy-testnet.mjs", {
  STELLAR_NETWORK: "pubnet",
});
assert.equal(deployWrongNetwork.status, 1);
assert.match(
  `${deployWrongNetwork.stdout}${deployWrongNetwork.stderr}`,
  nonTestnetMessage,
);

const initWrongNetwork = runNode("scripts/contracts/init-testnet.mjs", {
  STELLAR_NETWORK: "pubnet",
});
assert.equal(initWrongNetwork.status, 1);
assert.match(
  `${initWrongNetwork.stdout}${initWrongNetwork.stderr}`,
  nonTestnetMessage,
);

const doctorWrongNetwork = runNode("scripts/contracts/doctor.mjs", {
  STELLAR_NETWORK: "pubnet",
});
const doctorWrongNetworkJson = parseJsonOutput(doctorWrongNetwork);
assert.equal(doctorWrongNetworkJson.network.deployNetwork, "pubnet");
assert(
  doctorWrongNetworkJson.blockers.some((blocker) =>
    nonTestnetMessage.test(blocker),
  ),
  "contracts doctor should block non-testnet deployment networks",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "approval-helper-default-deny",
        "approval-helper-exact-phrase",
        "parse-contract-id-from-cli-output",
        "reject-invalid-contract-deploy-output",
        "deploy-script-denies-without-live-approval",
        "init-script-denies-without-live-approval",
        "deploy-script-denies-non-testnet-network",
        "init-script-denies-non-testnet-network",
        "doctor-blocks-non-testnet-network",
      ],
      approvalEnv: liveSigningApprovalEnv,
      approvalValue: liveSigningApprovalValue,
    },
    null,
    2,
  ),
);
