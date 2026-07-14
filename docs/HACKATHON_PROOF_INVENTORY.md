# Quorum Hackathon Proof Inventory

Last reviewed: 2026-07-15.

This is the shortest honest map from a Quorum product claim to its evidence.
It intentionally separates the current Vercel deployment, historical live
testnet execution, deterministic local verification, and external blockers.

## Status Vocabulary

- **Current hosted**: observed on `https://quorum-sandy-eight.vercel.app`.
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
| Evidence and event-proof read models exist | `/evidence`, `/events/[slug]/proof`, repository tests | Verified in code, currently degraded in production | Production still needs migration `0005_anchor_cashout_proof.sql`. |
| Soroban event indexer is implemented and hardened | `src/lib/stellar/indexer.ts`, `npm run indexer:security:smoke` | Verified in code | A current hosted cron run and fresh indexed row are still missing. |
| MoneyGram SEP integration exists | SEP-1, SEP-10, SEP-24 modules and anchor smoke tests | Verified in code | MoneyGram domain/wallet approval and successful pickup are not proven. |
| Local proof cannot masquerade as MoneyGram settlement | `npm run anchor:eligibility:smoke` | Verified in code | It does not call MoneyGram or move USDC. |
| Event lifecycle closes ended sales | `npm run event:lifecycle:smoke` | Verified in code and server UI policy | The deployed Soroban contract does not encode event end time; direct out-of-app invocation is a known limitation. |
| UI labels distinguish app proof, indexed proof, and explorer proof | `npm run product:messaging:smoke` | Verified in code | The candidate changes are not current-hosted until their PR chain is approved and deployed. |
| Responsive product routes render without basic overflow/errors | `docs/BROWSER_QA.md` | Historical local browser QA | It predates the submission-recovery branch and must be regenerated before final submission. |

## Current Hosted Snapshot

Read-only checks on 2026-07-15 confirmed:

- `/` responds successfully;
- `/discover` responds successfully;
- `/api/contracts/status` responds successfully, reports the expected testnet
  contracts and USDC asset, and can reach the configured RPC;
- `/evidence` renders an honest degraded state because the production schema is
  behind the repository.

The current Vercel deployment is therefore public and contract-configured, but
not yet the final submission candidate.

## Release-Critical Gaps

1. Review and explicitly approve production migration `0005`.
2. Configure a strong Vercel `CRON_SECRET` and verify the cron route without
   exposing the value.
3. Merge the approved recovery PR chain and redeploy Vercel.
4. Generate one fresh, explicitly approved testnet flow so current app URLs,
   transaction hashes, pass token, and proof rows share the same release origin.
5. Regenerate browser QA and capture final desktop/mobile screenshots.
6. Keep MoneyGram as an integration preview unless provider approval arrives
   and an actual provider response is recorded.

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
- Demo sequence: `docs/HACKATHON_DEMO_RUNBOOK.md`
- Current readiness: `docs/MVP_READINESS.md`

Do not send a judge directly to `/evidence` until the production migration and
release deployment checks pass.
