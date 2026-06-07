# Quorum Demo Evidence

Generated at: `2026-06-07T18:35:40.184Z`

## Source State

- Branch: `main`
- Commit: `64dacfe`
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
| Contract tests | `npm run contracts:test` | PASS | 0 |
| Contract build | `npm run contracts:build` | PASS | 0 |
| Contract doctor | `npm run contracts:doctor` | PASS | 0 |

Overall local verification: **PASS**

## Demo Smoke Coverage

Event ID: `evt_apac_stellar_builder_meetup`

Generated pass token ID: `qpass-apac-stellar-builder-meetup-0001-492983`

Covered checks:

- marketplace
- event-detail
- draft-validation
- publish-lifecycle
- contract-status
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

## Contract Artifacts

| Contract | WASM | Exists | Size bytes | SHA-256 |
|---|---|---:|---:|---|
| QuorumCore | `target/wasm32v1-none/release/quorum_core.wasm` | yes | 13034 | `44d110000addf017e819afadec7860628e854fa0964e2caba379ee46e2fcb4f6` |
| QuorumPassNFT | `target/wasm32v1-none/release/quorum_pass_nft.wasm` | yes | 5155 | `3c29db47b953e91e2b85628422fc18e66c82e4c68c8b1a4a9bd8b769945c0bc1` |

## Deployment Readiness

- Ready to deploy: `false`
- RPC reachable: `true`
- Deploy network: `testnet`
- App RPC: `https://soroban-testnet.stellar.org`
- Platform fee bps: `0`
- Stellar CLI: `stellar 26.0.0`
- Rust: `rustc 1.95.0 (59807616e 2026-04-14)`
- Cargo: `cargo 1.95.0 (f2d3ce0bd 2026-03-21)`

Blockers:

- STELLAR_ACCOUNT is missing. Set a funded Stellar identity/secret before deploy.

Warnings:

- NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID is missing or not a valid contract ID. This is expected before deploy.
- NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID is missing or not a valid contract ID. This is expected before deploy.

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
    "id": "evt_67e6dcb6-271b-478e-b2bf-59fe9d2cff3e",
    "slug": "smoke-67e6dcb6",
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
✓ Compiled successfully in 2.8s
  Running TypeScript ...
  Finished TypeScript in 1917ms ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/10) ...
  Generating static pages using 7 workers (2/10)
  Generating static pages using 7 workers (4/10)
  Generating static pages using 7 workers (7/10)
✓ Generating static pages using 7 workers (10/10) in 91ms
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
  "databasePath": "/Users/wildanniam/Development/project/Quorum/data/quorum-demo-smoke-a7aece9c-4729-4323-b7d6-10d9fe6f70ef.db",
  "eventId": "evt_apac_stellar_builder_meetup",
  "tokenId": "qpass-apac-stellar-builder-meetup-0001-492983",
  "checks": [
    "marketplace",
    "event-detail",
    "draft-validation",
    "publish-lifecycle",
    "contract-status",
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
    "dashboard-proof"
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
running 17 tests
test test::rejects_check_in_for_unknown_token - should panic ... ok
test test::collaborator_can_withdraw_balance ... ok
test test::purchase_mints_pass_and_splits_balance ... ok
test test::duplicate_check_in_is_idempotent ... ok
test test::demo_zero_fee_routes_full_amount_to_collaborators ... ok
test test::organizer_can_check_in_pass ... ok
test test::rejects_check_in_for_token_from_another_event - should panic ... ok
test test::free_event_claim_mints_pass_without_balances ... ok
test test::rejects_check_in_from_non_organizer - should panic ... ok
test test::rejects_invalid_split_total - should panic ... ok
test test::rejects_free_claim_with_nonzero_amount - should panic ... ok
test test::rejects_duplicate_purchase - should panic ... ok
test test::rejects_paid_purchase_with_wrong_amount - should panic ... ok
test test::rejects_withdraw_without_balance - should panic ... ok
test test::rejects_free_claim_when_capacity_is_full - should panic ... ok
test test::rejects_duplicate_free_claim - should panic ... ok
test test::rejects_paid_purchase_when_capacity_is_full - should panic ... ok
test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.36s
running 6 tests
test test::rejects_unauthorized_mint - should panic ... ok
test test::mints_unique_pass_for_owner_event ... ok
test test::core_can_
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
    Finished `release` profile [optimized] target(s) in 0.09s
ℹ️  Build Summary:
    Wasm File: target/wasm32v1-none/release/quorum_core.wasm (13034 bytes)
    Wasm Hash: 44d110000addf017e819afadec7860628e854fa0964e2caba379ee46e2fcb4f6
    Wasm Size: 13034 bytes
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
    Finished `release` profile [optimized] target(s) in 0.05s
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
        "sha256": "44d110000addf017e819afadec7860628e854fa0964e2caba379ee46e2fcb4f6",
        "sizeBytes": 13034
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
  "config": {
    "platformFeeBps": 0
  },
  "signing": {
    "stellar
... [truncated]
```

