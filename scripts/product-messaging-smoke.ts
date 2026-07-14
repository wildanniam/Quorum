import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  canStartAnchorPayout,
  getAnchorProviderPresentation,
  getContractSetupPresentation,
  getEvidenceProofPresentation,
  hasLiveStellarProof,
} from "../src/lib/capability-presentation";

const liveHash = "a".repeat(64);
const localReference = "local-checkout-demo-123";

assert.equal(
  hasLiveStellarProof({ ledger: null, txHash: liveHash }),
  true,
);
assert.equal(
  hasLiveStellarProof({ ledger: null, txHash: localReference }),
  false,
);
assert.deepEqual(
  getEvidenceProofPresentation({ ledger: null, txHash: liveHash }),
  {
    helper: "Verifiable through a Stellar testnet transaction hash.",
    label: "Stellar tx",
    tone: "live",
  },
);
assert.equal(
  getEvidenceProofPresentation({ ledger: null, txHash: localReference }).label,
  "App reference",
);
assert.equal(
  getEvidenceProofPresentation({ ledger: 123, txHash: localReference }).label,
  "Indexed ledger",
);
assert.equal(
  getEvidenceProofPresentation({ ledger: null, txHash: null }).label,
  "App proof",
);

const configuredContracts = getContractSetupPresentation({ configured: true });
assert.equal(configuredContracts.status, "Configuration detected");
assert.doesNotMatch(configuredContracts.description, /ready for/i);
assert.match(configuredContracts.description, /transaction is still required/i);

const localContracts = getContractSetupPresentation({ configured: false });
assert.equal(localContracts.status, "Setup pending");
assert.equal(localContracts.proofMode, "Local proof mode");

const moneyGram = getAnchorProviderPresentation("moneygram");
assert.match(moneyGram.accessTitle, /provider access required/i);
assert.match(moneyGram.accessDescription, /only available after/i);

const mock = getAnchorProviderPresentation("mock");
assert.match(mock.accessTitle, /demo mode/i);
assert.match(mock.accessDescription, /no external cash pickup/i);
assert.equal(
  canStartAnchorPayout({ provider: "moneygram", settlementTxHash: liveHash }),
  true,
);
assert.equal(
  canStartAnchorPayout({
    provider: "moneygram",
    settlementTxHash: localReference,
  }),
  false,
);
assert.equal(
  canStartAnchorPayout({ provider: "mock", settlementTxHash: localReference }),
  true,
);

const evidencePage = readFileSync("src/app/evidence/page.tsx", "utf8");
const walletReadiness = readFileSync(
  "src/components/wallet-readiness.tsx",
  "utf8",
);
const contractReadiness = readFileSync(
  "src/components/contract-readiness.tsx",
  "utf8",
);
const ledgerPage = readFileSync(
  "src/app/dashboard/ledger/page.tsx",
  "utf8",
);

assert.doesNotMatch(evidencePage, /eyebrow="Live evidence"/);
assert.match(walletReadiness, /isTestnet \? "Detected" : "Not detected"/);
assert.match(contractReadiness, /getContractSetupPresentation/);
assert.match(ledgerPage, /getAnchorProviderPresentation/);

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: [
        "classify-only-explorer-valid-hashes-as-live",
        "separate-app-reference-from-live-transaction",
        "separate-configured-contracts-from-proven-execution",
        "label-wallet-network-as-detected",
        "disclose-moneygram-provider-dependency",
        "block-moneygram-ui-for-local-settlement-proof",
        "label-mock-anchor-as-demo",
      ],
    },
    null,
    2,
  ),
);
