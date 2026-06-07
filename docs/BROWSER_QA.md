# Quorum Browser QA

Generated at: `2026-06-07T18:19:34Z`

This file records the latest local browser verification for the hackathon demo
surface. It complements `docs/DEMO_EVIDENCE.md`, which records command-based
verification.

## Environment

- App URL: `http://localhost:3040`
- Database setup: `npm run db:migrate` and `npm run db:seed`
- Seeded paid event: `APAC Stellar Builder Meetup`
- Seeded free event: `Stellar Open Office Hours`

## Desktop Viewport

- Viewport: `1280 x 720`
- Pages checked:
  - `/`
  - `/dashboard`
- Marketplace findings:
  - paid demo event rendered;
  - free demo event rendered;
  - primary CTA rendered;
  - no horizontal overflow.
- Dashboard findings:
  - `Transparency console` rendered;
  - `Wallet readiness` rendered;
  - `Contract readiness` rendered;
  - `Proof mode` rendered as `Local proof mode`;
  - no horizontal overflow.
- Console errors: none observed.

## Mobile Viewport

- Viewport: `390 x 844`
- Pages checked:
  - `/`
  - `/dashboard`
- Marketplace findings:
  - paid demo event rendered;
  - free demo event rendered;
  - primary CTA rendered;
  - no horizontal overflow.
- Dashboard findings:
  - `Transparency console` rendered;
  - `Wallet readiness` rendered;
  - `Proof queue` rendered;
  - `Local proof mode` rendered;
  - no horizontal overflow.
- Console errors: none observed.

## Remaining Boundary

Live testnet deployment and live transaction signing remain gated by a funded
`STELLAR_ACCOUNT`, deployed contract IDs, and explicit approval before signing.
