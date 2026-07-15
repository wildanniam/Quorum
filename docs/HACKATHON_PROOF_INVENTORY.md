# Quorum Hackathon Proof Inventory

Last reviewed: 2026-07-15.

This is the shortest honest map from a Quorum product claim to its evidence.
It intentionally separates the current Vercel deployment, historical live
testnet execution, deterministic local verification, and external blockers.

## Status Vocabulary

- **Current hosted**: observed on `https://quorum-sandy-eight.vercel.app`.
- **Hosted release evidence**: captured after the recovery stack was merged,
  production migration `0005` was applied, and the hosted indexer was verified.
- **Historically live**: executed on Stellar testnet, but through the July 4
  ngrok app origin rather than the current Vercel deployment.
- **Verified in code**: exercised through deterministic smoke or contract tests
  without claiming a current hosted transaction.
- **Configured**: required IDs or settings are present; this does not prove a
  successful user transaction.
- **Blocked externally**: requires production data, a secret, wallet approval,
  or provider approval that Codex must not fabricate.

## Evidence Map

| Product claim | Evidence | Status | What it does not prove |
| --- | --- | --- | --- |
| Quorum is publicly deployed | `https://quorum-sandy-eight.vercel.app` | Current hosted | It does not prove every database-backed route is healthy. |
| Testnet contracts are deployed | `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json` | Historically live and read-only validated | It does not prove the current Vercel app completed a fresh transaction. |
| Publish, paid checkout, free claim, check-in, and withdrawal reached Stellar | `docs/LIVE_TESTNET_EVIDENCE.json` | Historically live on 2026-07-04 | Its ngrok URLs are historical and must not be presented as current Vercel URLs. |
| Current runtime has the expected contract and USDC IDs | `/api/contracts/status` on Vercel | Current hosted, configured | `proofMode: live` means wallet actions require live submission; it is not transaction evidence. |
| Evidence and event-proof read models exist | `/evidence`, `/events/[slug]/proof`, `docs/HOSTED_RELEASE_EVIDENCE.json` | Current hosted and healthy | The current release still has no fresh current-origin transaction rows. |
| Soroban event indexer is implemented and hardened | `src/lib/stellar/indexer.ts`, `npm run indexer:security:smoke`, `docs/HOSTED_RELEASE_EVIDENCE.json` | Current hosted, authenticated, and cursor-advancing | The verified runs found zero retained Quorum events; a fresh signed flow is still required. |
| MoneyGram SEP integration exists | SEP-1, SEP-10, SEP-24 modules and anchor smoke tests | Verified in code | MoneyGram domain/wallet approval and successful pickup are not proven. |
| Local proof cannot masquerade as MoneyGram settlement | `npm run anchor:eligibility:smoke` | Verified in code | It does not call MoneyGram or move USDC. |
| Event lifecycle closes ended sales | `npm run event:lifecycle:smoke` | Verified in code and server UI policy | The deployed Soroban contract does not encode event end time; direct out-of-app invocation is a known limitation. |
| UI labels distinguish app proof, indexed proof, and explorer proof | `npm run product:messaging:smoke` | Current hosted and verified in code | It does not turn an app reference into a Stellar transaction. |
| Responsive product routes render without basic overflow/errors | `docs/BROWSER_QA.md` | Final candidate local QA, complete | The 39-state isolated run does not prove hosted wallet signing, production persistence, indexer execution, or MoneyGram pickup. |

## Current Hosted Snapshot

Read-only checks on 2026-07-15 confirmed:

- `/` responds successfully;
- `/discover` responds successfully;
- `/api/contracts/status` responds successfully, reports the expected testnet
  contracts and USDC asset, and can reach the configured RPC;
- `/evidence` responds successfully without the degraded data-service state;
- production migration status is ready with migrations `0001` through `0005`;
- the verified operational checkpoint was built from commit
  `a35b3dee401920eb240c6ce180e359150667f4b4`;
- contract and payment configuration is live on Stellar testnet.

The public Vercel release is schema-ready and operational. The immutable
checkpoint records the exact deployment that was probed; a later evidence-only
docs deployment may supersede the alias without changing app runtime code.
Final local browser QA is complete. The submission is not ready because fresh
current-origin transaction and follow-up indexer evidence are still pending.

## Hosted Indexer Snapshot

The release checkpoint in `docs/HOSTED_RELEASE_EVIDENCE.json` records:

- `CRON_SECRET` is stored as a sensitive Preview and Production variable, while
  its value is deliberately absent from the repository;
- an unauthenticated indexer request fails closed with HTTP 401;
- two authenticated hosted runs completed without an error;
- the cursor and latest-ledger checkpoint advanced monotonically;
- both runs fetched zero Quorum events, which is an honest retention boundary,
  not a successful fresh-event claim.

## Release-Critical Gaps

1. Generate one fresh, explicitly approved testnet flow so current app URLs,
   transaction hashes, pass token, and proof rows share the same release origin.
2. Run the authenticated hosted indexer after that flow and verify that fresh
   Quorum rows appear without cursor regression or duplicate ingestion.
3. Run `npm run live:evidence:audit:current` and
   `npm run live:evidence:network` to validate packet provenance and on-chain
   transaction truth.
4. Run `npm run readiness:final` on the clean release commit.
5. Keep MoneyGram as an integration preview unless provider approval arrives
   and an actual provider response is recorded.
6. Submit only after Wildan explicitly approves the final package.

Run `npm run submission:gate` for the complete non-destructive source suite and
`npm run submission:hosted:probe` for the read-only Vercel snapshot. Neither
command replaces the explicit production, browser, signing, or provider gates.
Use `npm run submission:db:gate` only with `QUORUM_RELEASE_DATABASE_URL`
pointing to disposable localhost Postgres; the gate rejects hosted database
hosts before running migrations or seed data.

## Judge-Safe Links

- Product: `https://quorum-sandy-eight.vercel.app`
- Discover: `https://quorum-sandy-eight.vercel.app/discover`
- Contract status: `https://quorum-sandy-eight.vercel.app/api/contracts/status`
- Historical deployment evidence: `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`
- Historical app-flow evidence: `docs/LIVE_TESTNET_EVIDENCE.json`
- Hosted release evidence: `docs/HOSTED_RELEASE_EVIDENCE.json`
- Demo sequence: `docs/HACKATHON_DEMO_RUNBOOK.md`
- Current readiness: `docs/MVP_READINESS.md`

`/evidence` is now safe to show as a healthy product surface, but do not describe
its current rows as fresh Vercel-origin proof until the signed flow and follow-up
indexer run are recorded.
