# Quorum

Quorum is a Stellar-native collaborative event checkout platform for Web3 events.

The MVP follows the locked direction in `TECHNICAL_SPEC.md` and `DEVELOPMENT_PLAN.md`: lightweight event platform surfaces, split payout escrow, non-transferable NFT event passes, gated resources, and role-based transparency dashboards.

## Current Status

Phase 7 local proof flow is in progress. The app can create, update, publish, publicly list local events, run wallet-authenticated checkout/claim, issue a unique local pass proof, show attendee pass pages, and gate event resources from the connected wallet session.

The Soroban contracts cover event registry, NFT pass minting, split accounting, withdraw accounting, and check-in. Live on-chain publish/checkout still needs deployed testnet contract IDs and wallet signing approval.

Implemented in the app shell:

- public marketplace surface;
- featured demo event;
- event detail pages;
- dashboard placeholder;
- create event placeholder;
- checkout and claim page;
- attendee pass index and pass detail pages;
- session-gated resources page;
- check-in placeholder;
- Freighter-first wallet auth foundation;
- signed wallet session API routes;
- local SQLite migration foundation.
- draft event create/update API routes;
- publish-to-marketplace DB stub;
- database-backed public marketplace and event detail pages;
- collaborator percentage split setup;
- gated resource setup;
- `QuorumPassNFT` Soroban contract;
- `QuorumCore` Soroban contract.
- local checkout/claim API route;
- local pass proof and purchase recording;
- marketplace metrics for minted passes and routed USDC.

Not implemented yet:

- live on-chain checkout transaction signing;
- live NFT mint transaction submission from the app;
- real on-chain check-in.

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
cargo test
stellar contract build
npm run contracts:deploy:testnet
```

## Planning Docs

- `TECHNICAL_SPEC.md`
- `DEVELOPMENT_PLAN.md`
- `docs/QUORUM_PM_GOAL_BRIEF.md`
