# Quorum

Quorum is a Stellar-native collaborative event checkout platform for Web3 events.

The MVP follows the locked direction in `TECHNICAL_SPEC.md` and `DEVELOPMENT_PLAN.md`: lightweight event platform surfaces, split payout escrow, non-transferable NFT event passes, gated resources, and role-based transparency dashboards.

## Current Status

Phase 3 is complete. The app can create and update local draft events with wallet-owned organizer identity, collaborator split validation, and gated resource setup.

Implemented in the app shell:

- public marketplace surface;
- featured demo event;
- event detail placeholder;
- dashboard placeholder;
- create event placeholder;
- pass page placeholder;
- gated resources placeholder;
- check-in placeholder;
- Freighter-first wallet auth foundation;
- signed wallet session API routes;
- local SQLite migration foundation.
- draft event create/update API routes;
- collaborator percentage split setup;
- gated resource setup.

Not implemented yet:

- Soroban contracts;
- real checkout;
- real NFT minting;
- real on-chain check-in.

## Local Development

```bash
npm install
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local` when you need local secrets. The default database path is `file:./data/quorum.db`.

## Verification

```bash
npm run db:migrate
npm run db:smoke
npm run lint
npm run build
npm audit --audit-level=moderate
```

## Planning Docs

- `TECHNICAL_SPEC.md`
- `DEVELOPMENT_PLAN.md`
- `docs/QUORUM_PM_GOAL_BRIEF.md`
