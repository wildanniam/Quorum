# Contract Deployment

Quorum contracts are built with Stellar CLI and Rust/Soroban.

## Local Verification

```bash
npm run contracts:test
npm run contracts:build
```

## Testnet Deployment

Deployment signs transactions. Do not run this until a funded testnet account or Stellar CLI identity is intentionally configured.

```bash
export STELLAR_NETWORK=testnet
export STELLAR_ACCOUNT=<funded-identity-or-secret>
npm run contracts:deploy:testnet
```

The deploy script prints:

- `NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID`
- `NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID`

Copy those values into `.env.local` for app integration.

## Initialization Commands

After deployment, initialize both contracts. Use the organizer/admin public address for `ADMIN_ADDRESS`.

```bash
stellar contract invoke \
  --id "$NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID" \
  --source-account "$STELLAR_ACCOUNT" \
  --network "$STELLAR_NETWORK" \
  -- init \
  --admin "$ADMIN_ADDRESS"

stellar contract invoke \
  --id "$NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID" \
  --source-account "$STELLAR_ACCOUNT" \
  --network "$STELLAR_NETWORK" \
  -- init \
  --admin "$ADMIN_ADDRESS" \
  --platform_fee_bps 500

stellar contract invoke \
  --id "$NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID" \
  --source-account "$STELLAR_ACCOUNT" \
  --network "$STELLAR_NETWORK" \
  -- set_core \
  --caller "$ADMIN_ADDRESS" \
  --core "$NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID"
```

## Current Boundary

The contracts are fully unit-tested locally. Live testnet deployment is intentionally gated by wallet/funding approval.
