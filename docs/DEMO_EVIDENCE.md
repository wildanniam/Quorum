# Quorum Demo Evidence

Generated at: `2026-06-07T22:28:47.570Z`

## Source State

- Branch: `main`
- Commit: `c2c4c88`
- Working tree when collected, excluding this generated evidence file:

```text
(clean)
```

## Local Verification Summary

| Check | Command | Status | Exit |
|---|---|---:|---:|
| DB migrate | `npm run db:migrate` | PASS | 0 |
| DB seed | `npm run db:seed` | PASS | 0 |
| DB smoke | `npm run db:smoke` | PASS | 0 |
| Lint | `npm run lint` | PASS | 0 |
| Build | `npm run build` | PASS | 0 |
| Audit | `npm audit --audit-level=moderate` | PASS | 0 |
| Demo smoke | `npm run demo:smoke` | PASS | 0 |
| Live policy smoke | `npm run demo:live-policy` | PASS | 0 |
| Browser QA | `npm run browser:qa` | PASS | 0 |
| Live args smoke | `npm run live:args:smoke` | PASS | 0 |
| Live flow smoke | `npm run live:flow:smoke` | PASS | 0 |
| Live persistence smoke | `npm run live:persistence:smoke` | PASS | 0 |
| Live preflight smoke | `npm run live:preflight:smoke` | PASS | 0 |
| Live signing smoke | `npm run live:signing:smoke` | PASS | 0 |
| Live submission smoke | `npm run live:submission:smoke` | PASS | 0 |
| Live XDR smoke | `npm run live:xdr:smoke` | PASS | 0 |
| Live evidence template | `npm run live:evidence:template` | PASS | 0 |
| Contract tests | `npm run contracts:test` | PASS | 0 |
| Contract build | `npm run contracts:build` | PASS | 0 |
| Contract doctor | `npm run contracts:doctor` | PASS | 0 |

Overall local verification: **PASS**

## Demo Smoke Coverage

Event ID: `evt_apac_stellar_builder_meetup`

Generated pass token ID: `qpass-apac-stellar-builder-meetup-0001-4f1147`

Covered checks:

- marketplace
- event-detail
- draft-validation
- publish-lifecycle
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
- pass-page
- dashboard-proof
- dashboard-payment-asset-readiness
- dashboard-action-policy

## Contract Artifacts

| Contract | WASM | Exists | Size bytes | SHA-256 |
|---|---|---:|---:|---|
| QuorumCore | `target/wasm32v1-none/release/quorum_core.wasm` | yes | 13347 | `f67c4483f74bdfce3931a7d30577fabc5b4b6d1bdb7bdb1cec4696818c917761` |
| QuorumPassNFT | `target/wasm32v1-none/release/quorum_pass_nft.wasm` | yes | 5155 | `3c29db47b953e91e2b85628422fc18e66c82e4c68c8b1a4a9bd8b769945c0bc1` |

## Deployment Readiness

- Ready to deploy: `false`
- RPC reachable: `true`
- Deploy network: `testnet`
- App RPC: `https://soroban-testnet.stellar.org`
- Payment asset configured: `false`
- Platform fee bps: `0`
- Stellar CLI: `stellar 26.0.0`
- Rust: `rustc 1.95.0 (59807616e 2026-04-14)`
- Cargo: `cargo 1.95.0 (f2d3ce0bd 2026-03-21)`

Blockers:

- STELLAR_ACCOUNT is missing. Set a funded Stellar identity/secret before deploy.

Warnings:

- NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID is missing or not a valid contract ID. This is expected before deploy.
- NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID is missing or not a valid contract ID. This is expected before deploy.
- NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID is missing or not a valid contract ID. This is expected before live app transaction signing.

## Live Deployment Boundary

Live testnet deployment and app-side live transaction signing remain gated by a funded Stellar identity and explicit approval. The local proof flow is verified end to end; contract deployment is intentionally not attempted by this evidence command.

## Command Details

### DB migrate

- Command: `npm run db:migrate`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 db:migrate
> node scripts/db-migrate.mjs
{
  "databasePath": "/Users/wildanniam/Development/project/Quorum/data/quorum.db",
  "applied": [],
  "totalMigrations": 1
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
    "id": "evt_7292eff1-ada8-49b8-befd-6f3f2df7ee34",
    "slug": "smoke-7292eff1",
    "status": "draft"
  },
  "splitTotal": 100,
  "resourceCount": 1,
  "cleanedUp": true
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
  Creating an optimized production build ...
✓ Compiled successfully in 2.3s
  Running TypeScript ...
  Finished TypeScript in 1905ms ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/10) ...
  Generating static pages using 7 workers (2/10)
  Generating static pages using 7 workers (4/10)
  Generating static pages using 7 workers (7/10)
✓ Generating static pages using 7 workers (10/10) in 85ms
  Finalizing page optimization ...
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /api/auth/challenge
├ ƒ /api/auth/logout
├ ƒ /api/auth/verify
├ ƒ /api/contracts/status
├ ƒ /api/events
├ ƒ /api/events/[eventId]
├ ƒ /api/events/[eventId]/check-ins
├ ƒ /api/events/[eventId]/contract-action
├ ƒ /api/events/[eventId]/contract-action/preflight
├ ƒ /api/events/[eventId]/passes
├ ƒ /api/events/[eventId]/publish
├ ƒ /api/events/[eventId]/withdrawals
├ ƒ /api/me
├ ƒ /check-in/[eventId]
├ ƒ /dashboard
├ ○ /dashboard/events/new
├ ƒ /events/[slug]
├ ƒ /events/[slug]/checkout
├ ƒ /events/[slug]/resources
├ ƒ /passes
└ ƒ /passes/[tokenId]
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

### Audit

- Command: `npm audit --audit-level=moderate`
- Exit code: `0`
- Status: **PASS**

```text
found 0 vulnerabilities
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
  "databasePath": "/Users/wildanniam/Development/project/Quorum/data/quorum-demo-smoke-510b8010-7dfb-41e5-aad8-6deb865851de.db",
  "eventId": "evt_apac_stellar_builder_meetup",
  "tokenId": "qpass-apac-stellar-builder-meetup-0001-4f1147",
  "checks": [
    "marketplace",
    "event-detail",
    "draft-validation",
    "publish-lifecycle",
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
    "pass-page",
    "dashboard-proof",
    "dashboard-payment-asset-readiness",
    "dashboard-action-policy"
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
    "withdraw-live-required",
    "no-local-proof-mutations"
  ]
}
```

### Browser QA

- Command: `npm run browser:qa`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 browser:qa
> node scripts/browser-qa.mjs
{
  "ok": true,
  "browserQaPath": "/Users/wildanniam/Development/project/Quorum/docs/BROWSER_QA.md",
  "generatedAt": "2026-06-07T22:29:21.509Z",
  "baseUrl": "http://127.0.0.1:3040",
  "checkedPages": 8,
  "failures": []
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
  "databasePath": "/Users/wildanniam/Development/project/Quorum/data/quorum-live-flow-smoke-2f3ea847-7449-4c99-befd-84b76877d508.db",
  "persistedEventId": "evt_1c9231e5-0a5d-47c9-9f0e-cf7672891b92",
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
  "databasePath": "/Users/wildanniam/Development/project/Quorum/data/quorum-live-persistence-smoke-dc30ac64-6ad5-408d-9289-cecc98ba0ce1.db",
  "checks": [
    "record-live-publish",
    "record-live-pass",
    "record-live-check-in",
    "record-live-withdrawal",
    "reject-stub-live-hash",
    "reject-duplicate-live-check-in",
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
    "signed-xdr-parseable",
    "reject-signer-mismatch",
    "normalize-wallet-rejection",
    "reject-invalid-prepared-xdr"
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
    "decode-purchase-token-id",
    "decode-withdraw-amount",
    "reject-source-mismatch-before-rpc",
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
  "liveEvidenceComplete": false,
  "checkedFields": 56,
  "failures": []
}
```

### Contract tests

- Command: `npm run contracts:test`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 contracts:test
> cargo test
running 18 tests
test test::purchase_mints_pass_and_splits_balance ... ok
test test::demo_zero_fee_routes_full_amount_to_collaborators ... ok
test test::admin_can_withdraw_platform_fee ... ok
test test::organizer_can_check_in_pass ... ok
test test::duplicate_check_in_is_idempotent ... ok
test test::free_event_claim_mints_pass_without_balances ... ok
test test::rejects_check_in_for_token_from_another_event - should panic ... ok
test test::rejects_check_in_for_unknown_token - should panic ... ok
test test::collaborator_can_withdraw_balance ... ok
test test::rejects_invalid_split_total - should panic ... ok
test test::rejects_check_in_from_non_organizer - should panic ... ok
test test::rejects_duplicate_purchase - should panic ... ok
test test::rejects_free_claim_with_nonzero_amount - should panic ... ok
test test::rejects_free_claim_when_capacity_is_full - should panic ... ok
test test::rejects_paid_purchase_with_wrong_amount - should panic ... ok
test test::rejects_duplicate_free_claim - should panic ... ok
test test::rejects_withdraw_without_balance - should panic ... ok
test test::rejects_paid_purchase_when_capacity_is_full - should panic ... ok
test result: ok. 18 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.41s
running 6 tests
test test::rejects_unauthorized_mint - should panic ... ok
test test::mints_uniqu
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
    Finished `release` profile [optimized] target(s) in 0.11s
ℹ️  Build Summary:
    Wasm File: target/wasm32v1-none/release/quorum_core.wasm (13347 bytes)
    Wasm Hash: f67c4483f74bdfce3931a7d30577fabc5b4b6d1bdb7bdb1cec4696818c917761
    Wasm Size: 13347 bytes
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
    Finished `release` profile [optimized] target(s) in 0.06s
ℹ️  Build Summary:
    Wasm File: target/wasm32v1-none/release/quorum_pass_nft.wasm (5155 bytes)
    Wasm Hash: 3c29db47b953e91e2b85628422fc18e66c82e4c68c8b1a4a9bd8b769945c0bc1
    Wasm Size: 5155 bytes
    Exported Func
... [truncated]
```

### Contract doctor

- Command: `npm run contracts:doctor`
- Exit code: `0`
- Status: **PASS**

```text
> quorum@0.1.0 contracts:doctor
> node scripts/contracts/doctor.mjs
{
  "ok": false,
  "readyToDeploy": false,
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
    "coreContractIdConfigured": false,
    "passContractIdConfigured": false,
    "wasmArtifacts": [
      {
        "label": "QuorumCore",
        "path": "target/wasm32v1-none/release/quorum_core.wasm",
        "exists": true,
        "sha256": "f67c4483f74bdfce3931a7d30577fabc5b4b6d1bdb7bdb1cec4696818c917761",
        "sizeBytes": 13347
      },
      {
        "label": "QuorumPassNFT",
        "path": "target/wasm32v1-none/release/quorum_pass_nft.wasm",
        "exists": true,
        "sha256": "3c29db47b953e91e2b85628422fc18e66c82e4c68c8b1a4a9bd8b769945c0bc1",
        "sizeBytes": 5155
      }
    ]
  },
  "paymentAsset": {
    "usdcContractIdConfigured": false
  },
  "conf
... [truncated]
```

