# Quorum

Quorum is a Stellar-native collaborative event checkout platform for Web3 events.

The MVP follows the locked direction in `TECHNICAL_SPEC.md` and `DEVELOPMENT_PLAN.md`: lightweight event platform surfaces, split payout escrow, non-transferable NFT event passes, gated resources, and role-based transparency dashboards.

## Current Status

Phase 1 scaffold is in progress.

Implemented in the app shell:

- public marketplace surface;
- featured demo event;
- event detail placeholder;
- dashboard placeholder;
- create event placeholder;
- pass page placeholder;
- gated resources placeholder;
- check-in placeholder.

Not implemented yet:

- wallet auth;
- database persistence;
- Soroban contracts;
- real checkout;
- real NFT minting;
- real on-chain check-in.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run lint
npm run build
```

## Planning Docs

- `TECHNICAL_SPEC.md`
- `DEVELOPMENT_PLAN.md`
- `docs/QUORUM_PM_GOAL_BRIEF.md`
