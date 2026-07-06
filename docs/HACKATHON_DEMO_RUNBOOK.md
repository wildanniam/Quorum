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
npm run wallet:auth:smoke
npm run api:origin:smoke
npm run demo:smoke
npm run demo:live-policy
npm run browser:qa
npm run deploy:env:smoke
npm run live:args:smoke
npm run live:flow:smoke
npm run live:persistence:smoke
npm run live:preflight:smoke
npm run live:signing:smoke
npm run live:submission:smoke
npm run live:xdr:smoke
npm run live:evidence:template
npm run live:browser-flow:smoke
npm run live:ui-wiring:smoke
npm run contracts:test
npm run contracts:build
npm run contracts:doctor
npm run evidence:local
npm run readiness:audit
```

The generated evidence is stored in `docs/DEMO_EVIDENCE.md`.
The latest local browser QA notes are stored in `docs/BROWSER_QA.md`.
The DB smoke verifies Postgres CRUD/cascade behavior, partial unique live proof
indexes, and the global live proof hash registry that keep event IDs and
transaction hashes from being replayed.
The wallet auth smoke verifies the real HTTP challenge, signature verification,
session cookie, `/api/me`, and logout routes using a local test keypair without
opening Freighter.
The API origin smoke verifies cookie-backed POST/PATCH routes reject
cross-origin mutation attempts while allowing same-origin and forwarded hosted
requests.
After an explicitly approved live testnet run, record public-only deployment
and transaction evidence in `docs/LIVE_TESTNET_EVIDENCE.json` and run
`npm run live:evidence:audit`. The committed
`docs/LIVE_TESTNET_EVIDENCE.example.json` is the required shape for that packet.
Use `docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md` during the approved browser
signing session so each Freighter prompt is checked against the expected wallet
role, contract method, amount, and evidence field before approval.
Filled live evidence must use public HTTPS hosted URLs; the audit rejects
localhost, private network, non-HTTPS URLs, reused transaction hashes,
mismatched check-in token evidence, proof URLs outside the hosted app origin,
and zero-value withdrawal evidence.
The live policy smoke verifies fake configured contract IDs require live
transaction submission, exposes non-signing live action prepare responses, and
rejects invalid signed XDR before persistence without creating local proof
records. It also verifies the preflight route rejects invalid requests before
touching RPC.
The live args smoke verifies deterministic contract arguments plus USDC
decimal-to-atomic and atomic-to-decimal conversion for live proof storage.
The live XDR smoke verifies pre-simulation unsigned Soroban transaction
templates without signing or submission.
The live flow smoke verifies mock full live publish, paid checkout, free claim,
check-in, and withdraw chains from prepared DB action to preflight, mock
Freighter signing, mock RPC finality, decoded return values, and post-success
persistence through `live-result-persistence.ts` without submitting to testnet.
The live persistence smoke verifies the post-RPC-success DB recording path for
real transaction hashes, rejects local `stub:` hashes, rejects replayed live
proof hashes across publish/pass/check-in/withdrawal records, and protects live
withdrawal evidence from amounts above the collaborator's withdrawable balance.
The live preflight smoke verifies signer sequence lookup and RPC
prepare/simulation orchestration with a mock RPC server, without signing.
The live signing smoke verifies the Freighter signing adapter with a mock
signer, including prepared XDR source/contract/function/argument guards before
wallet signing, without opening Freighter or requesting a real wallet signature.
The live submission smoke verifies signed transaction submission and finality
polling with a mock RPC server, including purchase token ID and withdraw amount
return value decoding plus source wallet and contract/function/argument mismatch
rejection before RPC, without submitting to testnet.
The live browser flow smoke verifies the client-side preflight, Freighter
signing, and signed-XDR submit sequence with mock fetch and signer boundaries,
including encoded argument mismatch rejection before signing.
The live UI wiring smoke verifies publish, checkout, check-in, and withdraw
buttons call that helper when the server reports `live_required`.
The contract tests verify Soroban proof events for event creation, pass
purchase/claim/mint, balance credit, withdraw, and check-in.

## Live Testnet Boundary

Live contract deployment and transaction signing are intentionally gated by a
funded Stellar identity.

Before live deployment:

```bash
export STELLAR_NETWORK=testnet
export QUORUM_SESSION_SECRET=<hosted-session-secret-32-plus-chars>
export STELLAR_ACCOUNT=<funded-identity-or-secret>
export QUORUM_LIVE_SIGNING_APPROVED=I_APPROVE_TESTNET_SIGNING
export ADMIN_ADDRESS=<admin-public-key>
export QUORUM_PLATFORM_FEE_BPS=0
npm run contracts:doctor
npm run contracts:deploy:testnet
export NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID=<deployed-pass-contract-id>
export NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID=<deployed-core-contract-id>
export NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID=<confirmed-testnet-usdc-contract-id>
npm run contracts:init:testnet
```

Until those values are configured, the web app uses local proof records that
mirror the contract flow.
The hosted app must use a non-placeholder `QUORUM_SESSION_SECRET` of at least
32 characters; `npm run deploy:env:smoke` verifies this guard without cloud
credentials.
The deploy/init scripts refuse to sign unless
`QUORUM_LIVE_SIGNING_APPROVED=I_APPROVE_TESTNET_SIGNING` is set after explicit
approval.
They also refuse non-testnet deployment networks; keep
`STELLAR_NETWORK=testnet` for the approved hackathon deployment path.
They refuse non-zero `QUORUM_PLATFORM_FEE_BPS` unless
`QUORUM_NONZERO_PLATFORM_FEE_APPROVED=I_APPROVE_NONZERO_PLATFORM_FEE` is set
after explicit product approval for a fee-policy change.
The final live evidence packet must record the pass deploy, core deploy, pass
init, core init, and pass `set_core` transaction hashes.

## Submission Evidence Checklist

- `docs/DEMO_EVIDENCE.md`
- `docs/BROWSER_QA.md`
- `docs/MVP_READINESS.md`
- contract WASM hashes from `npm run contracts:build`
- `docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md` for approved browser wallet signing
- `docs/LIVE_SIGNING_HANDOFF.md` for the remaining live transaction handoff
- `docs/LIVE_TESTNET_EVIDENCE.example.json` as the machine-readable checklist
  for approved live deployment and Freighter-signed transaction evidence
- screenshot or short clip of marketplace, checkout, pass page, resources,
  check-in, dashboard, and withdrawal proof
- deployed URL and contract IDs once funded deployment is approved
