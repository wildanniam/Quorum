import { execFileSync } from "node:child_process";
import { StrKey } from "@stellar/stellar-sdk";

const account = process.env.STELLAR_ACCOUNT;
const network = process.env.STELLAR_NETWORK || "testnet";
const adminAddress = process.env.ADMIN_ADDRESS;
const passContractId = process.env.NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID;
const coreContractId = process.env.NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID;
const platformFeeBps = process.env.QUORUM_PLATFORM_FEE_BPS || "500";

const missing = [
  account ? null : "STELLAR_ACCOUNT",
  adminAddress ? null : "ADMIN_ADDRESS",
  passContractId ? null : "NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID",
  coreContractId ? null : "NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID",
].filter(Boolean);

if (missing.length > 0) {
  console.error(
    `Set ${missing.join(", ")} before initializing deployed contracts.`,
  );
  process.exit(1);
}

if (!StrKey.isValidEd25519PublicKey(adminAddress)) {
  console.error("ADMIN_ADDRESS must be a valid Stellar public key.");
  process.exit(1);
}

if (!StrKey.isValidContract(passContractId)) {
  console.error("NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID must be a valid contract ID.");
  process.exit(1);
}

if (!StrKey.isValidContract(coreContractId)) {
  console.error("NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID must be a valid contract ID.");
  process.exit(1);
}

if (!/^\d+$/.test(platformFeeBps) || Number(platformFeeBps) > 10_000) {
  console.error("QUORUM_PLATFORM_FEE_BPS must be an integer from 0 to 10000.");
  process.exit(1);
}

function run(label, args) {
  console.error(`\n${label}`);
  return execFileSync("stellar", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

const passInitOutput = run("Initializing QuorumPassNFT", [
  "contract",
  "invoke",
  "--id",
  passContractId,
  "--source-account",
  account,
  "--network",
  network,
  "--",
  "init",
  "--admin",
  adminAddress,
]);

const coreInitOutput = run("Initializing QuorumCore", [
  "contract",
  "invoke",
  "--id",
  coreContractId,
  "--source-account",
  account,
  "--network",
  network,
  "--",
  "init",
  "--admin",
  adminAddress,
  "--platform_fee_bps",
  platformFeeBps,
]);

const setCoreOutput = run("Linking QuorumPassNFT to QuorumCore", [
  "contract",
  "invoke",
  "--id",
  passContractId,
  "--source-account",
  account,
  "--network",
  network,
  "--",
  "set_core",
  "--caller",
  adminAddress,
  "--core",
  coreContractId,
]);

console.log(
  JSON.stringify(
    {
      network,
      adminAddress,
      platformFeeBps: Number(platformFeeBps),
      passContractId,
      coreContractId,
      outputs: {
        passInit: passInitOutput,
        coreInit: coreInitOutput,
        setCore: setCoreOutput,
      },
    },
    null,
    2,
  ),
);
