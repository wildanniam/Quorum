# Quorum MVP Readiness Matrix

Last updated: 2026-06-08.

This matrix maps the final definition of done in `DEVELOPMENT_PLAN.md` to the
current proof available in the repository. It separates locally verified MVP
behavior from live testnet work that still requires funded signing credentials.

## Acceptance Criteria Snapshot

Quorum is considered locally demo-ready when these criteria pass:

1. Published paid and free events are visible in the public marketplace.
2. A wallet session can complete paid checkout and free claim flows.
3. Each attendee receives one unique, non-transferable pass proof per event.
4. Event resources are locked without a pass and unlocked for the pass owner.
5. Organizer check-in records pass attendance proof and rejects invalid access.
6. Collaborator balances are visible and withdrawal proof can be recorded.
7. Organizer, attendee, collaborator, and proof readiness dashboard surfaces are
   visible in the app.
8. Local DB, lint, build, audit, demo smoke, live policy smoke, browser QA,
   live args smoke, live flow smoke, live persistence smoke, live preflight
   smoke, live signing smoke, live submission smoke, live XDR smoke, contract
   tests, contract build, and deployment doctor checks pass with live signing
   exceptions documented.
9. The non-signing readiness audit passes after evidence is refreshed.

The live hackathon acceptance criteria add two gated requirements:

1. Contracts are deployed to Stellar testnet with recorded contract IDs.
2. The testnet USDC token contract ID is confirmed and configured.
3. The hosted app submits real Freighter-signed publish, checkout, mint,
   check-in, and withdraw transactions.

## Status Legend

- `Verified local`: implemented and covered by local app, smoke, browser, or
  contract evidence.
- `Contract-ready`: contract behavior is implemented, built, and tested, but the
  app is still using local proof records until deployment.
- `Gated`: requires funded `STELLAR_ACCOUNT`, deployed contract IDs, hosted app
  env vars, or explicit approval before signing live transactions.

## Final Definition Of Done Mapping

| Requirement | Current status | Evidence |
|---|---|---|
| App is deployed | Gated | Requires hosted deployment URL and env configuration. |
| Contracts are deployed on Stellar testnet | Gated | `docs/DEMO_EVIDENCE.md` reports `STELLAR_ACCOUNT` missing; `contracts:doctor` is otherwise ready. |
| Organizer can create and publish event | Verified local | `npm run demo:smoke` covers `draft-validation` and `publish-lifecycle`. |
| Public marketplace shows event | Verified local | `npm run demo:smoke` covers `marketplace`; `npm run browser:qa` verifies desktop/mobile marketplace rendering. |
| Attendee can buy paid pass | Verified local, contract-ready | `npm run demo:smoke` covers `checkout`; `QuorumCore` tests cover paid purchase, payment token transfer into escrow, capacity, duplicate guard, invalid amount, split accounting, and zero-fee demo accounting. |
| Attendee can claim free pass | Verified local, contract-ready | `npm run demo:smoke` covers `free-claim` and duplicate free claim; `QuorumCore` tests cover free claim, duplicate guard, capacity, and invalid non-zero amount. |
| Each purchase/claim mints unique non-transferable NFT pass | Verified local, contract-ready | `npm run demo:smoke` covers pass creation; `QuorumPassNFT` tests cover unique owner/event pass, core-only mint, duplicate prevention, and disabled transfer. |
| Resources are gated by NFT/pass ownership | Verified local | `npm run demo:smoke` covers locked anonymous resources and unlocked pass-owner resources. |
| Organizer can check in pass | Verified local, contract-ready | `npm run demo:smoke` covers organizer check-in and duplicate guard; `QuorumCore` tests cover organizer-only, unknown token, cross-event mismatch, and idempotent duplicate check-in. |
| Collaborator can see balance and withdraw | Verified local, contract-ready | `npm run demo:smoke` covers collaborator withdraw and duplicate empty-balance guard; `QuorumCore` tests cover collaborator balance, token transfer out of escrow, platform fee withdrawal, and zero-balance rejection. |
| Dashboards show proof surfaces | Verified local | `npm run demo:smoke` covers `dashboard-proof`; `npm run browser:qa` verifies dashboard proof mode and readiness panels. |
| Live contract argument encoding is deterministic | Verified local | `npm run live:args:smoke` covers USDC atomic conversion, event ID derivation, split bps, metadata hashes, and publish/checkout/check-in/withdraw argument DTOs without signing. |
| Mock live transaction flow persists only after success | Verified local | `npm run live:flow:smoke` covers checkout action preparation from DB state, RPC preflight, mock Freighter signing options, mock submission/finality, pass persistence after success, and no persistence after failed finality. |
| Verified live transaction results can be recorded | Verified local | `npm run live:persistence:smoke` covers recording live publish/pass/check-in/withdrawal results with 64-hex transaction hashes while rejecting local `stub:` hashes. |
| Live RPC preflight can prepare transaction XDR for signing | Verified local | `npm run live:preflight:smoke` covers signer sequence lookup, Soroban `prepareTransaction` orchestration through a mock RPC boundary, parseable prepared XDR, and preflight error normalization without signing. |
| Freighter signing boundary validates signed transaction output | Verified local | `npm run live:signing:smoke` covers the browser signing adapter with a mock signer, including Freighter options, signer mismatch rejection, wallet rejection normalization, and parseable signed XDR without requesting a real signature. |
| Signed transaction submission boundary polls finality | Verified local | `npm run live:submission:smoke` covers signed transaction submission, `getTransaction` finality polling, RPC rejection, failed finality, and timeout handling with a mock RPC boundary. |
| Unsigned Soroban XDR templates are parseable | Verified local | `npm run live:xdr:smoke` covers pre-simulation unsigned invokeHostFunction XDR templates for publish/checkout/check-in/withdraw, including typed split recipient maps. |
| Live action preparation is non-signing and fail-safe | Verified local | `npm run demo:live-policy` covers `GET /api/events/[eventId]/contract-action` prepare responses for publish/checkout/check-in/withdraw with fake valid contract IDs, then verifies mutation routes still return live-required responses without local proof writes. |
| Final verification commands pass or exceptions are documented | Verified local | `docs/DEMO_EVIDENCE.md` records DB, lint, build, audit, demo smoke, live policy smoke, browser QA, live args smoke, live flow smoke, live persistence smoke, live preflight smoke, live signing smoke, live submission smoke, live XDR smoke, contract tests, contract build, and contract doctor; `npm run readiness:audit` checks evidence/doc consistency. |
| Hackathon evidence is recorded | Verified local | `docs/DEMO_EVIDENCE.md`, `docs/BROWSER_QA.md`, and `docs/HACKATHON_DEMO_RUNBOOK.md`. |

## Live Testnet Gate

The only remaining critical gate for the full final definition of done is live
deployment and signing:

1. Configure a funded Stellar testnet identity through `STELLAR_ACCOUNT`.
2. Run `npm run contracts:doctor`.
3. Run `npm run contracts:deploy:testnet`.
4. Export the printed `NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID` and
   `NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID`.
5. Run `npm run contracts:init:testnet`.
6. Confirm and export `NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID`.
7. Configure the hosted app environment and verify Freighter signing on the
   deployed URL.

Until those steps are intentionally approved and executed, Quorum is demo-ready
in local proof mode and contract-ready for live testnet deployment.
Use `docs/LIVE_SIGNING_HANDOFF.md` for the endpoint-by-endpoint live signing
handoff and required transaction evidence.

## Current Submission State

The current repository is suitable for a local hackathon demo and technical
review. It is not yet a complete live testnet submission because funded signing
credentials, deployed contract IDs, hosted environment variables, and real
transaction hashes are intentionally outside the local repo state.
