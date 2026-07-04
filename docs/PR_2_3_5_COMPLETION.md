# PR 2 / 3 / 5 Completion Notes

Last updated: 2026-07-04.

This records the implementation proof for the next three handoff workstreams:
custom Soroban event indexing, live transaction evidence pages, and
collaborator ledger.

## Implemented

### PR 2: Custom Soroban Event Indexer

- Added `indexer_state` and `stellar_events` in
  `db/migrations/0003_indexer_evidence_ledger.sql`.
- Added idempotent Stellar RPC event ingestion in
  `src/lib/stellar/indexer.ts`.
- Added manual runner `npm run indexer:run`.
- Added hosted cron endpoint `GET /api/indexer/stellar-events`.
- Added `vercel.json` cron configuration.

### PR 3: Live Transaction Evidence Page

- Added global public proof page at `/evidence`.
- Added event proof page at `/events/[slug-or-id]/proof`.
- Added evidence read model in `src/lib/evidence/repository.ts`.
- Added shared `EvidenceTimeline` UI with Stellar explorer links.
- Linked event pages and primary navigation to proof surfaces.

### PR 5: Collaborator Ledger

- Added collaborator ledger read model in `src/lib/ledger/repository.ts`.
- Added wallet-scoped ledger page at `/dashboard/ledger`.
- Added dashboard link to the ledger.
- Ledger rows show checkout split credits, withdrawal debits, running balance,
  event proof links, and external transaction proof links.

## Proof Commands

Run:

```bash
npm run db:migrate
npm run db:smoke
npm run settlement:smoke
npm run indexer:run -- --limit 2
npm run lint
npm run build
npm run evidence:local
```

`npm run settlement:smoke` proves:

- indexer schema exists;
- indexed events insert idempotently;
- indexer state stores cursor/latest ledger;
- global/event evidence read models work;
- evidence transaction hashes produce explorer links;
- collaborator credit rows are derived from successful checkout splits;
- collaborator debit rows are derived from withdrawals;
- withdrawable balance math is consistent.

`npm run indexer:run -- --limit 2` was also run against the configured
Stellar testnet RPC and Supabase database. It updated the
`quorum-testnet-contracts` row in `indexer_state` successfully with zero fetched
events in the current recent window.

Supabase MCP verification confirmed `public.indexer_state` and
`public.stellar_events` exist. Supabase security advisors still report RLS
disabled on the public tables. That is not changed in this PR because Quorum is
using Supabase as server-only Postgres and there is no browser Supabase client,
but enabling RLS should be a deliberate follow-up with policies:
https://supabase.com/docs/guides/database/postgres/row-level-security

## Still External

Wildan/friend still needs to own:

- Vercel project connection and env values;
- hosted deployment URL;
- Freighter wallets and paid attendee testnet USDC;
- live signing approval and manual transaction prompts;
- final `docs/LIVE_TESTNET_EVIDENCE.json` after real testnet signatures.
