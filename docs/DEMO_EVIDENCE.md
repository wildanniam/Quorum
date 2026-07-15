# Quorum Demo Evidence

Generated at: `2026-07-15T16:48:18.000Z`

> Command-level verification snapshot for the source state below. It does not
> prove current hosted database health, indexer execution, wallet signing, or
> MoneyGram provider completion.

## Source State

- Branch: `main`
- Commit: `7cfe0be`
- Working tree when collected, excluding this generated evidence file:

```text
(clean)
```

## Browser QA Provenance

- Mode: `reused-unchanged-inputs`
- Browser evidence commit: `f935e000da12b913648758ac99b61f82e46f2fa5`
- Browser source commit: `fb0c68e3624156f6b1bb9eda0f74b72c11117f65`
- Current input fingerprint: `9b2318ced0e6353d70895506b157275d769a0b6b24b5addfa2ab3bd897471faf`
- Changed browser input files: `0`

## Local Verification Summary

| Check | Command | Status | Exit |
|---|---|---:|---:|
| DB migrate | `npm run db:migrate` | PASS | 0 |
| DB seed | `npm run db:seed` | PASS | 0 |
| DB smoke | `npm run db:smoke` | PASS | 0 |
| Lint | `npm run lint` | PASS | 0 |
| Build | `npm run build` | PASS | 0 |
| Audit | `npm audit --audit-level=moderate` | PASS | 0 |
| Wallet auth smoke | `npm run wallet:auth:smoke` | PASS | 0 |
| API origin smoke | `npm run api:origin:smoke` | PASS | 0 |
| Demo smoke | `npm run demo:smoke` | PASS | 0 |
| Event lifecycle smoke | `npm run event:lifecycle:smoke` | PASS | 0 |
| Product messaging smoke | `npm run product:messaging:smoke` | PASS | 0 |
| Anchor config smoke | `npm run anchor:config:smoke` | PASS | 0 |
| Anchor eligibility smoke | `npm run anchor:eligibility:smoke` | PASS | 0 |
| Live policy smoke | `npm run demo:live-policy` | PASS | 0 |
| Settlement smoke | `npm run settlement:smoke` | PASS | 0 |
| Indexer security smoke | `npm run indexer:security:smoke` | PASS | 0 |
| Browser QA | `npm run browser:qa:provenance` | PASS | 0 |
| Browser QA provenance smoke | `npm run browser:qa:provenance:smoke` | PASS | 0 |
| Evidence lineage smoke | `npm run evidence:lineage:smoke` | PASS | 0 |
| Deploy env smoke | `npm run deploy:env:smoke` | PASS | 0 |
| Deploy hosted preflight smoke | `npm run deploy:hosted:preflight:smoke` | PASS | 0 |
| Live args smoke | `npm run live:args:smoke` | PASS | 0 |
| Live flow smoke | `npm run live:flow:smoke` | PASS | 0 |
| Live persistence smoke | `npm run live:persistence:smoke` | PASS | 0 |
| Live preflight smoke | `npm run live:preflight:smoke` | PASS | 0 |
| Live readiness smoke | `npm run live:readiness:smoke` | PASS | 0 |
| Live signing smoke | `npm run live:signing:smoke` | PASS | 0 |
| Live submission smoke | `npm run live:submission:smoke` | PASS | 0 |
| Live XDR smoke | `npm run live:xdr:smoke` | PASS | 0 |
| Live evidence template | `npm run live:evidence:template` | PASS | 0 |
| Live evidence audit smoke | `npm run live:evidence:audit:smoke` | PASS | 0 |
| Live evidence network smoke | `npm run live:evidence:network:smoke` | PASS | 0 |
| Live deployment validation | `npm run live:deployment:validate` | PASS | 0 |
| Live browser flow smoke | `npm run live:browser-flow:smoke` | PASS | 0 |
| Live UI wiring smoke | `npm run live:ui-wiring:smoke` | PASS | 0 |
| Contract tests | `npm run contracts:test` | PASS | 0 |
| Contract build | `npm run contracts:build` | PASS | 0 |
| Contract approval smoke | `npm run contracts:approval:smoke` | PASS | 0 |
| Contract doctor | `npm run contracts:doctor` | PASS | 0 |
| Submission package smoke | `npm run submission:package:smoke` | PASS | 0 |

Overall local verification: **PASS**

## Demo Smoke Coverage

Event ID: `evt_apac_stellar_builder_meetup`

Generated pass token ID: `qpass-apac-stellar-builder-meetup-0001-e06897`

Covered checks:

- marketplace
- event-detail
- draft-validation
- publish-lifecycle
- expired-publish-guard
- contract-status
- payment-asset-status
- contract-action-policy
- checkout
- duplicate-checkout-guard
- free-claim
- duplicate-free-claim-guard
- resource-gating
- organizer-check-in
- duplicate-check-in-guard
- proof-labels
- collaborator-withdraw
- duplicate-withdraw-guard
- ended-checkout-guard
- ended-event-ui
- discover-ended-filter
- pass-page
- dashboard-proof
- dashboard-payment-asset-readiness
- dashboard-action-policy

## Contract Coverage Evidence

These targeted contract tests verify Soroban proof events and are expected in
the `npm run contracts:test` output:

- emits_core_and_pass_proof_events
- set_core_emits_event

## Contract Artifacts

| Contract | WASM | Exists | Size bytes | SHA-256 |
|---|---|---:|---:|---|
| QuorumCore | `target/wasm32v1-none/release/quorum_core.wasm` | yes | 14247 | `73ad1844be4fbcf16c76206b18461b020c68c6e230e4fb8b37d50e2dcddb2ac0` |
| QuorumPassNFT | `target/wasm32v1-none/release/quorum_pass_nft.wasm` | yes | 5467 | `e78624a8bf8dbb1babdf808ff38bc29053fe8a91c3761ee64c519983797202ec` |

## Contract Tooling Readiness

- Ready to deploy: `true`
- RPC reachable: `true`
- Deploy network: `testnet`
- App RPC: `https://soroban-testnet.stellar.org`
- Payment asset configured: `true`
- Platform fee bps: `0`
- Live signing approved: `true`
- Signing approval gate: `QUORUM_LIVE_SIGNING_APPROVED=I_APPROVE_TESTNET_SIGNING`
- Stellar CLI: `stellar 26.0.0`
- Rust: `rustc 1.95.0 (59807616e 2026-04-14)`
- Cargo: `cargo 1.95.0 (f2d3ce0bd 2026-03-21)`

Blockers:

- None reported by contracts:doctor.

Warnings:

- None reported by contracts:doctor.

## Hosted Evidence Boundary

This command does not deploy contracts, mutate hosted configuration, sign a
wallet transaction, run the hosted indexer, or prove the current Vercel origin.
Use `docs/HACKATHON_PROOF_INVENTORY.md` for release-level status.

## Command Details

### DB migrate

- Command: `npm run db:migrate`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 db:migrate
> node scripts/db-migrate.mjs
{
  "databaseUrl": "postgresql://REDACTED:REDACTED@127.0.0.1:55432/quorum_evidence",
  "schema": "public",
  "applied": [
    "0001_initial_schema.sql",
    "0002_live_proof_uniqueness.sql",
    "0003_indexer_evidence_ledger.sql",
    "0004_anchor_payouts.sql",
    "0005_anchor_cashout_proof.sql"
  ],
  "totalMigrations": 5
}
```

### DB seed

- Command: `npm run db:seed`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 db:seed
> node scripts/db-seed.mjs
{
  "seededEventId": "evt_apac_stellar_builder_meetup",
  "seededFreeEventId": "evt_stellar_open_office_hours",
  "publishedCount": 2
}
```

### DB smoke

- Command: `npm run db:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 db:smoke
> node scripts/db-smoke.mjs
{
  "event": {
    "id": "evt_8f020e35-a04b-43fb-9928-d7d514c44aa9",
    "slug": "smoke-8f020e35",
    "status": "draft"
  },
  "splitTotal": 100,
  "resourceCount": 1,
  "cleanedUp": true,
  "checks": [
    "unique-live-proof-indexes",
    "live-proof-hash-registry",
    "indexer-tables",
    "anchor-cashout-proof-column",
    "anchor-cashout-proof-index",
    "event-crud",
    "collaborator-split-total",
    "resource-crud",
    "cascade-cleanup"
  ]
}
```

### Lint

- Command: `npm run lint`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 lint
> eslint
```

### Build

- Command: `npm run build`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 build
> next build
▲ Next.js 16.2.7 (Turbopack)
- Environments: .env.local
  Creating an optimized production build ...
✓ Compiled successfully in 2.8s
  Running TypeScript ...
  Finished TypeScript in 3.4s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/15) ...
  Generating static pages using 7 workers (3/15)
  Generating static pages using 7 workers (7/15)
  Generating static pages using 7 workers (11/15)
✓ Generating static pages using 7 workers (15/15) in 194ms
  Finalizing page optimization ...
Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /.well-known/stellar.toml
├ ƒ /api/anchor/moneygram/auth/challenge
├ ƒ /api/anchor/moneygram/auth/token
├ ƒ /api/anchor/moneygram/payouts/[payoutId]/sync
├ ƒ /api/auth/challenge
├ ƒ /api/auth/logout
├ ƒ /api/auth/verify
├ ƒ /api/contracts/status
├ ƒ /api/events
├ ƒ /api/events/[eventId]
├ ƒ /api/events/[eventId]/anchor-payouts
├ ƒ /api/events/[eventId]/check-ins
├ ƒ /api/events/[eventId]/contract-action
├ ƒ /api/events/[eventId]/contract-action/preflight
├ ƒ /api/events/[eventId]/passes
├ ƒ /api/events/[eventId]/publish
├ ƒ /api/events/[eventId]/withdrawals
├ ƒ /api/indexer/stellar-events
├ ƒ /api/me
├ ƒ /check-in/[eventId]
├ ƒ /dashboard
├ ○ /dashboard/events/new
├ ƒ /dashboard/ledger
├ ƒ /discover
├ ƒ /events/[slug]
├ ƒ /events/[slug]/checkout
├ ƒ /events/[slug]/proof
├ ƒ /events/[slug
... [truncated]
```

### Audit

- Command: `npm audit --audit-level=moderate`
- Exit code: `0`
- Status: **PASS**

```text
found 0 vulnerabilities
```

### Wallet auth smoke

- Command: `npm run wallet:auth:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 wallet:auth:smoke
> node scripts/wallet-auth-smoke.mjs
{
  "ok": true,
  "baseUrl": "http://127.0.0.1:3042",
  "walletAddress": "GBKWWEBYPMY3RAOZT6WUH55KO5FICGRWLADE5BOTSESDQ6EWT33Q722Y",
  "checks": [
    "reject-invalid-wallet-challenge-request",
    "issue-wallet-bound-challenge-cookie",
    "encode-multiline-challenge-cookie",
    "verify-signed-wallet-challenge",
    "set-wallet-session-cookie",
    "me-reads-wallet-session",
    "logout-clears-wallet-session"
  ]
}
```

### API origin smoke

- Command: `npm run api:origin:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 api:origin:smoke
> tsx scripts/mutation-origin-smoke.ts
{
  "ok": true,
  "checks": [
    "allow-same-origin-mutation",
    "allow-missing-origin-mutation",
    "allow-forwarded-same-origin-mutation",
    "reject-cross-origin-mutation",
    "reject-invalid-origin-mutation",
    "all-mutation-routes-use-origin-guard"
  ],
  "guardedRoutes": 14
}
```

### Demo smoke

- Command: `npm run demo:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 demo:smoke
> node scripts/demo-smoke.mjs
{
  "ok": true,
  "baseUrl": "http://127.0.0.1:3035",
  "databaseSchema": "quorum_demo_smoke_15c353e7_f919_4f4d_8988_511042c8ff3a",
  "eventId": "evt_apac_stellar_builder_meetup",
  "tokenId": "qpass-apac-stellar-builder-meetup-0001-e06897",
  "checks": [
    "marketplace",
    "event-detail",
    "draft-validation",
    "publish-lifecycle",
    "expired-publish-guard",
    "contract-status",
    "payment-asset-status",
    "contract-action-policy",
    "checkout",
    "duplicate-checkout-guard",
    "free-claim",
    "duplicate-free-claim-guard",
    "resource-gating",
    "organizer-check-in",
    "duplicate-check-in-guard",
    "proof-labels",
    "collaborator-withdraw",
    "duplicate-withdraw-guard",
    "ended-checkout-guard",
    "ended-event-ui",
    "discover-ended-filter",
    "pass-page",
    "dashboard-proof",
    "dashboard-payment-asset-readiness",
    "dashboard-action-policy"
  ]
}
```

### Event lifecycle smoke

- Command: `npm run event:lifecycle:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 event:lifecycle:smoke
> tsx scripts/event-lifecycle-smoke.ts
Event lifecycle smoke passed.
```

### Product messaging smoke

- Command: `npm run product:messaging:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 product:messaging:smoke
> tsx scripts/product-messaging-smoke.ts
{
  "ok": true,
  "checks": [
    "classify-only-explorer-valid-hashes-as-live",
    "separate-app-reference-from-live-transaction",
    "separate-configured-contracts-from-proven-execution",
    "label-wallet-network-as-detected",
    "disclose-moneygram-provider-dependency",
    "block-moneygram-ui-for-local-settlement-proof",
    "label-mock-anchor-as-demo"
  ]
}
```

### Anchor config smoke

- Command: `npm run anchor:config:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 anchor:config:smoke
> tsx scripts/anchor-config-smoke.ts
{
  "checks": [
    "default-mock-provider",
    "moneygram-env-normalization",
    "moneygram-signing-secret-required",
    "reject-invalid-provider",
    "reject-domain-paths",
    "reject-invalid-signing-public-key",
    "reject-invalid-signing-secret",
    "reject-invalid-timeout"
  ],
  "ok": true
}
```

### Anchor eligibility smoke

- Command: `npm run anchor:eligibility:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 anchor:eligibility:smoke
> tsx scripts/anchor-payout-eligibility-smoke.ts
{
  "ok": true,
  "checks": [
    "allow-live-settlement-for-moneygram",
    "reject-local-settlement-for-moneygram",
    "reject-missing-settlement-for-moneygram",
    "preserve-local-proof-for-mock-provider",
    "enforce-eligibility-before-provider-invocation"
  ]
}
```

### Live policy smoke

- Command: `npm run demo:live-policy`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 demo:live-policy
> node scripts/live-policy-smoke.mjs
{
  "ok": true,
  "baseUrl": "http://127.0.0.1:3036",
  "fakeCoreContractId": "CADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQP5KR",
  "fakePassContractId": "CAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQMCJ",
  "fakeUsdcContractId": "CAEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQTD2L",
  "mutationCounts": {
    "checkIns": 0,
    "passes": 0,
    "purchases": 0,
    "withdrawals": 0
  },
  "checks": [
    "live-contract-status",
    "live-payment-asset-status",
    "dashboard-live-action-policy",
    "prepare-publish-live-args",
    "prepare-checkout-live-args",
    "prepare-checkout-unsigned-xdr",
    "preflight-route-invalid-request",
    "prepare-check-in-live-args",
    "prepare-withdraw-live-args",
    "submit-invalid-signed-xdr-no-persistence",
    "publish-live-required",
    "checkout-live-required",
    "check-in-live-required",
    "check-in-short-live-token-required",
    "withdraw-live-required",
    "no-local-proof-mutations",
    "ended-live-checkout-guard"
  ]
}
```

### Settlement smoke

- Command: `npm run settlement:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 settlement:smoke
> tsx scripts/settlement-smoke.ts
{
  "checks": [
    "indexer-schema",
    "indexer-idempotent-ingest",
    "indexer-state-cursor",
    "indexer-failure-preserves-state",
    "indexer-latest-ledger-monotonic",
    "indexer-concurrent-run-lock",
    "indexer-rejects-unconfigured-contract",
    "global-event-evidence-read-model",
    "event-proof-filter",
    "stellar-explorer-links",
    "collaborator-credit-ledger",
    "collaborator-debit-ledger",
    "collaborator-withdrawable-balance",
    "settlement-backed-anchor-opportunity",
    "duplicate-active-cashout-rejected",
    "failed-cashout-retry-reuses-record",
    "separate-anchor-transfer-proof",
    "single-contract-withdrawal"
  ],
  "evidenceKinds": [
    "anchor_payout",
    "check_in",
    "indexed_event",
    "paid_checkout",
    "publish",
    "withdrawal"
  ],
  "indexedEvents": 4,
  "ledgerEntries": 2,
  "summary": {
    "totalEarnedUsdc": "3",
    "totalWithdrawnUsdc": "3",
    "withdrawableUsdc": "0",
    "eventCount": 1,
    "entryCount": 2
  }
}
```

### Indexer security smoke

- Command: `npm run indexer:security:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 indexer:security:smoke
> tsx scripts/indexer-security-smoke.ts
{
  "ok": true,
  "checks": [
    "reject-missing-indexer-cron-secret",
    "reject-weak-indexer-cron-secret",
    "reject-invalid-indexer-bearer",
    "accept-valid-indexer-bearer",
    "reject-indexer-cron-secret-line-breaks",
    "validate-indexer-run-parameters",
    "preserve-monotonic-indexer-checkpoint",
    "indexer-route-fails-closed",
    "indexer-route-rejects-invalid-query"
  ]
}
```

### Browser QA

- Command: `npm run browser:qa:provenance`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 browser:qa:provenance
> node scripts/browser-qa-provenance.mjs
{
  "ok": true,
  "mode": "reuse-browser-proof",
  "browserEvidenceCommit": "f935e000da12b913648758ac99b61f82e46f2fa5",
  "browserSourceCommit": "fb0c68e3624156f6b1bb9eda0f74b72c11117f65",
  "currentCommit": "7cfe0be242b697607d467236381dc53aa04ae130",
  "trackedInputCount": 153,
  "sourceInputFingerprint": "9b2318ced0e6353d70895506b157275d769a0b6b24b5addfa2ab3bd897471faf",
  "currentInputFingerprint": "9b2318ced0e6353d70895506b157275d769a0b6b24b5addfa2ab3bd897471faf",
  "changedInputFiles": [],
  "browserDocumentMatches": true,
  "browserDocumentSha256": "c72094bc09226a1fb616c37cbb2ffc3be341ba99fd5d585861cbeb081a246bc4",
  "boundary": "This proves the recorded local browser result still applies to an identical UI/QA input tree. It does not rerun a browser or prove hosted wallet, indexer, or provider behavior."
}
```

### Browser QA provenance smoke

- Command: `npm run browser:qa:provenance:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 browser:qa:provenance:smoke
> node scripts/browser-qa-provenance-smoke.mjs
{
  "ok": true,
  "scenarios": [
    "unchanged inputs with script-only package metadata",
    "dirty browser input rejection",
    "committed browser input rejection",
    "runtime dependency rejection",
    "browser document mutation rejection",
    "mixed source and evidence commit rejection"
  ]
}
```

### Evidence lineage smoke

- Command: `npm run evidence:lineage:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 evidence:lineage:smoke
> node scripts/evidence-lineage-smoke.mjs
{
  "ok": true,
  "checks": [
    "accept-generated-only-status",
    "reject-mixed-status",
    "accept-current-code-head",
    "accept-generated-evidence-parent",
    "accept-generated-evidence-through-merge",
    "reject-stale-pre-squash-source"
  ]
}
```

### Deploy env smoke

- Command: `npm run deploy:env:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 deploy:env:smoke
> tsx scripts/deploy-env-smoke.ts
{
  "ok": true,
  "checks": [
    "reject-missing-production-session-secret",
    "reject-placeholder-production-session-secret",
    "reject-local-fallback-production-session-secret",
    "reject-short-production-session-secret",
    "accept-valid-production-session-secret",
    "local-session-token-roundtrip",
    "reject-extra-segment-session-token",
    "reject-invalid-session-wallet",
    "reject-expired-session-token",
    "reject-future-session-token",
    "accept-current-wallet-bound-challenge",
    "reject-expired-wallet-challenge",
    "reject-future-wallet-challenge",
    "reject-wallet-mismatched-challenge",
    "reject-malformed-wallet-challenge"
  ]
}
```

### Deploy hosted preflight smoke

- Command: `npm run deploy:hosted:preflight:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 deploy:hosted:preflight:smoke
> tsx scripts/hosted-deployment-preflight.ts --smoke
{
  "ok": true,
  "mode": "smoke",
  "checks": [
    "hosted-url-public-https",
    "production-session-secret-present",
    "server-postgres-database-url-present",
    "database-migrations-current",
    "hosted-indexer-cron-secret-ready",
    "hosted-anchor-client-domain-matches-url",
    "hosted-stellar-toml-signing-key-matches-anchor-env",
    "moneygram-sep1-discovery-ready",
    "moneygram-sep24-usdc-withdraw-ready",
    "runtime-env-matches-deployment-evidence",
    "operator-signing-env-absent",
    "browser-supabase-env-absent",
    "contract-status-live-proof-mode",
    "contract-status-rpc-reachable",
    "contract-status-actions-live-required",
    "reject-localhost-hosted-url",
    "reject-contract-id-mismatch",
    "reject-operator-signing-env",
    "reject-invalid-production-session-secret",
    "reject-missing-indexer-cron-secret",
    "reject-weak-indexer-cron-secret",
    "reject-non-postgres-database-url",
    "reject-hosted-postgres-url-without-sslmode",
    "reject-browser-supabase-env",
    "reject-supabase-service-role-env",
    "reject-local-contract-status",
    "reject-non-live-action-policy",
    "reject-anchor-client-domain-mismatch",
    "reject-hosted-stellar-toml-signing-key-mismatch",
    "reject-missing-database-migration"
  ]
}
```

### Live args smoke

- Command: `npm run live:args:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:args:smoke
> tsx scripts/live-args-smoke.ts
{
  "ok": true,
  "eventIdHex": "a7e602bb740076b86ae7a7f4d23b6738bc9eddf6d600ca67db3b72fe8d20aa67",
  "priceAtomic": "50000000",
  "splitBps": [
    7000,
    2000,
    1000
  ],
  "purchaseAmountAtomic": "50000000",
  "checks": [
    "usdc-atomic-conversion",
    "usdc-decimal-conversion",
    "event-id-derivation",
    "create-event-args",
    "purchase-args",
    "free-purchase-args",
    "check-in-args",
    "withdraw-args",
    "invalid-live-args"
  ]
}
```

### Live flow smoke

- Command: `npm run live:flow:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:flow:smoke
> tsx scripts/live-flow-smoke.ts
{
  "ok": true,
  "checks": [
    "prepare-action-from-db-state",
    "preflight-before-signing",
    "freighter-signing-options",
    "submit-and-poll-finality",
    "publish-live-flow",
    "checkout-live-flow",
    "free-claim-live-flow",
    "check-in-live-flow",
    "withdraw-live-flow",
    "decode-token-id-from-finality",
    "decode-withdraw-amount-from-finality",
    "persist-live-result-helper",
    "reject-mismatched-live-result",
    "persist-after-success-only",
    "reject-finality-failure-without-persistence"
  ],
  "databaseSchema": "quorum_live_flow_smoke_51d34c91_786d_48c8_8341_a3ba925a1374",
  "persistedEventId": "evt_e0a9fa2e-9567-4682-a73f-3eea1249b253",
  "persistedTokenId": "9001",
  "persistedFreeTokenId": "9002",
  "persistedWithdrawUsdc": "2.8",
  "txHashes": [
    "1515151515151515151515151515151515151515151515151515151515151515",
    "1616161616161616161616161616161616161616161616161616161616161616",
    "1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a",
    "1717171717171717171717171717171717171717171717171717171717171717",
    "1818181818181818181818181818181818181818181818181818181818181818"
  ]
}
```

### Live persistence smoke

- Command: `npm run live:persistence:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:persistence:smoke
> tsx scripts/live-persistence-smoke.ts
{
  "ok": true,
  "databaseSchema": "quorum_live_persistence_smoke_a78d4a44_ed85_40c3_88ed_ba4479d42a5a",
  "checks": [
    "record-live-publish",
    "record-live-pass",
    "record-live-check-in",
    "record-live-withdrawal",
    "reject-stub-live-hash",
    "reject-duplicate-live-publish-tx",
    "reject-duplicate-live-pass-tx",
    "reject-cross-table-live-hash-replay",
    "reject-duplicate-live-check-in",
    "reject-duplicate-live-check-in-tx",
    "reject-live-withdrawal-overdraw",
    "reject-duplicate-live-withdrawal-tx",
    "no-stub-live-records"
  ]
}
```

### Live preflight smoke

- Command: `npm run live:preflight:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:preflight:smoke
> tsx scripts/live-preflight-smoke.ts
{
  "ok": true,
  "checks": [
    "fetch-source-account",
    "build-raw-live-transaction",
    "prepare-transaction-for-signing",
    "prepared-xdr-parseable",
    "preflight-error-normalization"
  ],
  "functionName": "purchase",
  "preparedXdrLength": 556,
  "sourceSequence": "123456789"
}
```

### Live readiness smoke

- Command: `npm run live:readiness:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:readiness:smoke
> tsx scripts/live-readiness-smoke.ts
{
  "ok": true,
  "checks": [
    "accept-testnet-live-readiness",
    "reject-non-testnet-live-readiness",
    "reject-mismatched-testnet-passphrase"
  ]
}
```

### Live signing smoke

- Command: `npm run live:signing:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:signing:smoke
> tsx scripts/live-signing-smoke.ts
{
  "ok": true,
  "checks": [
    "freighter-sign-transaction-options",
    "reject-mainnet-freighter-before-signing",
    "signed-xdr-parseable",
    "reject-signer-mismatch",
    "normalize-wallet-rejection",
    "reject-invalid-prepared-xdr",
    "reject-prepared-xdr-function-mismatch-before-wallet",
    "reject-prepared-xdr-contract-mismatch-before-wallet",
    "reject-prepared-xdr-argument-mismatch-before-wallet",
    "reject-signed-xdr-function-mismatch",
    "reject-signed-xdr-argument-mismatch"
  ],
  "signedXdrLength": 556,
  "signerAddress": "GACAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAJJHP"
}
```

### Live submission smoke

- Command: `npm run live:submission:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:submission:smoke
> tsx scripts/live-submission-smoke.ts
{
  "ok": true,
  "checks": [
    "submit-signed-transaction",
    "poll-until-success",
    "accept-duplicate-submission-status",
    "decode-purchase-token-id",
    "decode-withdraw-amount",
    "reject-source-mismatch-before-rpc",
    "reject-function-mismatch-before-rpc",
    "reject-contract-mismatch-before-rpc",
    "reject-argument-mismatch-before-rpc",
    "reject-submission-error",
    "reject-submission-retry-later",
    "reject-finality-failure",
    "reject-finality-timeout",
    "reject-missing-return-value",
    "reject-wrong-return-value-type"
  ],
  "ledger": 42,
  "pollCalls": 2,
  "tokenId": "9001",
  "txHash": "1313131313131313131313131313131313131313131313131313131313131313"
}
```

### Live XDR smoke

- Command: `npm run live:xdr:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:xdr:smoke
> tsx scripts/live-xdr-smoke.ts
{
  "ok": true,
  "checks": [
    "create-event-xdr",
    "purchase-xdr",
    "check-in-xdr",
    "withdraw-xdr",
    "invocation-args-xdr",
    "split-recipient-symbol-map",
    "invalid-source-sequence"
  ],
  "results": [
    {
      "action": "publish_event",
      "argCount": 9,
      "functionName": "create_event",
      "xdrLength": 816
    },
    {
      "action": "checkout_pass",
      "argCount": 5,
      "functionName": "purchase",
      "xdrLength": 556
    },
    {
      "action": "check_in_pass",
      "argCount": 3,
      "functionName": "check_in",
      "xdrLength": 336
    },
    {
      "action": "withdraw_balance",
      "argCount": 2,
      "functionName": "withdraw",
      "xdrLength": 320
    }
  ]
}
```

### Live evidence template

- Command: `npm run live:evidence:template`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:evidence:template
> node scripts/live-evidence-audit.mjs
{
  "ok": true,
  "mode": "template",
  "evidencePath": "/Users/wildanniam/Development/project/Quorum/docs/LIVE_TESTNET_EVIDENCE.example.json",
  "requireFilled": false,
  "requireCurrentOrigin": false,
  "expectedOrigin": null,
  "liveEvidenceComplete": false,
  "checkedFields": 60,
  "failures": []
}
```

### Live evidence audit smoke

- Command: `npm run live:evidence:audit:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:evidence:audit:smoke
> node scripts/live-evidence-audit-smoke.mjs
{
  "ok": true,
  "checks": [
    "accept-filled-live-evidence",
    "reject-filled-live-evidence-placeholder",
    "reject-filled-live-evidence-local-url",
    "reject-filled-live-evidence-duplicate-tx",
    "reject-filled-live-evidence-token-mismatch",
    "reject-filled-live-evidence-origin-mismatch",
    "reject-filled-live-evidence-duplicate-publish-url",
    "reject-filled-live-evidence-zero-withdraw",
    "accept-current-origin-live-evidence",
    "reject-wrong-current-origin",
    "reject-stale-current-origin-evidence",
    "reject-wrong-final-paid-price",
    "reject-regressed-indexer-cursor",
    "reject-missing-indexed-transaction"
  ]
}
```

### Live evidence network smoke

- Command: `npm run live:evidence:network:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:evidence:network:smoke
> node scripts/live-evidence-network-smoke.mjs
{
  "ok": true,
  "checks": [
    "accept-valid-horizon-final-flow",
    "reject-wrong-contract-function",
    "reject-wrong-paid-amount",
    "reject-missing-withdraw-effects",
    "reject-wrong-signer",
    "reject-stale-transaction"
  ]
}
```

### Live deployment validation

- Command: `npm run live:deployment:validate`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:deployment:validate
> node scripts/live-deployment-validate.mjs
{
  "ok": true,
  "evidencePath": "docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json",
  "network": "TESTNET",
  "contracts": {
    "passContractId": "CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH",
    "coreContractId": "CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV",
    "usdcContractId": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    "passWasmHash": "e78624a8bf8dbb1babdf808ff38bc29053fe8a91c3761ee64c519983797202ec",
    "coreWasmHash": "73ad1844be4fbcf16c76206b18461b020c68c6e230e4fb8b37d50e2dcddb2ac0",
    "platformFeeBps": 0
  },
  "checks": [
    "static-evidence-shape",
    "horizon-admin-transaction-window",
    "decoded-init-and-set-core-parameters",
    "rpc-set-core-event",
    "stellar-cli-contract-interfaces",
    "recorded-read-only-validation-evidence"
  ],
  "failures": [],
  "warnings": [
    "set_core event RPC lookup skipped because the recorded deployment ledger is outside the current Stellar RPC retention window."
  ]
}
```

### Live browser flow smoke

- Command: `npm run live:browser-flow:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:browser-flow:smoke
> tsx scripts/live-browser-flow-smoke.ts
{
  "ok": true,
  "checks": [
    "browser-live-preflight-sign-submit",
    "browser-live-signer-options",
    "browser-live-submit-signed-xdr",
    "browser-live-preflight-error",
    "browser-live-submit-error",
    "browser-live-reject-mismatched-preflight",
    "browser-live-reject-mismatched-preflight-args"
  ],
  "txHash": "1515151515151515151515151515151515151515151515151515151515151515"
}
```

### Live UI wiring smoke

- Command: `npm run live:ui-wiring:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 live:ui-wiring:smoke
> node scripts/live-ui-wiring-smoke.mjs
{
  "ok": true,
  "checks": [
    "browser-helper-preflight-submit-routes",
    "publish-live-ui-wiring",
    "checkout-live-ui-wiring",
    "check-in-live-ui-wiring",
    "withdraw-live-ui-wiring"
  ]
}
```

### Contract tests

- Command: `npm run contracts:test`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 contracts:test
> cargo test
running 19 tests
test test::demo_zero_fee_routes_full_amount_to_collaborators ... ok
test test::purchase_mints_pass_and_splits_balance ... ok
test test::organizer_can_check_in_pass ... ok
test test::emits_core_and_pass_proof_events ... ok
test test::collaborator_can_withdraw_balance ... ok
test test::duplicate_check_in_is_idempotent ... ok
test test::free_event_claim_mints_pass_without_balances ... ok
test test::admin_can_withdraw_platform_fee ... ok
test test::rejects_invalid_split_total - should panic ... ok
test test::rejects_check_in_for_unknown_token - should panic ... ok
test test::rejects_free_claim_with_nonzero_amount - should panic ... ok
test test::rejects_duplicate_free_claim - should panic ... ok
test test::rejects_check_in_from_non_organizer - should panic ... ok
test test::rejects_free_claim_when_capacity_is_full - should panic ... ok
test test::rejects_duplicate_purchase - should panic ... ok
test test::rejects_check_in_for_token_from_another_event - should panic ... ok
test test::rejects_paid_purchase_with_wrong_amount - should panic ... ok
test test::rejects_withdraw_without_balance - should panic ... ok
test test::rejects_paid_purchase_when_capacity_is_full - should panic ... ok
test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.48s
running 7 tests
test test::set_core_emits_even
... [truncated]
```

### Contract build

- Command: `npm run contracts:build`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 contracts:build
> stellar contract build
ℹ️  CARGO_BUILD_RUSTFLAGS=--remap-path-prefix=/Users/wildanniam/.cargo/registry/src= SOROBAN_SDK_BUILD_SYSTEM_SUPPORTS_SPEC_SHAKING_V2=1 cargo rustc --manifest-path=contracts/quorum_core/Cargo.toml --crate-type=cdylib --target=wasm32v1-none --release
    Finished `release` profile [optimized] target(s) in 0.12s
ℹ️  Build Summary:
    Wasm File: target/wasm32v1-none/release/quorum_core.wasm (14247 bytes)
    Wasm Hash: 73ad1844be4fbcf16c76206b18461b020c68c6e230e4fb8b37d50e2dcddb2ac0
    Wasm Size: 14247 bytes
    Exported Functions: 12 found
      • admin_withdraw
      • check_in
      • collaborator_balance
      • create_event
      • get_event
      • get_splits
      • has_purchased
      • init
      • is_checked_in
      • platform_balance
      • purchase
      • withdraw
✅ Build Complete
ℹ️  CARGO_BUILD_RUSTFLAGS=--remap-path-prefix=/Users/wildanniam/.cargo/registry/src= SOROBAN_SDK_BUILD_SYSTEM_SUPPORTS_SPEC_SHAKING_V2=1 cargo rustc --manifest-path=contracts/quorum_pass_nft/Cargo.toml --crate-type=cdylib --target=wasm32v1-none --release
    Finished `release` profile [optimized] target(s) in 0.07s
ℹ️  Build Summary:
    Wasm File: target/wasm32v1-none/release/quorum_pass_nft.wasm (5467 bytes)
    Wasm Hash: e78624a8bf8dbb1babdf808ff38bc29053fe8a91c3761ee64c519983797202ec
    Wasm Size: 5467 bytes
    Exported Func
... [truncated]
```

### Contract approval smoke

- Command: `npm run contracts:approval:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 contracts:approval:smoke
> node scripts/contracts/live-signing-approval-smoke.mjs
{
  "ok": true,
  "checks": [
    "approval-helper-default-deny",
    "approval-helper-exact-phrase",
    "fee-policy-helper-default-deny",
    "fee-policy-helper-exact-phrase",
    "parse-contract-id-from-cli-output",
    "reject-invalid-contract-deploy-output",
    "deploy-script-denies-without-live-approval",
    "init-script-denies-without-live-approval",
    "deploy-script-denies-non-testnet-network",
    "init-script-denies-non-testnet-network",
    "doctor-blocks-non-testnet-network",
    "init-script-denies-nonzero-fee-without-approval",
    "doctor-blocks-nonzero-fee-without-approval"
  ],
  "approvalEnv": "QUORUM_LIVE_SIGNING_APPROVED",
  "approvalValue": "I_APPROVE_TESTNET_SIGNING",
  "nonzeroPlatformFeeApprovalEnv": "QUORUM_NONZERO_PLATFORM_FEE_APPROVED",
  "nonzeroPlatformFeeApprovalValue": "I_APPROVE_NONZERO_PLATFORM_FEE"
}
```

### Contract doctor

- Command: `npm run contracts:doctor`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 contracts:doctor
> node scripts/contracts/doctor.mjs
{
  "ok": true,
  "readyToDeploy": true,
  "strict": false,
  "network": {
    "deployNetwork": "testnet",
    "appNetwork": "TESTNET",
    "appRpcUrl": "https://soroban-testnet.stellar.org",
    "appNetworkPassphrase": "Test SDF Network ; September 2015",
    "rpcReachable": true,
    "rpcStatus": 200
  },
  "tools": {
    "stellar": {
      "ok": true,
      "version": "stellar 26.0.0"
    },
    "rust": {
      "ok": true,
      "version": "rustc 1.95.0 (59807616e 2026-04-14)"
    },
    "cargo": {
      "ok": true,
      "version": "cargo 1.95.0 (f2d3ce0bd 2026-03-21)"
    },
    "wasm32v1NoneInstalled": true
  },
  "contracts": {
    "coreContractIdConfigured": true,
    "passContractIdConfigured": true,
    "wasmArtifacts": [
      {
        "label": "QuorumCore",
        "path": "target/wasm32v1-none/release/quorum_core.wasm",
        "exists": true,
        "sha256": "73ad1844be4fbcf16c76206b18461b020c68c6e230e4fb8b37d50e2dcddb2ac0",
        "sizeBytes": 14247
      },
      {
        "label": "QuorumPassNFT",
        "path": "target/wasm32v1-none/release/quorum_pass_nft.wasm",
        "exists": true,
        "sha256": "e78624a8bf8dbb1babdf808ff38bc29053fe8a91c3761ee64c519983797202ec",
        "sizeBytes": 5467
      }
    ]
  },
  "paymentAsset": {
    "usdcContractIdConfigured": true
  },
  "config": 
... [truncated]
```

### Submission package smoke

- Command: `npm run submission:package:smoke`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 submission:package:smoke
> node scripts/submission-package-smoke.mjs
{
  "ok": true,
  "checks": [
    "required-submission-artifacts",
    "current-hosted-url",
    "historical-live-evidence-label",
    "production-migration-disclosure",
    "hosted-release-evidence-shape",
    "indexer-secret-non-disclosure",
    "indexer-monotonic-progress",
    "moneygram-provider-disclosure",
    "judge-runbook-route-wiring",
    "final-browser-qa-current",
    "reject-stale-deployment-claims"
  ]
}
```
