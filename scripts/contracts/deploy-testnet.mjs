import { execFileSync } from "node:child_process";

const account = process.env.STELLAR_ACCOUNT;
const network = process.env.STELLAR_NETWORK || "testnet";

if (!account) {
  console.error(
    "Set STELLAR_ACCOUNT to a funded Stellar CLI identity, secret key, or seed phrase before deploying.",
  );
  process.exit(1);
}

function run(args, options = {}) {
  return execFileSync("stellar", args, {
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
}

function deployContract({ alias, wasm }) {
  const output = run(
    [
      "contract",
      "deploy",
      "--wasm",
      wasm,
      "--source-account",
      account,
      "--network",
      network,
      "--alias",
      alias,
    ],
    { capture: true },
  ).trim();

  return output.split(/\s+/).at(-1);
}

run(["contract", "build"]);

const passContractId = deployContract({
  alias: "quorum-pass-nft",
  wasm: "target/wasm32v1-none/release/quorum_pass_nft.wasm",
});
const coreContractId = deployContract({
  alias: "quorum-core",
  wasm: "target/wasm32v1-none/release/quorum_core.wasm",
});

console.log(
  JSON.stringify(
    {
      network,
      passContractId,
      coreContractId,
      env: {
        NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID: passContractId,
        NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID: coreContractId,
      },
    },
    null,
    2,
  ),
);
