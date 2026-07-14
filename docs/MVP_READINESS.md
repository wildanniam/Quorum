# Quorum Submission Readiness

Last reviewed: 2026-07-15.

Quorum has a strong implemented product core and genuine Stellar testnet history,
but the current Vercel deployment is not yet the final submission candidate.
The remaining work is release evidence and production readiness, not a new
product concept.

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
| Landing and product navigation | Current hosted | Landing routes to Discover, Studio, Passes, and Evidence. |
| Event discovery, detail, checkout review | Current hosted | Routes respond; final release QA is still required after the PR chain lands. |
| Core and pass contracts | Historically live | IDs and deployment/init hashes are in `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`. |
| Contract runtime configuration | Current hosted, configured | `/api/contracts/status` reports expected testnet IDs and RPC reachability. |
| Live publish/checkout/claim/check-in/withdraw | Historically live | Real July 4 hashes exist in `docs/LIVE_TESTNET_EVIDENCE.json`; the origin is historical ngrok. |
| Current evidence feed | Blocked | Production is missing `0005_anchor_cashout_proof.sql`; explicit migration approval is required. |
| Soroban indexer | Verified in code, blocked hosted | Hardened auth/cursor/concurrency logic exists; Vercel still needs a strong `CRON_SECRET` and fresh run proof. |
| Event lifecycle | Verified in code | Upcoming/live/ended behavior and ended-sales guards are covered by `event:lifecycle:smoke`. Contract-level end-time enforcement is not implemented. |
| Proof classification | Verified in code | Only explorer-valid hashes are labeled Stellar transactions; app and indexed proof remain distinct. |
| Collaborator ledger | Verified in code, data-dependent hosted | Wallet-scoped credits/debits and event proof links exist; hosted data depends on migration/indexer readiness. |
| MoneyGram integration | Verified in code, provider blocked | SEP-1/10/24 paths exist; provider allowlist approval and a successful pickup are not proven. |
| MoneyGram safety invariant | Verified in code | Server and UI require explorer-valid settlement for MoneyGram; mock mode remains explicitly local. |
| Responsive/browser QA | Historical local | `docs/BROWSER_QA.md` must be regenerated on the final candidate. |
| Submission package | In progress | This matrix, proof inventory, and judge runbook are current; final screenshots/video remain. |

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

1. Approve and apply production migration `0005`.
2. Add Vercel `CRON_SECRET`, redeploy, and verify an authenticated indexer run.
3. Review and merge the stacked recovery PRs in dependency order.
4. Redeploy the resulting main branch.
5. Run one fresh approved testnet flow on the Vercel origin.
6. Confirm evidence, event proof, pass, and ledger pages show that same flow.
7. Regenerate browser QA and final screenshots.
8. Run `npm run readiness:final` on the release commit and record its output.

## Explicit Non-Claims

- Quorum is not mainnet production software.
- The current Vercel evidence feed is not healthy until migration `0005` lands.
- A configured contract status is not the same as a successful user transaction.
- Historical ngrok proof is not current Vercel proof.
- MoneyGram pickup is not complete while provider approval is pending.
- Event end time is enforced by Quorum server/UI policy, not by the currently
  deployed Soroban contract.

## Go / No-Go Rule

The final submission is **GO** only when production schema, hosted indexer,
current-origin evidence, final browser QA, and release checks are all green.
Until then, the honest status is **candidate code ready; hosted evidence pending**.

See `docs/HACKATHON_PROOF_INVENTORY.md` for artifact-level proof and
`docs/HACKATHON_DEMO_RUNBOOK.md` for the judge sequence.
