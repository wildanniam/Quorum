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
8. Local DB, lint, build, audit, demo smoke, live policy smoke, contract tests,
   contract build, and deployment doctor checks pass with live signing
   exceptions documented.

The live hackathon acceptance criteria add two gated requirements:

1. Contracts are deployed to Stellar testnet with recorded contract IDs.
2. The hosted app submits real Freighter-signed publish, checkout, mint,
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
| Public marketplace shows event | Verified local | `npm run demo:smoke` covers `marketplace`; `docs/BROWSER_QA.md` verifies desktop/mobile marketplace rendering. |
| Attendee can buy paid pass | Verified local, contract-ready | `npm run demo:smoke` covers `checkout`; `QuorumCore` tests cover paid purchase, capacity, duplicate guard, invalid amount, split accounting, and zero-fee demo accounting. |
| Attendee can claim free pass | Verified local, contract-ready | `npm run demo:smoke` covers `free-claim` and duplicate free claim; `QuorumCore` tests cover free claim, duplicate guard, capacity, and invalid non-zero amount. |
| Each purchase/claim mints unique non-transferable NFT pass | Verified local, contract-ready | `npm run demo:smoke` covers pass creation; `QuorumPassNFT` tests cover unique owner/event pass, core-only mint, duplicate prevention, and disabled transfer. |
| Resources are gated by NFT/pass ownership | Verified local | `npm run demo:smoke` covers locked anonymous resources and unlocked pass-owner resources. |
| Organizer can check in pass | Verified local, contract-ready | `npm run demo:smoke` covers organizer check-in and duplicate guard; `QuorumCore` tests cover organizer-only, unknown token, cross-event mismatch, and idempotent duplicate check-in. |
| Collaborator can see balance and withdraw | Verified local, contract-ready | `npm run demo:smoke` covers collaborator withdraw and duplicate empty-balance guard; `QuorumCore` tests cover collaborator balance, withdraw, and zero-balance rejection. |
| Dashboards show proof surfaces | Verified local | `npm run demo:smoke` covers `dashboard-proof`; `docs/BROWSER_QA.md` verifies dashboard proof mode and readiness panels. |
| Final verification commands pass or exceptions are documented | Verified local | `docs/DEMO_EVIDENCE.md` records DB, lint, build, audit, demo smoke, live policy smoke, contract tests, contract build, and contract doctor. |
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
6. Configure the hosted app environment and verify Freighter signing on the
   deployed URL.

Until those steps are intentionally approved and executed, Quorum is demo-ready
in local proof mode and contract-ready for live testnet deployment.

## Current Submission State

The current repository is suitable for a local hackathon demo and technical
review. It is not yet a complete live testnet submission because funded signing
credentials, deployed contract IDs, hosted environment variables, and real
transaction hashes are intentionally outside the local repo state.
