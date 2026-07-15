# Production Environment Handoff

Last updated: 2026-07-15.

This handoff records the active Supabase Postgres and Vercel environment, plus
the recovery procedure needed to reproduce it. It does not run Freighter, sign
transactions, rotate hosted secrets, or store secret values in the repository.

## Current Deployment Boundary

Quorum now uses Postgres for app persistence. Local development, smoke tests,
and hosted deployments use the same migration path, with `QUORUM_DB_SCHEMA`
available for isolated schemas. The intended hosted storage target is Supabase
used only as a Postgres database behind Next.js server routes.

The public app is deployed at `https://quorum-sandy-eight.vercel.app`.
Production Supabase has migrations `0001` through `0005`, hosted routes and
contract status pass the read-only probe, and Vercel Cron has completed a
successful scheduled indexer run. Fresh Freighter-signed evidence from the
current origin remains the release-critical checkpoint; provider approval and
MoneyGram pickup remain external non-claims.

## Runtime Variables

Set these in the Vercel runtime environment.

| Variable | Scope | Production value | Notes |
|---|---|---|---|
| `DATABASE_URL` | Server-only secret | Supabase pooled Postgres URL with `sslmode=require` | Used by the app runtime. Never expose it to the browser. |
| `DIRECT_DATABASE_URL` | Server-only secret | Supabase direct Postgres URL with `sslmode=require` | Optional, but preferred for migrations when runtime uses a pooler. |
| `QUORUM_DB_SCHEMA` | Server-only | `public` unless an isolated schema is intentionally used | Must be a simple Postgres identifier. |
| `QUORUM_SESSION_SECRET` | Server-only secret | 32+ random characters | Must not be the placeholder, local fallback, or a short value. |
| `CRON_SECRET` | Server-only secret | 32+ random characters | Required. Vercel sends this value as the cron route bearer token; the indexer fails closed when it is absent. |
| `QUORUM_INDEXER_START_LEDGER` | Server-only | First ledger to index | Optional. Use when backfilling from a known live-demo ledger. |
| `QUORUM_INDEXER_RECENT_LEDGER_WINDOW` | Server-only | Recent ledger window size | Optional. Defaults to 100,000 ledgers when no cursor/start ledger exists, staying inside the RPC retention window while reducing first-run gaps. |
| `NEXT_PUBLIC_STELLAR_NETWORK` | Browser public | `TESTNET` | Public because the browser needs network context. |
| `NEXT_PUBLIC_STELLAR_RPC_URL` | Browser public | `https://soroban-testnet.stellar.org` | Public RPC endpoint used by readiness surfaces and live flow preparation. |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | Browser public | `Test SDF Network ; September 2015` | Must match Stellar testnet. |
| `NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID` | Browser public | `CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH` | Read-only validated in `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`. |
| `NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID` | Browser public | `CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV` | Read-only validated in `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`. |
| `NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID` | Browser public | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` | Testnet payment asset configured for checkout readiness. |

Do not add `NEXT_PUBLIC_SUPABASE_*`. Quorum does not use the browser Supabase
client or anon key. Also do not add `SUPABASE_SERVICE_ROLE_KEY`; the app only
needs Postgres credentials.

Generate a session secret locally before adding it to Vercel:

```bash
openssl rand -base64 48
```

## Operator-Only Variables

These are for contract deployment or intentionally approved local signing.
They must be omitted from the normal hosted runtime because the hosted app flow
uses Freighter in the browser.

| Variable | Use |
|---|---|
| `STELLAR_NETWORK` | Must be `testnet` for deploy/init scripts. |
| `STELLAR_ACCOUNT` | Funded Stellar CLI identity, secret, or seed phrase used by deploy/init scripts. Keep out of browser and hosted runtime. |
| `QUORUM_LIVE_SIGNING_APPROVED` | Must be `I_APPROVE_TESTNET_SIGNING` only for an approved signing run. Leave blank otherwise. |
| `ADMIN_ADDRESS` | Admin public account used by contract init. |
| `QUORUM_PLATFORM_FEE_BPS` | Demo is `0`. Non-zero values require explicit fee approval. |
| `QUORUM_NONZERO_PLATFORM_FEE_APPROVED` | Required only when product owner approves a non-zero fee. |

## Supabase Recovery Setup

The production project already exists. Use this procedure only when rebuilding
or recovering the environment; do not create a second project for the current
release.

1. Create a Supabase project.
2. Save the database password in a password manager.
3. Copy the pooled Postgres URL to Vercel as `DATABASE_URL`.
4. Copy the direct Postgres URL to Vercel as `DIRECT_DATABASE_URL` when
   migrations should bypass the pooler.
5. URL-encode any special characters in the password before pasting it into a
   Postgres URL. For example, `!` becomes `%21`.
6. Add `sslmode=require` to both URLs.
7. Run migrations before hosted live testing:

```bash
DATABASE_URL="<pooled-url>" DIRECT_DATABASE_URL="<direct-url>" npm run db:migrate
```

Use `QUORUM_DB_SCHEMA` only when you intentionally want a non-`public` schema.

## Vercel Recovery Pattern

Add the server-only secrets as sensitive Vercel env vars and the public Stellar
values as normal env vars for the deployment environments you use.

Examples:

```bash
echo "<supabase-pooled-postgres-url?sslmode=require>" | vercel env add DATABASE_URL production preview --sensitive
echo "<supabase-direct-postgres-url?sslmode=require>" | vercel env add DIRECT_DATABASE_URL production preview --sensitive
echo "<32-plus-character-secret>" | vercel env add QUORUM_SESSION_SECRET production preview --sensitive
echo "<32-plus-character-indexer-secret>" | vercel env add CRON_SECRET production preview --sensitive
echo "TESTNET" | vercel env add NEXT_PUBLIC_STELLAR_NETWORK production preview
echo "https://soroban-testnet.stellar.org" | vercel env add NEXT_PUBLIC_STELLAR_RPC_URL production preview
echo "Test SDF Network ; September 2015" | vercel env add NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE production preview
echo "CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH" | vercel env add NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID production preview
echo "CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV" | vercel env add NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID production preview
echo "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA" | vercel env add NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID production preview
```

Pull the configured environment back into local development only when needed:

```bash
vercel env pull .env.local --environment=production --yes
```

`vercel env pull` replaces the target file. Preserve local-only variables before
pulling if they are not present in the Vercel project.

## Vercel Cron And Indexer

The repository includes `vercel.json` with a daily cron for:

```text
/api/indexer/stellar-events
```

Vercel calls this route on the production deployment and automatically sends
`CRON_SECRET` as:

```text
Authorization: Bearer <secret>
```

The route returns a configuration error when `CRON_SECRET` is missing and `401`
when the bearer value does not match. It is never intentionally public.
This follows Vercel's documented cron authorization behavior:
<https://vercel.com/docs/cron-jobs/manage-cron-jobs>.

For live-demo evidence, run or trigger the indexer after the Freighter signing
sequence so newly persisted contract events are copied into Postgres:

```bash
npm run indexer:run -- --start-ledger <known-live-demo-ledger> --state-id live-demo-backfill
```

Use a dedicated state ID for manual backfills so the scheduled production cursor
cannot be rewound. Alternatively call the hosted route with the bearer header.
The indexer stores its cursor and latest ledger in `indexer_state`, rejects
overlapping runs, and stores idempotent contract events in `stellar_events`.

## Verification Checklist

Run these locally after Supabase and Vercel env vars are configured and before
any hosted live transaction demo:

```bash
npm run deploy:env:smoke
npm run deploy:hosted:preflight:smoke
npm run anchor:sep1:smoke
npm run anchor:sep24:smoke
npm run live:readiness:smoke
npm run live:deployment:validate
npm run lint
npm run build
```

For MoneyGram-specific verification and troubleshooting, see
`docs/MONEYGRAM_ANCHOR_RUNBOOK.md`.

When rebuilding or validating a deployment, verify the hosted app:

1. Open the hosted app over public HTTPS.
2. Run migrations against Supabase.
3. Run the hosted preflight against the deployed origin and pulled hosted env:
   `npm run deploy:hosted:preflight -- --url https://<hosted-app> --env-file <pulled-env-file>`.
4. Confirm the preflight checks include MoneyGram SEP-1 discovery, hosted
   `stellar.toml` signing key match, and SEP-24 USDC withdraw readiness.
5. Confirm `/api/contracts/status` returns `proofMode: "live"`.
6. Confirm publish, checkout, check-in, and withdraw policies report
   `live_required`.
7. Restart/redeploy the hosted app and confirm records persist in Supabase.
8. Run browser QA against the hosted origin or capture equivalent screenshots.
9. Record hosted URLs and signed transaction hashes in
   `docs/LIVE_TESTNET_EVIDENCE.json`.
10. Run `npm run live:evidence:audit` only after the filled evidence file has no
   placeholders.

## Handoff Status

| Area | Status |
|---|---|
| Testnet contract IDs | Recorded and read-only validated. |
| Browser live action wiring | Verified locally with mocked signer/RPC boundaries. |
| Postgres persistence adapter | Implemented for app, migrations, seed, and smoke scripts. |
| MoneyGram anchor env/preflight | Implemented for hosted `stellar.toml`, SEP-1, SEP-10, and SEP-24 readiness. |
| Production session secret guard | Verified locally. |
| Hosted app URL | Current at `https://quorum-sandy-eight.vercel.app`. |
| Supabase project | Current production project connected server-side; migrations `0001` through `0005` are applied. |
| Vercel project | Current production deployment, runtime variables, sensitive `CRON_SECRET`, and scheduled indexer are configured. |
| Hosted indexer | Three successful cursor-advancing runs are recorded, including Vercel Cron; fresh Quorum rows still require the approved flow. |
| Real Freighter-signed live flows | Historical testnet proof exists; fresh current-origin execution requires explicit approval for each wallet transaction. |
