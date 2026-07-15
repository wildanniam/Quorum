# Quorum Submission Readiness

Last reviewed: 2026-07-15.

Quorum has a strong implemented product core, genuine Stellar testnet history,
and a schema-ready hosted release. Final local browser QA and the autonomous
submission gates are green. The remaining work is fresh current-origin
transaction/indexer evidence, the final demo package, and explicit submission
approval, not a new product concept or another infrastructure migration.

## Readiness Legend

- **Current hosted**: observed on the current Vercel deployment.
- **Historically live**: real Stellar testnet execution from an older app origin.
- **Verified in code**: deterministic smoke/contract coverage without a current
  hosted transaction claim.
- **Blocked**: requires an explicit production, signing, or provider checkpoint.

## Current Matrix

| Area | Status | Evidence / next gate |
| --- | --- | --- |
| Public product deployment | Current hosted | `https://quorum-sandy-eight.vercel.app` responds successfully. |
| Recovery release candidate | Current hosted | Recovery PRs #75 through #91 are merged into `main`; the immutable hosted checkpoint is recorded in `docs/HOSTED_RELEASE_EVIDENCE.json`, and final browser evidence is recorded in `docs/BROWSER_QA.md`. |
| Landing and product navigation | Current hosted | Landing routes to Discover, Studio, Passes, and Evidence. |
| Event discovery, detail, checkout review | Current hosted and final-QA checked | Hosted routes respond; the final isolated browser run covers the primary product routes at desktop, tablet, and mobile sizes. |
| Core and pass contracts | Historically live | IDs and deployment/init hashes are in `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`. |
| Contract runtime configuration | Current hosted, configured | `/api/contracts/status` reports expected testnet IDs and RPC reachability. |
| Live publish/checkout/claim/check-in/withdraw | Historically live | Real July 4 hashes exist in `docs/LIVE_TESTNET_EVIDENCE.json`; the origin is historical ngrok. |
| Current evidence feed | Current hosted and healthy | Production includes `0005_anchor_cashout_proof.sql`; `/evidence` responds without the degraded state. Fresh current-origin rows are still pending. |
| Soroban indexer | Current hosted, awaiting fresh events | Sensitive `CRON_SECRET`, HTTP 401 fail-closed behavior, two successful runs, and monotonic cursor/ledger progress are recorded. Historical events were outside RPC retention. |
| Event lifecycle | Verified in code | Upcoming/live/ended behavior and ended-sales guards are covered by `event:lifecycle:smoke`. Contract-level end-time enforcement is not implemented. |
| Proof classification | Verified in code | Only explorer-valid hashes are labeled Stellar transactions; app and indexed proof remain distinct. |
| Collaborator ledger | Current hosted, data-dependent | Wallet-scoped credits/debits and event proof links exist; a fresh signed flow is needed for final judge evidence. |
| MoneyGram integration | Verified in code, provider blocked | SEP-1/10/24 paths exist; provider allowlist approval and a successful pickup are not proven. |
| MoneyGram safety invariant | Verified in code | Server and UI require explorer-valid settlement for MoneyGram; mock mode remains explicitly local. |
| Responsive/browser QA | Final candidate local, complete | `docs/BROWSER_QA.md` records 13 routes across 3 viewports (39 states), with no console errors, horizontal overflow, or missing required copy. It does not claim hosted wallet execution. |
| Submission package | Hosted checkpoint and local QA ready | Source/DB gates, hosted release evidence, final local screenshots, and browser QA are current; fresh transaction/indexer evidence, video, and final submission remain. |

## What Is Already Strong

- custom Soroban core and non-transferable pass contracts;
- preconfigured collaborator split and escrow accounting;
- wallet-bound pass, resources, check-in, and settlement surfaces;
- Freighter challenge/session flow and explicit signing boundary;
- current contract-status endpoint with testnet IDs;
- public/event/wallet proof scopes;
- custom event indexer with fail-closed cron authentication and monotonic cursor;
- historical real testnet flow covering the major product actions;
- deterministic smoke coverage for XDR, preflight, signing adapter, submission,
  persistence, lifecycle, proof classification, and MoneyGram eligibility.

## Release-Critical Work

1. Run one fresh approved testnet flow on the Vercel origin.
2. Trigger the authenticated hosted indexer and confirm fresh rows for that flow.
3. Confirm evidence, event proof, pass, and ledger pages agree on the same hashes,
   token, wallets, and event.
4. Run `npm run readiness:final` after recording the fresh evidence.
5. Capture the demo video and submit only after explicit final approval.

## Explicit Non-Claims

- Quorum is not mainnet production software.
- A healthy evidence page and advancing indexer cursor do not prove a fresh
  current-origin transaction.
- A configured contract status is not the same as a successful user transaction.
- Historical ngrok proof is not current Vercel proof.
- MoneyGram pickup is not complete while provider approval is pending.
- Event end time is enforced by Quorum server/UI policy, not by the currently
  deployed Soroban contract.

## Go / No-Go Rule

The final submission is **GO** only when current-origin evidence and final
release checks are green. Browser QA is complete; until the signed flow and
follow-up indexer proof exist, the honest status is **hosted release
operational and final browser QA complete; fresh transaction/indexer evidence
pending**.

See `docs/HACKATHON_PROOF_INVENTORY.md` for artifact-level proof and
`docs/HACKATHON_DEMO_RUNBOOK.md` for the judge sequence.
