# Quorum

Quorum is a Stellar-native collaborative event checkout platform for Web3 events.

The MVP follows the locked direction in `TECHNICAL_SPEC.md` and `DEVELOPMENT_PLAN.md`: lightweight event platform surfaces, split payout escrow, non-transferable NFT event passes, gated resources, and role-based transparency dashboards.

## Current Status

The local hackathon demo flow is implemented and verified. The app can create, update, publish, publicly list local paid/free events, run wallet-authenticated checkout/claim, issue a unique local pass proof, show attendee pass pages, gate event resources from the connected wallet session, record organizer check-ins, and let collaborators withdraw local proof balances.

The Soroban contracts cover event registry, token escrow transfer, NFT pass minting, split accounting, collaborator withdrawal transfer, platform fee withdrawal, and check-in. Live on-chain publish/checkout/withdraw/check-in still needs deployed testnet contract IDs, a confirmed testnet USDC token contract ID, and wallet signing approval.

Implemented in the app shell:

- public marketplace surface;
- featured published event from the local database;
- event detail pages;
- role-aware transparency dashboard;
- draft event create/update form;
- checkout and claim page;
- attendee pass index and pass detail pages;
- session-gated resources page;
- organizer check-in page;
- Freighter-first wallet auth foundation;
- signed wallet session API routes;
- local SQLite migration foundation;
- draft event create/update API routes;
- publish-to-marketplace DB stub;
- collaborator percentage split setup;
- gated resource setup;
- `QuorumPassNFT` Soroban contract;
- `QuorumCore` Soroban contract;
- local checkout/claim API route;
- local pass proof and purchase recording;
- marketplace metrics for minted passes and routed USDC;
- organizer-authorized local check-in API route;
- collaborator local withdrawal API route;
- dashboard metrics for organizer revenue, collaborator balances, attendee passes, and proof queue.

Not implemented yet:

- live on-chain checkout transaction signing;
- live NFT mint transaction submission from the app;
- live on-chain withdraw transaction submission from the app;
- live on-chain check-in transaction submission from the app.

## Local Development

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local` when you need local secrets. The default database path is `file:./data/quorum.db`.

## Verification

```bash
npm run db:migrate
npm run db:seed
npm run db:smoke
npm run lint
npm run build
npm audit --audit-level=moderate
npm run demo:smoke
npm run demo:live-policy
npm run browser:qa
npm run live:args:smoke
npm run live:persistence:smoke
npm run live:preflight:smoke
npm run live:signing:smoke
npm run live:submission:smoke
npm run live:xdr:smoke
npm run evidence:local
npm run readiness:audit
cargo test
stellar contract build
npm run contracts:doctor
```

`npm run demo:smoke` starts an isolated local Next.js dev server, seeds a temporary SQLite database, and verifies marketplace, paid checkout, free claim, duplicate pass guard, gated resources, organizer check-in, collaborator withdraw, pass detail, and dashboard proof surfaces.

`npm run demo:live-policy` starts an isolated local Next.js dev server with fake
valid contract IDs, verifies non-signing live action preparation, and confirms
mutation routes fail safe without creating local proof records.

`npm run browser:qa` runs a headless browser across desktop/mobile viewport
checks and regenerates `docs/BROWSER_QA.md`.

`npm run live:args:smoke` verifies deterministic contract argument encoding for
future Freighter-signed publish, checkout, check-in, and withdraw flows.

`npm run live:persistence:smoke` verifies the DB path for recording verified
live publish, pass, check-in, and withdrawal transaction results while rejecting
stub hashes.

`npm run live:preflight:smoke` verifies the pre-signing RPC orchestration with a
mock server: fetch signer sequence, prepare/simulate the Soroban transaction,
and return parseable XDR ready for wallet signing.

`npm run live:signing:smoke` verifies the Freighter signing adapter with a mock
signer, including address/network options, signer mismatch handling, wallet
rejection normalization, and signed XDR parsing.

`npm run live:submission:smoke` verifies the signed transaction submission and
finality polling adapter with a mock RPC server, including rejection, failure,
and timeout paths.

`npm run live:xdr:smoke` verifies pre-simulation unsigned Soroban XDR templates
for the same contract actions. These XDRs are not signed and still require live
account sequence fetch plus RPC simulation/assembly before Freighter signing.

`npm run contracts:doctor` is safe to run without signing transactions. It reports live deployment blockers such as missing `STELLAR_ACCOUNT`.

`npm run evidence:local` runs the local verification suite and writes `docs/DEMO_EVIDENCE.md`.

`npm run readiness:audit` is a non-signing final consistency check for the
local evidence packet, readiness docs, live approval gates, and contract doctor
output.

Live testnet deployment signs transactions and is intentionally gated by funded
wallet approval:

```bash
npm run contracts:deploy:testnet
npm run contracts:init:testnet
```

## Planning Docs

- `TECHNICAL_SPEC.md`
- `DEVELOPMENT_PLAN.md`
- `docs/QUORUM_PM_GOAL_BRIEF.md`
- `docs/HACKATHON_DEMO_RUNBOOK.md`
- `docs/DEMO_EVIDENCE.md`
- `docs/MVP_READINESS.md`
- `docs/LIVE_SIGNING_HANDOFF.md`
