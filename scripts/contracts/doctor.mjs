import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { StrKey } from "@stellar/stellar-sdk";
import {
  hasLiveSigningApproval,
  liveSigningApprovalEnv,
  liveSigningApprovalMessage,
  liveSigningApprovalValue,
} from "./live-signing-approval.mjs";
import {
  hasNonzeroPlatformFeeApproval,
  nonzeroPlatformFeeApprovalEnv,
  nonzeroPlatformFeeApprovalMessage,
  nonzeroPlatformFeeApprovalValue,
} from "./platform-fee-policy.mjs";
import {
  isTestnetDeploymentNetwork,
  normalizeTestnetDeploymentNetwork,
  testnetDeploymentNetworkMessage,
} from "./testnet-network-guard.mjs";

const projectRoot = process.cwd();
const strict = process.env.CONTRACTS_DOCTOR_STRICT === "1";
const wasmFiles = [
  {
    label: "QuorumCore",
    path: "target/wasm32v1-none/release/quorum_core.wasm",
  },
  {
    label: "QuorumPassNFT",
    path: "target/wasm32v1-none/release/quorum_pass_nft.wasm",
  },
];

function readEnvFile(filename) {
  const envPath = path.join(projectRoot, filename);

  if (!fs.existsSync(envPath)) return {};

  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        if (separatorIndex === -1) return null;

        const key = line.slice(0, separatorIndex).trim();
        const rawValue = line.slice(separatorIndex + 1).trim();
        const value = rawValue.replace(/^["']|["']$/g, "");

        return key ? [key, value] : null;
      })
      .filter((entry) => entry !== null),
  );
}

const env = {
  ...readEnvFile(".env"),
  ...readEnvFile(".env.local"),
  ...process.env,
};

function optionalEnv(name) {
  const value = env[name];
  return value && value.trim().length > 0 ? value.trim() : null;
}

function run(command, args) {
  try {
    return {
      ok: true,
      output: execFileSync(command, args, {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim(),
    };
  } catch (error) {
    return {
      ok: false,
      output:
        error instanceof Error
          ? error.message
          : `${command} ${args.join(" ")} failed`,
    };
  }
}

function getWasmInfo(wasm) {
  const absolutePath = path.join(projectRoot, wasm.path);

  if (!fs.existsSync(absolutePath)) {
    return {
      ...wasm,
      exists: false,
      sha256: null,
      sizeBytes: null,
    };
  }

  const bytes = fs.readFileSync(absolutePath);

  return {
    ...wasm,
    exists: true,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  };
}

function validContractId(value) {
  return Boolean(value && StrKey.isValidContract(value));
}

async function checkRpc(rpcUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getHealth",
      }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);

    return {
      ok: response.ok && !body?.error,
      status: response.status,
      response: body,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      response: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

const stellarVersion = run("stellar", ["--version"]);
const rustVersion = run("rustc", ["--version"]);
const cargoVersion = run("cargo", ["--version"]);
const rustupTargets = run("rustup", ["target", "list", "--installed"]);
const wasmArtifacts = wasmFiles.map(getWasmInfo);
const stellarAccount = optionalEnv("STELLAR_ACCOUNT");
const rawStellarNetwork = optionalEnv("STELLAR_NETWORK") ?? "testnet";
const stellarNetworkIsTestnet = isTestnetDeploymentNetwork(rawStellarNetwork);
const stellarNetwork = stellarNetworkIsTestnet
  ? normalizeTestnetDeploymentNetwork(rawStellarNetwork)
  : rawStellarNetwork;
const appRpcUrl =
  optionalEnv("NEXT_PUBLIC_STELLAR_RPC_URL") ??
  "https://soroban-testnet.stellar.org";
const appNetwork = optionalEnv("NEXT_PUBLIC_STELLAR_NETWORK") ?? "TESTNET";
const appNetworkPassphrase =
  optionalEnv("NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE") ??
  "Test SDF Network ; September 2015";
const coreContractId = optionalEnv("NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID");
const passContractId = optionalEnv("NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID");
const usdcContractId = optionalEnv("NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID");
const platformFeeBps = optionalEnv("QUORUM_PLATFORM_FEE_BPS") ?? "0";
const liveSigningApproved = hasLiveSigningApproval(env);
const nonzeroPlatformFeeApproved = hasNonzeroPlatformFeeApproval(env);
const rpc = await checkRpc(appRpcUrl);
const blockers = [];
const warnings = [];

if (!stellarVersion.ok) {
  blockers.push("Stellar CLI is not available. Install Stellar CLI before deploying.");
}

if (!rustVersion.ok || !cargoVersion.ok) {
  blockers.push("Rust/Cargo toolchain is not available. Install Rust before building contracts.");
}

if (!rustupTargets.ok || !rustupTargets.output.includes("wasm32v1-none")) {
  blockers.push("Rust target wasm32v1-none is not installed.");
}

for (const artifact of wasmArtifacts) {
  if (!artifact.exists) {
    blockers.push(`${artifact.label} WASM is missing. Run npm run contracts:build.`);
  }
}

if (!rpc.ok) {
  blockers.push(`Stellar RPC is not reachable at ${appRpcUrl}.`);
}

if (!stellarNetworkIsTestnet) {
  blockers.push(testnetDeploymentNetworkMessage(rawStellarNetwork));
}

if (!stellarAccount) {
  blockers.push("STELLAR_ACCOUNT is missing. Set a funded Stellar identity/secret before deploy.");
}

if (!liveSigningApproved) {
  blockers.push(liveSigningApprovalMessage());
}

if (!/^\d+$/.test(platformFeeBps) || Number(platformFeeBps) > 10_000) {
  blockers.push("QUORUM_PLATFORM_FEE_BPS must be an integer from 0 to 10000.");
}

if (/^\d+$/.test(platformFeeBps) && Number(platformFeeBps) > 0) {
  if (nonzeroPlatformFeeApproved) {
    warnings.push(
      "QUORUM_PLATFORM_FEE_BPS is non-zero with explicit fee policy approval. The locked hackathon demo default remains 0 bps.",
    );
  } else {
    blockers.push(nonzeroPlatformFeeApprovalMessage());
  }
}

if (!validContractId(coreContractId)) {
  warnings.push(
    "NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID is missing or not a valid contract ID. This is expected before deploy.",
  );
}

if (!validContractId(passContractId)) {
  warnings.push(
    "NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID is missing or not a valid contract ID. This is expected before deploy.",
  );
}

if (!validContractId(usdcContractId)) {
  warnings.push(
    "NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID is missing or not a valid contract ID. This is expected before live app transaction signing.",
  );
}

const report = {
  ok: blockers.length === 0,
  readyToDeploy: blockers.length === 0,
  strict,
  network: {
    deployNetwork: stellarNetwork,
    appNetwork,
    appRpcUrl,
    appNetworkPassphrase,
    rpcReachable: rpc.ok,
    rpcStatus: rpc.status,
  },
  tools: {
    stellar: {
      ok: stellarVersion.ok,
      version: stellarVersion.ok ? stellarVersion.output.split("\n")[0] : null,
    },
    rust: {
      ok: rustVersion.ok,
      version: rustVersion.ok ? rustVersion.output : null,
    },
    cargo: {
      ok: cargoVersion.ok,
      version: cargoVersion.ok ? cargoVersion.output : null,
    },
    wasm32v1NoneInstalled:
      rustupTargets.ok && rustupTargets.output.includes("wasm32v1-none"),
  },
  contracts: {
    coreContractIdConfigured: validContractId(coreContractId),
    passContractIdConfigured: validContractId(passContractId),
    wasmArtifacts,
  },
  paymentAsset: {
    usdcContractIdConfigured: validContractId(usdcContractId),
  },
  config: {
    platformFeeBps: /^\d+$/.test(platformFeeBps) ? Number(platformFeeBps) : null,
    nonzeroPlatformFeeApproved,
    nonzeroPlatformFeeApprovalEnv,
    nonzeroPlatformFeeApprovalValue,
  },
  signing: {
    stellarAccountConfigured: Boolean(stellarAccount),
    liveSigningApproved,
    approvalEnv: liveSigningApprovalEnv,
    approvalValue: liveSigningApprovalValue,
  },
  blockers,
  warnings,
};

console.log(JSON.stringify(report, null, 2));

if (strict && blockers.length > 0) {
  process.exit(1);
}
