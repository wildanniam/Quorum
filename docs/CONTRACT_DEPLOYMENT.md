# Contract Deployment

Quorum contracts are built with Stellar CLI and Rust/Soroban.

## Local Verification

```bash
npm run contracts:test
npm run contracts:build
npm run contracts:doctor
```

`npm run contracts:doctor` is a non-signing readiness check. It verifies local
tooling, WASM artifacts, Stellar RPC reachability, contract ID env format, and
whether `STELLAR_ACCOUNT` is configured. Missing contract IDs are reported as
warnings before deployment; missing signing/funding configuration is a blocker
for live deploy.

## Testnet Deployment

Deployment signs transactions. Do not run this until a funded testnet account or Stellar CLI identity is intentionally configured.

```bash
export STELLAR_NETWORK=testnet
export STELLAR_ACCOUNT=<funded-identity-or-secret>
npm run contracts:doctor
npm run contracts:deploy:testnet
```

The deploy script prints:

- `NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID`
- `NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID`

Copy those values into `.env.local` for app integration.

## Initialization

After deployment, initialize both contracts and link the pass contract to the
core contract. `ADMIN_ADDRESS` must be the public key that authorizes admin
setup. `QUORUM_PLATFORM_FEE_BPS` defaults to `0` for the hackathon demo when
omitted. The contract supports non-zero fees, but the locked demo fee is 0%.

```bash
export ADMIN_ADDRESS=<admin-public-key>
export QUORUM_PLATFORM_FEE_BPS=0
export NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID=<deployed-pass-contract-id>
export NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID=<deployed-core-contract-id>
npm run contracts:init:testnet
```

The init script signs transactions and performs:

1. `QuorumPassNFT.init(admin)`;
2. `QuorumCore.init(admin, platform_fee_bps)`;
3. `QuorumPassNFT.set_core(admin, core_contract_id)`.

## Current Boundary

The contracts are fully unit-tested locally. Live testnet deployment is intentionally gated by wallet/funding approval.
After deployment, use `docs/LIVE_SIGNING_HANDOFF.md` for the app-side Freighter
transaction work required to replace local proof records.
