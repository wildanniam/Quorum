# Quorum Hackathon Submission Recovery

This document is the execution source of truth for the final submission recovery.
It tracks real readiness, not feature claims or optimistic demo assumptions.

## Baseline

- Parent tracking issue: [#73](https://github.com/wildanniam/Quorum/issues/73)
- Evidence readiness issue: [#74](https://github.com/wildanniam/Quorum/issues/74)
- Indexer hardening issue: [#76](https://github.com/wildanniam/Quorum/issues/76)
- Event lifecycle issue: [#78](https://github.com/wildanniam/Quorum/issues/78)
- Capability messaging issue: [#80](https://github.com/wildanniam/Quorum/issues/80)
- MoneyGram eligibility issue: [#82](https://github.com/wildanniam/Quorum/issues/82)
- Submission package issue: [#84](https://github.com/wildanniam/Quorum/issues/84)
- Hosted release evidence issue: [#88](https://github.com/wildanniam/Quorum/issues/88)
- Final browser QA issue: [#90](https://github.com/wildanniam/Quorum/issues/90)
- Browser evidence lineage issue: [#93](https://github.com/wildanniam/Quorum/issues/93)
- Current-origin evidence issue: [#92](https://github.com/wildanniam/Quorum/issues/92)
- Starting commit: `379003f`
- Hosted application: `https://quorum-sandy-eight.vercel.app`
- Target network: Stellar testnet
- Production database: hosted Postgres through server-only environment variables

## Original Gaps And Current Resolution

1. **Resolved:** production Postgres now has migrations `0001` through `0005`.
2. **Resolved:** the global evidence feed is healthy on the current release.
3. **Resolved:** migration drift is checked before hosted readiness is accepted.
4. **Partially resolved:** hosted indexer auth and monotonic progress are proven;
   fresh Quorum rows still require a new signed testnet flow.
5. **Resolved in source:** lifecycle, proof wording, and submission documents are
   aligned with current capabilities.
6. **Still external:** MoneyGram Ramps approval and successful cash pickup remain
   unproven and must not be presented as completed.

## Locked Execution Order

| Phase | Outcome | Approval checkpoint |
| --- | --- | --- |
| 1 | Restore evidence schema readiness and add migration drift guards | Production migration requires explicit approval |
| 2 | Harden indexer failure handling, cursor safety, and observability | Adding hosted cron secret requires explicit approval |
| 3 | Repair event lifecycle, dates, capacity, and demo state | No external approval for local/code changes |
| 4 | Align copy and status labels with capabilities that are actually verified | No external approval for local/code changes |
| 5 | Enforce live-settlement eligibility for MoneyGram | High-risk merge requires explicit approval |
| 6 | Rebuild submission docs, proof inventory, and judge runbook | No external approval for documentation |
| 7 | Run lint, build, smoke suites, browser QA, and responsive screenshots | Browser automation uses the approved browser workflow |
| 8 | Apply production migration, configure cron secret, and deploy approved release | Production changes remain explicit checkpoints |
| 9 | Produce fresh current-origin testnet and indexed evidence | Fresh wallet signing requires explicit approval |
| 10 | Complete final hosted verification and submit | Submission remains an explicit checkpoint |

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

## Implemented Autonomous Checkpoints

### Evidence readiness

- Merged PR: [#75](https://github.com/wildanniam/Quorum/pull/75)
- A read-only migration status command and hosted preflight guard now expose the
  missing production migration before evidence routes are exercised.
- Production migration `0005` was subsequently reviewed, approved, and applied.

### Indexer hardening

- Merged PR: [#77](https://github.com/wildanniam/Quorum/pull/77)
- Cron authentication fails closed, the cursor cannot regress, overlapping runs
  are rejected, and invalid contract events are rejected before persistence.
- A strong hosted `CRON_SECRET` is configured as sensitive for Preview and
  Production. A fresh signed testnet action remains an explicit checkpoint.

### Event lifecycle

- Merged PR: [#79](https://github.com/wildanniam/Quorum/pull/79)
- Discover, event, checkout, publish, and persistence paths now share the same
  future-safe lifecycle rules.
- The deployed contract still has no event end-time field; direct out-of-app
  purchase after the UI closes remains a documented contract limitation.

### Capability truth

- Merged PR: [#81](https://github.com/wildanniam/Quorum/pull/81)
- App references, indexed events, and explorer-valid Stellar transactions now
  have distinct labels. Configured contracts and detected wallet network are no
  longer presented as completed execution.

### MoneyGram eligibility

- Merged PR: [#83](https://github.com/wildanniam/Quorum/pull/83)
- Both UI and server require an explorer-valid settlement before the MoneyGram
  provider can be invoked. Mock mode remains explicitly local.

### Submission package and autonomous release gate

- Merged PRs: [#85](https://github.com/wildanniam/Quorum/pull/85) and
  [#87](https://github.com/wildanniam/Quorum/pull/87)
- The claim-to-proof inventory, judge runbook, readiness matrix, and historical
  evidence boundaries now agree.
- `npm run submission:gate` owns the complete non-destructive source check list,
  including the browser-QA localhost database guard. On the current evidence PR,
  only source-readiness waits for regenerated evidence provenance.
- The isolated localhost PostgreSQL gate passes migration, seed, database,
  wallet-auth, lifecycle, settlement, flow, and persistence checks.
- The initial release stack from #75 through #87 is merged into `main` with green GitHub
  and Vercel checks.

### Hosted release checkpoint

- Merged PR: [#89](https://github.com/wildanniam/Quorum/pull/89)

- Production migration status is ready with all five migrations applied.
- The captured operational release is `READY` on Vercel and `/evidence` is
  healthy. The evidence is an immutable checkpoint, not a promise that its
  deployment ID will always remain behind the public alias.
- `CRON_SECRET` is configured as sensitive; its value is not recorded.
- Missing indexer authorization returns HTTP 401.
- Three authenticated runs completed without error and advanced both cursor and
  latest-ledger state, including the scheduled Vercel Cron run.
- The canonical machine-readable record is
  `docs/HOSTED_RELEASE_EVIDENCE.json`.

### Final browser QA and evidence lineage

- Merged PRs: [#91](https://github.com/wildanniam/Quorum/pull/91) and
  [#94](https://github.com/wildanniam/Quorum/pull/94)
- The isolated browser suite covers 13 routes across desktop, tablet, and mobile
  viewports, for 39 checked states without horizontal overflow or console errors.
- Evidence lineage accepts the generated-evidence parent and normal merge path
  while rejecting stale source snapshots.
- The current verifier-only evidence PR must regenerate provenance before its
  source-readiness gate can pass; this does not reopen the completed visual QA.

## Event Lifecycle Acceptance

- Lifecycle is derived as draft, upcoming, live, or ended without a new database
  migration.
- Discover queries only published events whose end time is still in the future.
- Ended event and checkout pages remain readable but cannot start a wallet action.
- Local proof persistence and live transaction preparation reject ended-event
  checkout, and publish paths reject already-ended drafts.
- Demo seed and integration smoke dates are future-safe instead of hard-coded to
  the hackathon week.
- `event:lifecycle:smoke`, lint, and build pass. DB-backed smoke additions are
  present but require an isolated writable Postgres instance before execution.

## Current External Dependencies

- MoneyGram allowlist approval: pending; Quorum can show integration readiness,
  but not a completed cash-out.
- Fresh testnet transaction: needed because RPC event retention cannot recover old
  contract events indefinitely.
- Final browser QA: complete on the final candidate with 13 routes across three
  viewports; this remains local isolated QA, not hosted signing evidence. The
  current verifier-only PR still needs a provenance refresh after its final
  source commit is locked.
- Final submission: remains an explicit Wildan approval checkpoint.

## Submission Source Of Truth

- Current readiness: `docs/MVP_READINESS.md`
- Claim-to-proof map: `docs/HACKATHON_PROOF_INVENTORY.md`
- Judge sequence: `docs/HACKATHON_DEMO_RUNBOOK.md`
- Historical live app flow: `docs/LIVE_TESTNET_EVIDENCE.json`
- Historical deployment evidence: `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`
- Hosted release checkpoint: `docs/HOSTED_RELEASE_EVIDENCE.json`

## Autonomous Release Gate

- `npm run submission:gate` is the non-destructive source gate.
- `npm run submission:hosted:probe` checks only public GET routes and contract
  status; it never calls mutation, cron, signing, or provider endpoints.
- `npm run submission:db:gate` runs DB-backed integration smokes sequentially
  only when `QUORUM_RELEASE_DATABASE_URL` points to disposable localhost
  Postgres. The command rejects hosted and production database hosts.
- DB-backed integration remains separate from the default source gate because
  it migrates and seeds its explicitly isolated writable database.
- Production migration, hosted cron auth, and release deployment are complete.
- Browser QA is complete. Fresh Freighter/indexer evidence, MoneyGram provider
  execution, and final submission remain explicit checkpoints.
