# Production Environment Handoff

Last updated: 2026-06-09.

This handoff records the environment variables and verification steps required
before Quorum is exposed as a hosted app. It does not perform deployment,
Freighter signing, faucet work, or cloud configuration.

## Current Deployment Boundary

Quorum is live-contract configured and local-demo ready, but the hosted app is
not yet production-storage ready.

The current application database client uses `better-sqlite3` with a
`file:`-based `DATABASE_URL`. That is acceptable for local demos or a single
host with persistent disk. It is not a durable production setup for typical
serverless hosting where the filesystem is ephemeral. Before a public hosted
demo that must persist organizer events, passes, purchases, check-ins, and
withdrawals, choose one of these paths:

1. Run on an environment with persistent disk and a single app instance.
2. Migrate the repository DB adapter to a hosted database before deployment.
3. Treat the hosted app as a read-only/UI demo and avoid claiming persistence.

## Runtime Variables

Set these in the hosted runtime environment.

| Variable | Scope | Production value | Notes |
|---|---|---|---|
| `DATABASE_URL` | Server-only | `file:<persistent-path>` until DB migration exists | Must remain `file:` with the current DB client. Do not use Postgres URLs until a DB adapter migration is implemented. |
| `QUORUM_SESSION_SECRET` | Server-only secret | 32+ random characters | Must not be the placeholder, local fallback, or a short value. Verified by `npm run deploy:env:smoke`. |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Browser public | `TESTNET` | Public because the browser needs network context. |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | Browser public | `https://soroban-testnet.stellar.org` | Public RPC endpoint used by readiness surfaces and live flow preparation. |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | Browser public | `Test SDF Network ; September 2015` | Must match Stellar testnet. |
| `NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID` | Browser public | `CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH` | Read-only validated in `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`. |
| `NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID` | Browser public | `CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV` | Read-only validated in `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`. |
| `NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID` | Browser public | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` | Testnet payment asset configured for checkout readiness. |

Generate a session secret locally before adding it to the host:

```bash
openssl rand -base64 48
```

## Operator-Only Variables

These are for contract deployment or intentionally approved live signing from a
local operator shell. Do not add them to the normal hosted app runtime unless a
separate, explicit server-side signing design has been approved.

| Variable | Use |
|---|---|
| `STELLAR_NETWORK` | Must be `testnet` for deploy/init scripts. |
| `STELLAR_ACCOUNT` | Funded Stellar CLI identity, secret, or seed phrase used by deploy/init scripts. Keep out of browser and routine hosted runtime. |
| `QUORUM_LIVE_SIGNING_APPROVED` | Must be `I_APPROVE_TESTNET_SIGNING` only for an approved signing run. Leave blank otherwise. |
| `ADMIN_ADDRESS` | Admin public account used by contract init. |
| `QUORUM_PLATFORM_FEE_BPS` | Demo is `0`. Non-zero values require explicit fee approval. |
| `QUORUM_NONZERO_PLATFORM_FEE_APPROVED` | Required only when product owner approves a non-zero fee. |

## Vercel Setup Pattern

If Vercel is used, add public runtime variables to Production, Preview, and
Development as appropriate. Add `QUORUM_SESSION_SECRET` as a sensitive
Production/Preview secret.

Examples:

```bash
echo "TESTNET" | vercel env add NEXT_PUBLIC_STELLAR_NETWORK production preview
echo "https://soroban-testnet.stellar.org" | vercel env add NEXT_PUBLIC_STELLAR_RPC_URL production preview
echo "Test SDF Network ; September 2015" | vercel env add NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE production preview
echo "CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH" | vercel env add NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID production preview
echo "CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV" | vercel env add NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID production preview
echo "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA" | vercel env add NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID production preview
echo "<32-plus-character-secret>" | vercel env add QUORUM_SESSION_SECRET production preview --sensitive
```

Pull the configured environment back into local development only when needed:

```bash
vercel env pull .env.local --environment=production --yes
```

`vercel env pull` replaces the target file. Preserve local-only variables before
pulling if they are not present in the Vercel project.

## Verification Checklist

Run these locally after environment variables are configured and before any
hosted live transaction demo:

```bash
npm run deploy:env:smoke
npm run live:readiness:smoke
npm run live:deployment:validate
npm run lint
npm run build
```

After deployment, verify the hosted app:

1. Open the hosted app over public HTTPS.
2. Confirm `/api/contracts/status` returns `proofMode: "live"`.
3. Confirm publish, checkout, check-in, and withdraw policies report
   `live_required`.
4. Run browser QA against the hosted origin or capture equivalent screenshots.
5. Record hosted URLs and signed transaction hashes in
   `docs/LIVE_TESTNET_EVIDENCE.json`.
6. Run `npm run live:evidence:audit` only after the filled evidence file has no
   placeholders.

## Handoff Status

| Area | Status |
|---|---|
| Testnet contract IDs | Recorded and read-only validated. |
| Browser live action wiring | Verified locally with mocked signer/RPC boundaries. |
| Production session secret guard | Verified locally. |
| Hosted app URL | Not configured in repo. |
| Production database | Not production-ready until persistent storage or a DB adapter migration exists. |
| Real Freighter-signed live flows | Not run in this phase. Requires explicit user approval and manual wallet interaction. |
