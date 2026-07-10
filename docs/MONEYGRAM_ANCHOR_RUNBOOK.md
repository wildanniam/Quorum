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
- Transfer-instruction validation for destination, amount, memo ID, asset, and
  Stellar Testnet before the wallet transfer begins.
- Anchor payout evidence rows in `/evidence`.
- Separate proof for the event-contract settlement and the later
  wallet-to-MoneyGram transfer.
- Hosted preflight checks for Vercel env, hosted TOML, MoneyGram SEP-1, and
  MoneyGram SEP-24 USDC withdrawal readiness.

Quorum's hosted client domain is technically active with MoneyGram testnet.
Live SEP-10 token exchange and sandbox SEP-24 withdrawal initiation succeeded
on July 10, 2026 even though no separate approval email had arrived.

Not completed in this autonomous phase:

- Full manual E2E where a real user signs in Freighter, opens the MoneyGram
  interactive flow, completes pickup/KYC details, sends the required Stellar
  payment, and captures final transaction evidence.
- In-app construction, Freighter signing, and submission of the final classic
  Stellar USDC payment. Quorum currently validates and displays the exact
  transfer instructions; the user still sends that payment manually.

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
2. User withdraws the earned event balance from the Quorum contract. This
   confirmed contract transaction creates the one `withdrawals` row and moves
   USDC to the collaborator wallet.
3. User opens `/dashboard/ledger`. Only confirmed settlements that have not
   already been allocated to a cash-out are offered.
4. User clicks `Start cash-out` for one settlement.
5. If `ANCHOR_PROVIDER=moneygram`, Quorum asks Freighter to sign the SEP-10
   MoneyGram challenge.
6. Quorum exchanges the signed challenge for a MoneyGram token.
7. Quorum calls MoneyGram SEP-24 withdraw interactive and links the new
   `anchor_payouts` row to the source `withdrawal_id`.
8. User opens the MoneyGram URL and completes the hosted identity and pickup
   details.
9. User clicks `Refresh MoneyGram`. When the status is
   `pending_user_transfer_start`, Quorum validates and displays the exact
   destination, amount, asset, and memo ID.
10. User sends that exact testnet USDC payment from the same wallet.
11. User refreshes again. `pending_user_transfer_complete` means the pickup
    reference is available; `completed` means MoneyGram completed the cash-out.
12. MoneyGram's Stellar payment hash is stored as
    `anchor_payouts.stellar_transaction_id`. It never creates another event
    withdrawal.

## Evidence Surfaces

- `/dashboard/ledger` shows confirmed settlement opportunities, the three-step
  cash-out path, MoneyGram status, transfer instructions, and sync action.
- `/evidence` includes `anchor_payout` rows even before the final MoneyGram
  transfer hash exists.
- `withdrawal` evidence always uses the contract-to-wallet transaction hash.
- `anchor_payout` evidence uses the separate wallet-to-MoneyGram Stellar hash
  once MoneyGram reports it.
- The collaborator revenue ledger contains one debit for the contract
  settlement. Cash-out does not debit the event balance a second time.

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
- If MoneyGram says `pending_user_transfer_start`, confirm the response includes
  a valid Stellar account, a numeric memo ID, and an amount equal to the linked
  contract settlement.

Official flow references:

- [Poll transaction status](https://developer.moneygram.com/moneygram-developer/docs/poll-transaction-status)
- [Send or receive funds](https://developer.moneygram.com/moneygram-developer/docs/send-or-receive-funds)
- [Fetch reference number](https://developer.moneygram.com/moneygram-developer/docs/fetch-reference-number)

## Security Notes

- Quorum does not send `ANCHOR_CLIENT_SIGNING_SECRET` to the browser.
- Quorum does not persist MoneyGram SEP-10 bearer tokens.
- User wallet signature is still required for MoneyGram auth.
- A settled withdrawal can be linked to only one anchor cash-out.
- MoneyGram destination, amount, memo type, and asset are validated before being
  shown as transfer-ready.
- Hosted preflight rejects operator-only signing env in hosted runtime.
- Supabase service-role keys must not be present in browser env.
