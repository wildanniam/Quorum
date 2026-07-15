import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const browserQaPath = "docs/BROWSER_QA.md";
const generatedEvidenceFiles = new Set([
  "docs/BROWSER_QA.md",
  "docs/DEMO_EVIDENCE.md",
]);
const browserQaInputPaths = [
  "src",
  "public",
  "db",
  "scripts/browser-qa.mjs",
  "scripts/db-migrate.mjs",
  "scripts/db-seed.mjs",
  "scripts/demo-event-schedule.mjs",
  "scripts/postgres-utils.mjs",
  "next.config.ts",
  "postcss.config.mjs",
  "tsconfig.json",
  "package-lock.json",
];

function git(args) {
  return execFileSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function lines(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function packageRuntimeProjection(revision) {
  const packageJson = JSON.parse(git(["show", `${revision}:package.json`]));

  return JSON.stringify({
    dependencies: packageJson.dependencies ?? {},
    devDependencies: packageJson.devDependencies ?? {},
    engines: packageJson.engines ?? {},
    overrides: packageJson.overrides ?? {},
    type: packageJson.type ?? null,
  });
}

function inputManifest(revision) {
  const trackedEntries = git([
    "ls-tree",
    "-r",
    "--full-tree",
    revision,
    "--",
    ...browserQaInputPaths,
  ]);
  const manifest = [
    trackedEntries,
    `package-runtime\t${sha256(packageRuntimeProjection(revision))}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    fileCount: lines(trackedEntries).length,
    fingerprint: sha256(manifest),
    manifest,
  };
}

function main() {
  const browserEvidenceCommit = git([
    "log",
    "-1",
    "--format=%H",
    "--",
    browserQaPath,
  ]);
  const commitLine = git([
    "rev-list",
    "--parents",
    "-n",
    "1",
    browserEvidenceCommit,
  ]).split(/\s+/);
  const parentCommits = commitLine.slice(1);

  if (parentCommits.length !== 1) {
    throw new Error(
      "The latest browser evidence commit must have exactly one source parent.",
    );
  }

  const browserSourceCommit = parentCommits[0];
  const evidenceCommitFiles = lines(
    git([
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      browserEvidenceCommit,
    ]),
  );
  const unexpectedEvidenceFiles = evidenceCommitFiles.filter(
    (file) => !generatedEvidenceFiles.has(file),
  );

  if (unexpectedEvidenceFiles.length > 0) {
    throw new Error(
      `Browser evidence commit also changes source files: ${unexpectedEvidenceFiles.join(", ")}`,
    );
  }

  const currentCommit = git(["rev-parse", "HEAD"]);

  try {
    git(["merge-base", "--is-ancestor", browserSourceCommit, currentCommit]);
  } catch {
    throw new Error("Browser QA source commit is not an ancestor of HEAD.");
  }

  const dirtyInputs = lines(
    git(["status", "--short", "--", ...browserQaInputPaths, "package.json"]),
  );

  if (dirtyInputs.length > 0) {
    throw new Error(
      `Browser QA inputs have uncommitted changes: ${dirtyInputs.join(", ")}`,
    );
  }

  const sourceInputs = inputManifest(browserSourceCommit);
  const currentInputs = inputManifest(currentCommit);
  const changedInputFiles = lines(
    git([
      "diff",
      "--name-only",
      `${browserSourceCommit}..${currentCommit}`,
      "--",
      ...browserQaInputPaths,
    ]),
  );
  const recordedBrowserQa = git([
    "show",
    `${browserEvidenceCommit}:${browserQaPath}`,
  ]);
  const currentBrowserQa = fs
    .readFileSync(path.join(projectRoot, browserQaPath), "utf8")
    .trim();
  const browserDocumentMatches = recordedBrowserQa === currentBrowserQa;
  const inputsMatch =
    sourceInputs.fingerprint === currentInputs.fingerprint &&
    changedInputFiles.length === 0;
  const ok = browserDocumentMatches && inputsMatch;
  const report = {
    ok,
    mode: "reuse-browser-proof",
    browserEvidenceCommit,
    browserSourceCommit,
    currentCommit,
    trackedInputCount: currentInputs.fileCount,
    sourceInputFingerprint: sourceInputs.fingerprint,
    currentInputFingerprint: currentInputs.fingerprint,
    changedInputFiles,
    browserDocumentMatches,
    browserDocumentSha256: sha256(currentBrowserQa),
    boundary:
      "This proves the recorded local browser result still applies to an identical UI/QA input tree. It does not rerun a browser or prove hosted wallet, indexer, or provider behavior.",
  };

  console.log(JSON.stringify(report, null, 2));

  if (!ok) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        mode: "reuse-browser-proof",
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
