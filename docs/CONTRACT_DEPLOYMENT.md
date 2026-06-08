# Contract Deployment

Quorum contracts are built with Stellar CLI and Rust/Soroban.

## Local Verification

```bash
npm run contracts:test
npm run contracts:build
npm run contracts:doctor
```

`npm run contracts:doctor` is a non-signing readiness check. It verifies local
tooling, WASM artifacts, Stellar RPC reachability, contract ID env format,
whether `STELLAR_ACCOUNT` is configured, and whether the explicit live signing
approval guard is set. Missing contract IDs are reported as warnings before
deployment; missing signing/funding configuration or missing
`QUORUM_LIVE_SIGNING_APPROVED=I_APPROVE_TESTNET_SIGNING` is a blocker for live
deploy. The doctor also blocks any `STELLAR_NETWORK` value other than
`testnet`; Quorum's hackathon deployment path is intentionally testnet-only.

## Testnet Deployment

Deployment signs transactions. Do not run this until a funded testnet account or
Stellar CLI identity is intentionally configured. `STELLAR_NETWORK` must remain
`testnet`; the deploy/init scripts refuse non-testnet networks before signing.

```bash
export STELLAR_NETWORK=testnet
export STELLAR_ACCOUNT=<funded-identity-or-secret>
export QUORUM_LIVE_SIGNING_APPROVED=I_APPROVE_TESTNET_SIGNING
npm run contracts:doctor
npm run contracts:deploy:testnet
```

The deploy script prints:

- `NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID`
- `NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID`

Those IDs are parsed from Stellar CLI output and validated as Soroban contract
IDs before they are printed for app env configuration.

Copy those values into `.env.local` for app integration.

## Initialization

After deployment, initialize both contracts and link the pass contract to the
core contract. `ADMIN_ADDRESS` must be the public key that authorizes admin
setup. `QUORUM_PLATFORM_FEE_BPS` defaults to `0` for the hackathon demo when
omitted. The contract supports non-zero fees, but the locked demo fee is 0%.
Setting a non-zero fee requires
`QUORUM_NONZERO_PLATFORM_FEE_APPROVED=I_APPROVE_NONZERO_PLATFORM_FEE` after
explicit product approval; otherwise `contracts:doctor` and
`contracts:init:testnet` refuse it before signing.

```bash
export ADMIN_ADDRESS=<admin-public-key>
export QUORUM_PLATFORM_FEE_BPS=0
export QUORUM_LIVE_SIGNING_APPROVED=I_APPROVE_TESTNET_SIGNING
export NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID=<deployed-pass-contract-id>
export NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID=<deployed-core-contract-id>
npm run contracts:init:testnet
```

The init script signs transactions and performs:

1. `QuorumPassNFT.init(admin)`;
2. `QuorumCore.init(admin, platform_fee_bps)`;
3. `QuorumPassNFT.set_core(admin, core_contract_id)`.

Record the transaction hash for each deployment and initialization step in
`docs/LIVE_TESTNET_EVIDENCE.json`: `passDeployTxHash`, `coreDeployTxHash`,
`passInitTxHash`, `coreInitTxHash`, and `passSetCoreTxHash`.

The current read-only deployment evidence captured from testnet is recorded in
`docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`. It covers the admin account,
contract IDs, upload/deploy transaction window, initialization transactions,
and decoded init/set-core parameters without performing any new signing.
Run `npm run live:deployment:validate` to validate that evidence against
Horizon, Soroban RPC events, and fetched contract interfaces.

## Current Boundary

The contracts are fully unit-tested locally. Live testnet deployment is
intentionally gated by wallet/funding approval and locked to
`STELLAR_NETWORK=testnet`.
After deployment, use `docs/LIVE_SIGNING_HANDOFF.md` for the app-side Freighter
transaction work required to replace local proof records.
