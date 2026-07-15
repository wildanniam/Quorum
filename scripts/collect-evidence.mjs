import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const evidencePath = path.join(projectRoot, "docs", "DEMO_EVIDENCE.md");

const checks = [
  { label: "DB migrate", command: "npm", args: ["run", "db:migrate"] },
  { label: "DB seed", command: "npm", args: ["run", "db:seed"] },
  { label: "DB smoke", command: "npm", args: ["run", "db:smoke"] },
  { label: "Lint", command: "npm", args: ["run", "lint"] },
  { label: "Build", command: "npm", args: ["run", "build"] },
  { label: "Audit", command: "npm", args: ["audit", "--audit-level=moderate"] },
  { label: "Wallet auth smoke", command: "npm", args: ["run", "wallet:auth:smoke"] },
  { label: "API origin smoke", command: "npm", args: ["run", "api:origin:smoke"] },
  { label: "Demo smoke", command: "npm", args: ["run", "demo:smoke"] },
  { label: "Event lifecycle smoke", command: "npm", args: ["run", "event:lifecycle:smoke"] },
  { label: "Product messaging smoke", command: "npm", args: ["run", "product:messaging:smoke"] },
  { label: "Anchor config smoke", command: "npm", args: ["run", "anchor:config:smoke"] },
  { label: "Anchor eligibility smoke", command: "npm", args: ["run", "anchor:eligibility:smoke"] },
  { label: "Live policy smoke", command: "npm", args: ["run", "demo:live-policy"] },
  { label: "Settlement smoke", command: "npm", args: ["run", "settlement:smoke"] },
  { label: "Indexer security smoke", command: "npm", args: ["run", "indexer:security:smoke"] },
  { label: "Browser QA", command: "npm", args: ["run", "browser:qa"] },
  { label: "Evidence lineage smoke", command: "npm", args: ["run", "evidence:lineage:smoke"] },
  { label: "Deploy env smoke", command: "npm", args: ["run", "deploy:env:smoke"] },
  { label: "Deploy hosted preflight smoke", command: "npm", args: ["run", "deploy:hosted:preflight:smoke"] },
  { label: "Live args smoke", command: "npm", args: ["run", "live:args:smoke"] },
  { label: "Live flow smoke", command: "npm", args: ["run", "live:flow:smoke"] },
  { label: "Live persistence smoke", command: "npm", args: ["run", "live:persistence:smoke"] },
  { label: "Live preflight smoke", command: "npm", args: ["run", "live:preflight:smoke"] },
  { label: "Live readiness smoke", command: "npm", args: ["run", "live:readiness:smoke"] },
  { label: "Live signing smoke", command: "npm", args: ["run", "live:signing:smoke"] },
  { label: "Live submission smoke", command: "npm", args: ["run", "live:submission:smoke"] },
  { label: "Live XDR smoke", command: "npm", args: ["run", "live:xdr:smoke"] },
  { label: "Live evidence template", command: "npm", args: ["run", "live:evidence:template"] },
  { label: "Live evidence audit smoke", command: "npm", args: ["run", "live:evidence:audit:smoke"] },
  { label: "Live deployment validation", command: "npm", args: ["run", "live:deployment:validate"] },
  { label: "Live browser flow smoke", command: "npm", args: ["run", "live:browser-flow:smoke"] },
  { label: "Live UI wiring smoke", command: "npm", args: ["run", "live:ui-wiring:smoke"] },
  { label: "Contract tests", command: "npm", args: ["run", "contracts:test"] },
  { label: "Contract build", command: "npm", args: ["run", "contracts:build"] },
  { label: "Contract approval smoke", command: "npm", args: ["run", "contracts:approval:smoke"] },
  { label: "Contract doctor", command: "npm", args: ["run", "contracts:doctor"] },
  { label: "Submission package smoke", command: "npm", args: ["run", "submission:package:smoke"] },
];

const contractCoverage = [
  "emits_core_and_pass_proof_events",
  "set_core_emits_event",
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    maxBuffer: 1024 * 1024 * 12,
    shell: process.platform === "win32" && command === "npm",
    ...options,
  });

  return {
    command: [command, ...args].join(" "),
    exitCode: result.status ?? 1,
    ok: result.status === 0,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

function extractJson(output) {
  const first = output.indexOf("{");
  const last = output.lastIndexOf("}");

  if (first === -1 || last === -1 || last <= first) return null;

  try {
    return JSON.parse(output.slice(first, last + 1));
  } catch {
    return null;
  }
}

function sanitizeOutput(output, maxLength = 1400) {
  const normalized = output
    .replace(/\x1b\[[0-9;]*m/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .join("\n");

  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength)}\n... [truncated]`;
}

function markdownCode(value, language = "") {
  return `\`\`\`${language}\n${value}\n\`\`\``;
}

const generatedAt = new Date().toISOString();
const branch = run("git", ["branch", "--show-current"]);
const commit = run("git", ["rev-parse", "--short", "HEAD"]);
const status = run("git", [
  "status",
  "--short",
  "--",
  ".",
  ":(exclude)docs/DEMO_EVIDENCE.md",
  ":(exclude)docs/BROWSER_QA.md",
]);
const verificationResults = checks.map((check) => ({
  label: check.label,
  ...run(check.command, check.args),
}));
const demoSmoke = verificationResults.find((result) => result.label === "Demo smoke");
const contractDoctor = verificationResults.find(
  (result) => result.label === "Contract doctor",
);
const demoSmokeJson = demoSmoke ? extractJson(demoSmoke.output) : null;
const doctorJson = contractDoctor ? extractJson(contractDoctor.output) : null;
const failedChecks = verificationResults.filter((result) => !result.ok);
const blockerLines = doctorJson?.blockers?.length
  ? doctorJson.blockers.map((blocker) => `- ${blocker}`).join("\n")
  : "- None reported by contracts:doctor.";
const warningLines = doctorJson?.warnings?.length
  ? doctorJson.warnings.map((warning) => `- ${warning}`).join("\n")
  : "- None reported by contracts:doctor.";
const commandRows = verificationResults
  .map(
    (result) =>
      `| ${result.label} | \`${result.command}\` | ${result.ok ? "PASS" : "FAIL"} | ${result.exitCode} |`,
  )
  .join("\n");
const wasmRows =
  doctorJson?.contracts?.wasmArtifacts
    ?.map(
      (artifact) =>
        `| ${artifact.label} | \`${artifact.path}\` | ${artifact.exists ? "yes" : "no"} | ${artifact.sizeBytes ?? "n/a"} | \`${artifact.sha256 ?? "n/a"}\` |`,
    )
    .join("\n") ??
  "| n/a | n/a | n/a | n/a | n/a |";
const demoChecks = demoSmokeJson?.checks?.length
  ? demoSmokeJson.checks.map((check) => `- ${check}`).join("\n")
  : "- Demo smoke JSON was not available.";
const contractCoverageLines = contractCoverage
  .map((coverage) => `- ${coverage}`)
  .join("\n");
const detailSections = verificationResults
  .map(
    (result) => `### ${result.label}

- Command: \`${result.command}\`
- Exit code: \`${result.exitCode}\`
- Status: **${result.ok ? "PASS" : "FAIL"}**

${markdownCode(sanitizeOutput(result.output || "(no output)"), "text")}
`,
  )
  .join("\n");

const evidence = `# Quorum Demo Evidence

Generated at: \`${generatedAt}\`

> Command-level verification snapshot for the source state below. It does not
> prove current hosted database health, indexer execution, wallet signing, or
> MoneyGram provider completion.

## Source State

- Branch: \`${branch.output || "unknown"}\`
- Commit: \`${commit.output || "unknown"}\`
- Working tree when collected, excluding this generated evidence file:

${markdownCode(status.output || "(clean)", "text")}

## Local Verification Summary

| Check | Command | Status | Exit |
|---|---|---:|---:|
${commandRows}

Overall local verification: **${failedChecks.length === 0 ? "PASS" : "FAIL"}**

## Demo Smoke Coverage

Event ID: \`${demoSmokeJson?.eventId ?? "n/a"}\`

Generated pass token ID: \`${demoSmokeJson?.tokenId ?? "n/a"}\`

Covered checks:

${demoChecks}

## Contract Coverage Evidence

These targeted contract tests verify Soroban proof events and are expected in
the \`npm run contracts:test\` output:

${contractCoverageLines}

## Contract Artifacts

| Contract | WASM | Exists | Size bytes | SHA-256 |
|---|---|---:|---:|---|
${wasmRows}

## Contract Tooling Readiness

- Ready to deploy: \`${doctorJson?.readyToDeploy ?? false}\`
- RPC reachable: \`${doctorJson?.network?.rpcReachable ?? "unknown"}\`
- Deploy network: \`${doctorJson?.network?.deployNetwork ?? "unknown"}\`
- App RPC: \`${doctorJson?.network?.appRpcUrl ?? "unknown"}\`
- Payment asset configured: \`${doctorJson?.paymentAsset?.usdcContractIdConfigured ?? "unknown"}\`
- Platform fee bps: \`${doctorJson?.config?.platformFeeBps ?? "unknown"}\`
- Live signing approved: \`${doctorJson?.signing?.liveSigningApproved ?? "unknown"}\`
- Signing approval gate: \`${doctorJson?.signing?.approvalEnv ?? "QUORUM_LIVE_SIGNING_APPROVED"}=${doctorJson?.signing?.approvalValue ?? "I_APPROVE_TESTNET_SIGNING"}\`
- Stellar CLI: \`${doctorJson?.tools?.stellar?.version ?? "unknown"}\`
- Rust: \`${doctorJson?.tools?.rust?.version ?? "unknown"}\`
- Cargo: \`${doctorJson?.tools?.cargo?.version ?? "unknown"}\`

Blockers:

${blockerLines}

Warnings:

${warningLines}

## Hosted Evidence Boundary

This command does not deploy contracts, mutate hosted configuration, sign a
wallet transaction, run the hosted indexer, or prove the current Vercel origin.
Use \`docs/HACKATHON_PROOF_INVENTORY.md\` for release-level status.

## Command Details

${detailSections}
`;

fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
fs.writeFileSync(evidencePath, `${evidence.trimEnd()}\n`);

console.log(
  JSON.stringify(
    {
      ok: failedChecks.length === 0,
      evidencePath,
      generatedAt,
      failedChecks: failedChecks.map((check) => check.label),
      deploymentReady: doctorJson?.readyToDeploy ?? false,
      deploymentBlockers: doctorJson?.blockers ?? [],
    },
    null,
    2,
  ),
);

if (failedChecks.length > 0) {
  process.exit(1);
}
