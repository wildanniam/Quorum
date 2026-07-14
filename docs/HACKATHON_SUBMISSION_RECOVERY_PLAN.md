# Quorum Hackathon Submission Recovery

This document is the execution source of truth for the final submission recovery.
It tracks real readiness, not feature claims or optimistic demo assumptions.

## Baseline

- Parent tracking issue: [#73](https://github.com/wildanniam/Quorum/issues/73)
- Evidence readiness issue: [#74](https://github.com/wildanniam/Quorum/issues/74)
- Starting commit: `379003f`
- Hosted application: `https://quorum-sandy-eight.vercel.app`
- Target network: Stellar testnet
- Production database: hosted Postgres through server-only environment variables

## Confirmed Gaps

1. Hosted Postgres has migrations `0001` through `0004`, while the application
   requires `0005_anchor_cashout_proof.sql`.
2. The schema mismatch makes the global evidence feed unavailable and can return
   HTTP 500 on event proof pages.
3. The hosted preflight validates environment and contract configuration but did
   not previously compare repository migrations with the live database.
4. The Soroban event indexer has no current hosted execution proof or fresh rows.
5. Demo event dates, generated evidence, and several submission claims are stale.
6. MoneyGram Ramps approval remains external and must not be represented as a
   completed cash-pickup flow.

## Locked Execution Order

| Phase | Outcome | Approval checkpoint |
| --- | --- | --- |
| 1 | Restore evidence schema readiness and add migration drift guards | Production migration requires explicit approval |
| 2 | Harden indexer failure handling, cursor safety, and observability | Adding hosted cron secret requires explicit approval |
| 3 | Produce fresh indexed testnet evidence | Fresh wallet signing requires explicit approval |
| 4 | Repair event lifecycle, dates, capacity, and demo state | No external approval for local/code changes |
| 5 | Align copy and status labels with capabilities that are actually verified | No external approval for local/code changes |
| 6 | Rebuild submission docs, proof inventory, and judge runbook | No external approval for documentation |
| 7 | Run lint, build, smoke suites, browser QA, and responsive screenshots | No external approval for read-only checks |
| 8 | Deploy the approved release and complete final hosted verification | Production deploy and submission remain explicit checkpoints |

## Guardrails

- Do not redeploy Soroban contracts unless a verified contract defect requires it.
- Do not move Quorum to mainnet for this submission.
- Do not claim successful MoneyGram pickup without provider approval and evidence.
- Do not write placeholder transaction hashes, indexer rows, or proof records.
- Do not expose database credentials, signing secrets, or service-role keys.
- Do not apply production migrations or trigger wallet signing without Wildan's
  explicit approval in the current task.

## Phase 1 Acceptance

- A read-only command reports expected, applied, missing, and extra migrations.
- Hosted preflight rejects a database that is behind the repository.
- Migration `0005` remains additive and idempotent.
- DB smoke covers the anchor payout transaction column and unique index.
- Evidence routes use honest degraded states rather than local-session wording or
  placeholder proof.
- Lint, build, migration-status smoke, hosted-preflight smoke, DB smoke, and
  settlement smoke pass where the required environment is available.

## Current External Dependencies

- MoneyGram allowlist approval: pending; Quorum can show integration readiness,
  but not a completed cash-out.
- Fresh testnet transaction: needed because RPC event retention cannot recover old
  contract events indefinitely.
- Hosted cron secret and schedule: needed before the indexer can run reliably in
  production.
