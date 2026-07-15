# Historical Quorum Vercel + Supabase Setup Reference

Last updated: 2026-07-15.

> Historical reference only. The branch named below has already landed, and the
> production app, Supabase migrations, Vercel environment, and scheduled
> indexer are configured. Use `docs/PRODUCTION_ENV_HANDOFF.md` for the current
> release state and recovery procedure. Do not redeploy the historical branch.

This is the short handoff for wiring the hosted app. The code that needs these
env vars lives on branch:

```text
codex/supabase-live-evidence
```

Use `docs/VERCEL_ENV_VALUES.example.env` for a project-specific copy-paste env
template with the Supabase project ref already filled in. Replace only the
secret placeholders before adding values to Vercel.

## Current Deployment

Vercel deploys `main` to `https://quorum-sandy-eight.vercel.app`. The historical
`codex/supabase-live-evidence` branch is not the release source and should not be
merged or deployed again.

## Supabase Values Needed

In Supabase, open the project, click **Connect**, and copy:

- Transaction pooler / pooled connection string
- Direct connection string

Use `sslmode=require` on both URLs.

Format:

```env
DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD_URL_ENCODED>@aws-<REGION>.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
DIRECT_DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD_URL_ENCODED>@aws-<REGION>.pooler.supabase.com:5432/postgres?sslmode=require
```

If the password contains special characters like `@`, `:`, `/`, `#`, `?`, or
`&`, URL-encode them before putting the password into the connection string.
For this Supabase project, encode `!` as `%21`.

## Vercel Environment Variables

Add these in Vercel project settings:

```env
DATABASE_URL=<Supabase transaction pooler URL with sslmode=require>
DIRECT_DATABASE_URL=<Supabase direct URL with sslmode=require>
QUORUM_DB_SCHEMA=public
QUORUM_SESSION_SECRET=<32+ random chars>

NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID=CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV
NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID=CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH
NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID=CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
```

Generate `QUORUM_SESSION_SECRET` with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## Do Not Add These To Vercel Runtime

```env
STELLAR_ACCOUNT
QUORUM_LIVE_SIGNING_APPROVED
ADMIN_ADDRESS
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Quorum uses Supabase only as server-side Postgres. There is no browser
Supabase client in this app.

## Run Migrations

After Supabase env values exist, run migrations once against Supabase:

```powershell
$env:DATABASE_URL="<Supabase transaction pooler URL with sslmode=require>"
$env:DIRECT_DATABASE_URL="<Supabase session pooler/direct URL with sslmode=require>"
$env:QUORUM_DB_SCHEMA="public"
npm run db:migrate
```

Optional demo seed data:

```powershell
npm run db:seed
```

## Redeploy And Verify

After env vars are saved in Vercel, redeploy the app. Then pull the Vercel env
locally:

```powershell
vercel env pull .env.vercel.production --environment=production --yes
```

Run hosted preflight:

```powershell
npm run deploy:hosted:preflight -- --url https://<vercel-app-url> --env-file .env.vercel.production
```

Expected result: JSON with `"ok": true`. The checks should include hosted
anchor client-domain match, hosted `stellar.toml` signing key match, MoneyGram
SEP-1 discovery, and MoneyGram SEP-24 USDC withdraw readiness.

MoneyGram-specific setup and troubleshooting lives in
`docs/MONEYGRAM_ANCHOR_RUNBOOK.md`.

Also verify:

```text
https://<vercel-app-url>/api/contracts/status
```

Expected important fields:

```json
{
  "proofMode": "live",
  "configured": true,
  "paymentAssetConfigured": true
}
```

## Final Manual Evidence Still Required

After hosted preflight passes, the remaining work is real Freighter testnet
evidence:

1. Organizer publishes paid event.
2. Paid attendee buys pass with testnet USDC.
3. Organizer publishes free event.
4. Free attendee claims pass.
5. Paid attendee unlocks resources.
6. Organizer checks in paid token.
7. Collaborator withdraws split balance.
8. Fill `docs/LIVE_TESTNET_EVIDENCE.json`.
9. Run `npm run live:evidence:audit`.
