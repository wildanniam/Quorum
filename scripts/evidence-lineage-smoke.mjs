import assert from "node:assert/strict";

import {
  listOnlyGeneratedFiles,
  resolveEvidenceSourceCandidates,
} from "./evidence-lineage.mjs";

const generatedDocs = ["docs/BROWSER_QA.md", "docs/DEMO_EVIDENCE.md"];

assert.equal(
  listOnlyGeneratedFiles(
    ["M docs/BROWSER_QA.md", " M docs/DEMO_EVIDENCE.md"],
    generatedDocs,
  ),
  true,
);
assert.equal(
  listOnlyGeneratedFiles(
    ["M docs/BROWSER_QA.md", "M scripts/readiness-audit.mjs"],
    generatedDocs,
  ),
  false,
);

function candidates({ head, parents, changedFiles }) {
  return resolveEvidenceSourceCandidates({
    head,
    generatedDocs,
    parentsOf: (commit) => parents[commit] ?? [],
    changedFilesOf: (commit) => changedFiles[commit] ?? [],
  });
}

assert.deepEqual(
  candidates({
    head: "code123",
    parents: { code123: ["base123"] },
    changedFiles: { code123: ["src/app/page.tsx"] },
  }),
  ["code123"],
);

assert.deepEqual(
  candidates({
    head: "evidence123",
    parents: { evidence123: ["source123"] },
    changedFiles: { evidence123: ["docs/DEMO_EVIDENCE.md"] },
  }),
  ["evidence123", "source123"],
);

assert.deepEqual(
  candidates({
    head: "merge123",
    parents: {
      merge123: ["base123", "evidence123"],
      evidence123: ["source123"],
    },
    changedFiles: {
      base123: ["src/app/page.tsx"],
      evidence123: ["docs/BROWSER_QA.md", "docs/DEMO_EVIDENCE.md"],
    },
  }),
  ["merge123", "evidence123", "source123"],
);

assert.deepEqual(
  candidates({
    head: "squash123",
    parents: { squash123: ["base123"] },
    changedFiles: {
      squash123: ["scripts/readiness-audit.mjs", "docs/DEMO_EVIDENCE.md"],
    },
  }),
  ["squash123"],
);

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "accept-generated-only-status",
        "reject-mixed-status",
        "accept-current-code-head",
        "accept-generated-evidence-parent",
        "accept-generated-evidence-through-merge",
        "reject-stale-pre-squash-source",
      ],
    },
    null,
    2,
  ),
);
