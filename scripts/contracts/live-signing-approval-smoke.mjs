import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import { StrKey } from "@stellar/stellar-sdk";
import {
  hasLiveSigningApproval,
  liveSigningApprovalEnv,
  liveSigningApprovalMessage,
  liveSigningApprovalValue,
} from "./live-signing-approval.mjs";

const fakeAdminAddress = "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF";
const fakeCoreContractId = StrKey.encodeContract(Buffer.alloc(32, 7));
const fakePassContractId = StrKey.encodeContract(Buffer.alloc(32, 8));

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

assert.equal(hasLiveSigningApproval({}), false);
assert.equal(
  hasLiveSigningApproval({
    [liveSigningApprovalEnv]: liveSigningApprovalValue,
  }),
  true,
);
assert.match(liveSigningApprovalMessage(), /explicit approval/);

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

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "approval-helper-default-deny",
        "approval-helper-exact-phrase",
        "deploy-script-denies-without-live-approval",
        "init-script-denies-without-live-approval",
      ],
      approvalEnv: liveSigningApprovalEnv,
      approvalValue: liveSigningApprovalValue,
    },
    null,
    2,
  ),
);
