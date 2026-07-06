# MoneyGram Anchor Runbook

This document explains the current Quorum MoneyGram Anchor integration state,
how to verify it, and where the remaining manual wallet flow begins.

## Current Status

Implemented:

- SEP-1 discovery for MoneyGram testnet TOML.
- Quorum hosted `/.well-known/stellar.toml` client-domain proof.
- SEP-10 challenge request, Quorum client-domain signing, wallet signature
  validation, and MoneyGram token exchange.
- SEP-24 MoneyGram USDC withdrawal initiation.
- MoneyGram payout status sync through SEP-24 `/transaction`.
- Anchor payout evidence rows in `/evidence`.
- Collaborator ledger labels for MoneyGram payout debits.
- Hosted preflight checks for Vercel env, hosted TOML, MoneyGram SEP-1, and
  MoneyGram SEP-24 USDC withdrawal readiness.

Not completed in this autonomous phase:

- Full manual E2E where a real user signs in Freighter, opens the MoneyGram
  interactive flow, completes pickup/KYC details, sends the required Stellar
  payment, and captures final transaction evidence.

## Required Env

Server-side only:

```bash
ANCHOR_PROVIDER=moneygram
ANCHOR_CLIENT_DOMAIN=quorum-sandy-eight.vercel.app
ANCHOR_CLIENT_SIGNING_PUBLIC_KEY=GA3EWCMNMXYSRTMHHJNR5TXMISGTNUWAPFQWI7Z5R7HQJJHSTJ2YWV4W
ANCHOR_CLIENT_SIGNING_SECRET=<secret seed for the public key above>
MONEYGRAM_HOME_DOMAIN=extstellar.moneygram.com
MONEYGRAM_TIMEOUT_MS=15000
MONEYGRAM_USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

Never expose `ANCHOR_CLIENT_SIGNING_SECRET` as `NEXT_PUBLIC_*`.

The hosted app must serve:

```text
https://quorum-sandy-eight.vercel.app/.well-known/stellar.toml
```

with `SIGNING_KEY` and `ACCOUNTS` matching
`ANCHOR_CLIENT_SIGNING_PUBLIC_KEY`.

## Local Verification

Run these after env is ready:

```bash
npm run anchor:config:smoke
npm run anchor:sep1:smoke
ANCHOR_CLIENT_SIGNING_SECRET="$(stellar keys secret quorum-anchor-client-testnet)" npm run anchor:sep10:smoke
npm run anchor:sep24:smoke
npm run anchor:status:smoke
npm run deploy:hosted:preflight:smoke
npm run settlement:smoke
npm run lint
npm run build
```

Optional live SEP-24 initiation smoke:

```bash
ANCHOR_CLIENT_SIGNING_SECRET="$(stellar keys secret quorum-anchor-client-testnet)" MONEYGRAM_SEP24_LIVE=1 npm run anchor:sep24:smoke
```

This creates a MoneyGram sandbox interactive withdrawal request and should
return a JSON object with `liveWithdrawal.id`, `liveWithdrawal.type`, and
`liveWithdrawal.urlHost`. It does not send the final Stellar payment.

## Hosted Verification

After deploying to Vercel and setting env vars:

```bash
vercel env pull .env.vercel.production --environment=production --yes
npm run deploy:hosted:preflight -- --url https://quorum-sandy-eight.vercel.app --env-file .env.vercel.production
```

Expected checks include:

- `hosted-anchor-client-domain-matches-url`
- `hosted-stellar-toml-signing-key-matches-anchor-env`
- `moneygram-sep1-discovery-ready`
- `moneygram-sep24-usdc-withdraw-ready`
- `contract-status-live-proof-mode`
- `contract-status-actions-live-required`

Also verify directly:

```bash
curl -i https://quorum-sandy-eight.vercel.app/.well-known/stellar.toml
```

The response must be `200`, text TOML, and include the Quorum signing key.

## Product Flow

For a collaborator payout:

1. User connects wallet to Quorum.
2. User opens `/dashboard/ledger`.
3. User clicks `Request payout`.
4. If `ANCHOR_PROVIDER=moneygram`, Quorum asks Freighter to sign the SEP-10
   MoneyGram challenge.
5. Quorum exchanges the signed challenge for a MoneyGram token.
6. Quorum calls MoneyGram SEP-24 withdraw interactive.
7. Quorum stores the anchor payout with `provider=moneygram`,
   `status=requested`, `anchor_transaction_id`, and `pickup_url`.
8. User opens the MoneyGram URL and completes the anchor-hosted flow.
9. User can click `Sync status` in payout history. Quorum fetches MoneyGram
   `/transaction` and updates `anchor_payouts`.
10. When MoneyGram reports a final Stellar transaction hash, Quorum creates a
    `withdrawals` row and the debit appears in collaborator ledger/evidence.

## Evidence Surfaces

- `/dashboard/ledger` shows payout opportunities, payout history, MoneyGram
  link, and sync action.
- `/evidence` now includes `anchor_payout` rows, even before final withdrawal
  hash exists.
- `withdrawal` rows still represent the final ledger debit once a valid Stellar
  transaction hash exists.

## Troubleshooting

If SEP-10 fails:

- Confirm the hosted TOML is available over HTTPS.
- Confirm MoneyGram allowlisted the wallet/domain.
- Confirm `ANCHOR_CLIENT_DOMAIN` has no protocol or path.
- Confirm `ANCHOR_CLIENT_SIGNING_SECRET` matches
  `ANCHOR_CLIENT_SIGNING_PUBLIC_KEY`.
- Confirm Freighter is on Stellar Testnet.

If SEP-24 fails:

- Run `npm run anchor:sep24:smoke`.
- Confirm `/info` reports USDC withdraw enabled.
- Confirm the request uses JSON body. MoneyGram rejected
  `application/x-www-form-urlencoded` in live testing.
- Confirm the authenticated wallet token belongs to the same wallet session.

If status sync fails:

- The user must authorize MoneyGram again because Quorum does not persist SEP-10
  bearer tokens.
- Confirm `anchor_transaction_id` exists on the payout row.
- Confirm the payout provider is `moneygram`.

## Security Notes

- Quorum does not send `ANCHOR_CLIENT_SIGNING_SECRET` to the browser.
- Quorum does not persist MoneyGram SEP-10 bearer tokens.
- User wallet signature is still required for MoneyGram auth.
- Hosted preflight rejects operator-only signing env in hosted runtime.
- Supabase service-role keys must not be present in browser env.
