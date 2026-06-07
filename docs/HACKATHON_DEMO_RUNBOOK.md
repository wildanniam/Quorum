# Quorum Hackathon Demo Runbook

This runbook is for presenting the Quorum MVP without hidden setup steps.

## Demo Positioning

Quorum is a Stellar-native collaborative event checkout layer for Web3 events.
The demo proves:

- public paid/free event marketplace;
- wallet-only session;
- collaborator split transparency;
- unique non-transferable pass proof;
- gated resources;
- organizer check-in;
- collaborator withdrawal proof;
- Soroban contracts built and tested for the live version.

## Local Setup

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

The seed command creates:

- `APAC Stellar Builder Meetup`, paid, `5 USDC`, split `70/20/10`;
- `Stellar Open Office Hours`, free, split `100%` organizer.

## Demo Personas

Use Freighter for the visual wallet demo. The seeded local proof data uses these
public addresses for role matching:

| Role | Address |
|---|---|
| Organizer | `GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF` |
| Speaker collaborator | `GC33PRL24QY6EUIHOJT6ITM34QHBJOIFXO4UBL3AS2RECIDIPFAF6YDH` |
| Community partner | `GBUSN4MX7AE3RKAR4DEJEELBAQ4CZ3Q6PZ4QEU7RW3SQ7OX6ZFSIDGER` |

For a live Freighter demo, connect whatever test wallet is available; the app
uses the connected wallet as the attendee/organizer session.

## Five Minute Flow

1. Marketplace
   - Open `/`.
   - Show the paid APAC event and free office-hours event.
   - Point out published-only marketplace and proof stats.

2. Paid event
   - Open `/events/apac-stellar-builder-meetup`.
   - Show split transparency, capacity, resources, and single pass per wallet.
   - Click checkout.

3. Checkout and pass
   - Connect Freighter or use the local smoke flow for proof.
   - Claim/buy pass.
   - Show `/passes/[tokenId]`: unique pass, owner wallet, tx-like proof, checked-in status.

4. Gated resources
   - Open `/events/apac-stellar-builder-meetup/resources`.
   - Without a pass session it shows locked.
   - With the pass owner session it shows unlocked resources.

5. Check-in
   - Open `/check-in/evt_apac_stellar_builder_meetup`.
   - Enter the token ID.
   - Organizer check-in records a proof hash and updates the pass page.

6. Dashboard transparency
   - Open `/dashboard`.
   - Show organizer events, routed USDC, collaborator balances, attendee passes,
     and proof queue.
   - Use the collaborator withdraw action to record a local withdrawal proof.

## Free Claim Flow

Open `/events/stellar-open-office-hours`.

The free event proves claim mode:

- CTA says `Claim pass`;
- pass source is `free_claim`;
- recorded amount is `0`;
- duplicate claim is rejected for the same wallet.

## Verification Before Presenting

```bash
npm run db:migrate
npm run db:seed
npm run lint
npm run build
npm run demo:smoke
npm run demo:live-policy
npm run contracts:test
npm run contracts:build
npm run contracts:doctor
npm run evidence:local
```

The generated evidence is stored in `docs/DEMO_EVIDENCE.md`.
The latest local browser QA notes are stored in `docs/BROWSER_QA.md`.
The live policy smoke verifies fake configured contract IDs require live
transaction submission and do not create local proof records.

## Live Testnet Boundary

Live contract deployment and transaction signing are intentionally gated by a
funded Stellar identity.

Before live deployment:

```bash
export STELLAR_NETWORK=testnet
export STELLAR_ACCOUNT=<funded-identity-or-secret>
export ADMIN_ADDRESS=<admin-public-key>
export QUORUM_PLATFORM_FEE_BPS=0
npm run contracts:doctor
npm run contracts:deploy:testnet
export NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID=<deployed-pass-contract-id>
export NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID=<deployed-core-contract-id>
npm run contracts:init:testnet
```

Until those values are configured, the web app uses local proof records that
mirror the contract flow.

## Submission Evidence Checklist

- `docs/DEMO_EVIDENCE.md`
- `docs/BROWSER_QA.md`
- `docs/MVP_READINESS.md`
- contract WASM hashes from `npm run contracts:build`
- screenshot or short clip of marketplace, checkout, pass page, resources,
  check-in, dashboard, and withdrawal proof
- deployed URL and contract IDs once funded deployment is approved
