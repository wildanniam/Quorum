# Quorum

![Quorum cover](docs/assets/readme/quorum-cover.webp)

<p align="center">
  <strong>Collaborative event checkout, settlement, and access on Stellar.</strong>
</p>

<p align="center">
  <a href="https://quorum-sandy-eight.vercel.app"><img alt="Open Quorum" src="https://img.shields.io/badge/Open_Quorum-Live_demo-67E8F9?style=for-the-badge&labelColor=0B0D0E"></a>
  <a href="https://quorum-sandy-eight.vercel.app/api/contracts/status"><img alt="Stellar testnet" src="https://img.shields.io/badge/Stellar-Testnet-FFFFFF?style=for-the-badge&labelColor=0B0D0E"></a>
  <a href="https://www.risein.com/programs/apac-stellar-hackathon"><img alt="APAC Stellar Hackathon" src="https://img.shields.io/badge/APAC_Stellar_Hackathon-Payment_%26_Consumer_Apps-67E8F9?style=for-the-badge&labelColor=0B0D0E"></a>
</p>

Events are collaborative. Their payouts usually are not.

Quorum is a Stellar-native platform for independent event teams that need to
sell access, share revenue, and prove what happened without turning one
organizer into the team's accountant. Before an event goes live, the organizer
defines each collaborator wallet and percentage. A paid checkout then becomes
four connected outcomes:

> **Payment. Revenue split. Event pass. Verifiable proof.**

Attendees receive a non-transferable, wallet-bound pass. Collaborators receive
claimable USDC balances according to the published split. Organizers can verify
passes at the door, and every participant can inspect the evidence relevant to
them.

## Quick Links

| Resource | Link |
| --- | --- |
| Live application | [quorum-sandy-eight.vercel.app](https://quorum-sandy-eight.vercel.app) |
| Discover events | [Open Discover](https://quorum-sandy-eight.vercel.app/discover) |
| Public evidence ledger | [Open Evidence](https://quorum-sandy-eight.vercel.app/evidence) |
| Deployed contract status | [Open contract status](https://quorum-sandy-eight.vercel.app/api/contracts/status) |
| Judge demo sequence | [Hackathon demo runbook](docs/HACKATHON_DEMO_RUNBOOK.md) |
| Claim-to-proof map | [Hackathon proof inventory](docs/HACKATHON_PROOF_INVENTORY.md) |

## The Product

Quorum connects three groups that existing event workflows often leave
financially disconnected.

| User | What Quorum gives them |
| --- | --- |
| **Organizer** | A studio for paid or free events, collaborator splits, gated resources, publishing, and check-in. |
| **Attendee** | A simple USDC checkout or free claim followed by a wallet-bound pass, resource access, and door QR. |
| **Collaborator** | A wallet-scoped ledger for earned, withdrawable, and withdrawn balances with event-level proof. |

The result is not another discovery-only ticketing site. Quorum is the
financial coordination layer between event checkout, collaborator settlement,
access, and proof.

## How It Works

1. **Create the event.** The organizer defines the story, schedule, capacity,
   price, and gated resources.
2. **Publish the agreement.** Collaborator wallets and percentages are included
   in the event definition signed through Freighter.
3. **Buy or claim a pass.** Paid events settle in testnet USDC; free events use
   the same ownership and access flow without payment.
4. **Allocate the revenue.** `QuorumCore` escrows the payment and records each
   collaborator's claimable balance from the predefined split.
5. **Issue access.** `QuorumPassNft` creates one non-transferable pass per wallet
   and event.
6. **Prove the lifecycle.** Publish, checkout, pass, check-in, withdrawal, and
   indexed contract activity appear in readable proof surfaces.
7. **Withdraw independently.** Each collaborator signs their own withdrawal
   instead of waiting for the organizer to reconcile transfers manually.

## Product Preview

| Discover | Checkout |
| --- | --- |
| ![Quorum event discovery](docs/assets/readme/discover.webp) | ![Quorum USDC checkout](docs/assets/readme/checkout.webp) |

<details>
  <summary><strong>Open the public evidence ledger preview</strong></summary>
  <br>
  <img alt="Quorum public evidence ledger" src="docs/assets/readme/evidence.webp">
</details>

## Why Stellar

Quorum uses Stellar for the parts of an event where shared truth matters most:
money, ownership, authorization, and evidence.

| Stellar layer | Quorum integration | User outcome |
| --- | --- | --- |
| **Testnet USDC** | Settlement asset for paid event purchases | A stable unit for ticket price, split accounting, and collaborator withdrawal |
| **Soroban: `QuorumCore`** | Event creation, capacity, purchase, revenue allocation, withdrawal, and check-in | The published revenue agreement executes consistently for every purchase |
| **Soroban: `QuorumPassNft`** | One non-transferable pass per wallet and event | Ownership, gated access, and check-in remain tied to the attendee wallet |
| **Freighter** | Wallet authentication and explicit transaction signing | No live action is signed without the user's approval |
| **RPC, Horizon, and custom indexer** | Submission, finality checks, event ingestion, and Explorer validation | Contract activity becomes readable evidence instead of raw transaction data |
| **SEP-1, SEP-10, and SEP-24** | MoneyGram Ramps-compatible cash-out path | A route from eligible USDC settlement toward real-world cash access when provider access is available |

## Architecture

```mermaid
flowchart LR
    organizer["Organizer"] --> studio["Quorum Studio"]
    attendee["Attendee"] --> checkout["Checkout / Free claim"]
    collaborator["Collaborator"] --> walletLedger["Wallet ledger"]

    studio --> wallet["Freighter approval"]
    checkout --> wallet
    walletLedger --> wallet
    wallet --> api["Next.js transaction orchestration"]

    api --> core["QuorumCore<br/>Soroban contract"]
    core --> usdc["Stellar testnet USDC"]
    core --> pass["QuorumPassNft<br/>Soroban contract"]
    core --> events["Soroban contract events"]
    pass --> events

    events --> indexer["Custom event indexer"]
    indexer --> db["PostgreSQL / Supabase"]
    db --> proof["Global evidence<br/>Event proof<br/>Pass receipt<br/>Collaborator ledger"]
    proof --> explorer["Stellar Explorer verification"]
```

### Contract responsibilities

**`QuorumCore`**

- validates that collaborator splits total 100%;
- creates paid and free event definitions;
- prevents duplicate purchases and enforces capacity;
- receives testnet USDC and allocates claimable collaborator balances;
- lets collaborators withdraw their own balance;
- authorizes organizer check-in and emits lifecycle events.

**`QuorumPassNft`**

- mints only when called by `QuorumCore`;
- enforces one pass per wallet and event;
- stores the owner, event, metadata fingerprint, and check-in state;
- rejects transfers by design.

The contract source and tests live in [`contracts/`](contracts/).

## What Judges Can Verify

Quorum deliberately separates different levels of proof instead of presenting
every database record as an on-chain transaction.

- **Global evidence** shows activity across Quorum with clear provenance labels.
- **Event proof** isolates the lifecycle of one event.
- **Pass receipts** connect wallet ownership, token ID, resources, QR, and
  check-in state.
- **Collaborator ledgers** show wallet-scoped split credits and withdrawal
  debits.
- **Explorer links** appear only when a valid Stellar transaction hash exists.
- **Contract status** exposes the configured network, contract IDs, USDC asset,
  and live-action policy without requiring a signature.

Start with the [live application](https://quorum-sandy-eight.vercel.app), then
follow the [judge demo sequence](docs/HACKATHON_DEMO_RUNBOOK.md). Claim-level
status and supporting artifacts are recorded in the
[proof inventory](docs/HACKATHON_PROOF_INVENTORY.md).

## Hackathon Build Status

The current MVP includes:

- a hosted Next.js product on Vercel;
- custom core and pass contracts deployed on Stellar testnet;
- paid checkout and free-claim flows;
- predefined collaborator splits and independent withdrawal;
- wallet-bound passes, gated resources, QR, and organizer check-in;
- public, event-scoped, pass-scoped, and wallet-scoped evidence;
- a protected Soroban event indexer with Vercel Cron integration;
- server-side PostgreSQL persistence backed by Supabase in the hosted release;
- deterministic contract, settlement, wallet, indexer, anchor, browser, and
  release-gate verification.

### Honest boundaries

- Quorum is a hackathon MVP running on **Stellar testnet**, not audited mainnet
  production software.
- The MoneyGram-compatible SEP integration is implemented, but provider
  allowlist approval and a completed cash pickup are not claimed.
- App proof, indexed proof, and Explorer-verifiable Stellar transactions remain
  visibly distinct.
- The latest dated readiness state is maintained in
  [`docs/MVP_READINESS.md`](docs/MVP_READINESS.md), not duplicated here.

## Run Locally

### Prerequisites

- Node.js 20 or later
- npm
- PostgreSQL 15 or later, or a Supabase PostgreSQL connection
- Freighter only when testing explicit wallet signing
- Stellar CLI only when building or testing contracts

### Setup

```bash
git clone https://github.com/wildanniam/Quorum.git
cd Quorum
npm install
cp .env.example .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The default local database URL in `.env.example` is
`postgresql://postgres:postgres@127.0.0.1:5432/quorum`. Set `DATABASE_URL` to a
different local or Supabase pooled connection when needed. Supabase is used as
server-side PostgreSQL only; browser-exposed service keys are neither required
nor expected.

For hosted configuration, contract IDs, indexer secrets, and anchor settings,
use the [production environment handoff](docs/PRODUCTION_ENV_HANDOFF.md).

## Verification

Run the core source checks:

```bash
npm run lint
npm run build
npm run contracts:test
npm run submission:gate
```

Useful focused suites:

```bash
npm run demo:smoke
npm run wallet:auth:smoke
npm run settlement:smoke
npm run indexer:security:smoke
npm run anchor:eligibility:smoke
npm run browser:qa
```

`npm run submission:gate` is non-destructive and deliberately excludes wallet
signing, provider execution, deployment, hosted cron mutation, and production
database writes. Live testnet actions always require explicit approval and a
Freighter confirmation.

See [`docs/MVP_READINESS.md`](docs/MVP_READINESS.md) for the full verification
matrix and release gates. Fresh hosted evidence is validated with
`npm run live:evidence:audit:current` and `npm run live:evidence:network` before
running the strict final gate, `npm run readiness:final`. Readiness is claimed
only when all three pass on the release commit.

## Technology

| Area | Stack |
| --- | --- |
| Product | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Interaction | Motion, GSAP, Base UI, Embla Carousel, Lucide |
| Stellar | Stellar SDK, Freighter API, Soroban Rust contracts |
| Data | PostgreSQL, Supabase, custom Soroban event indexer |
| Hosting | Vercel, protected Vercel Cron ingestion |
| Quality | ESLint, Playwright, Rust contract tests, deterministic smoke suites |

## Repository Map

```text
src/app/        Next.js routes, product pages, and API endpoints
src/components/ Shared UI, wallet interactions, evidence, and product primitives
src/lib/        Event, database, Stellar, auth, indexer, ledger, and anchor logic
contracts/      QuorumCore and QuorumPassNft Soroban contracts
scripts/        Smoke tests, evidence checks, deployment guards, and operations
docs/           Architecture decisions, runbooks, readiness, and proof artifacts
```

## Documentation

- [Technical specification](TECHNICAL_SPEC.md)
- [Development plan](DEVELOPMENT_PLAN.md)
- [Soroban architecture spike](docs/SOROBAN_SPIKE.md)
- [Contract deployment guide](docs/CONTRACT_DEPLOYMENT.md)
- [Hackathon demo runbook](docs/HACKATHON_DEMO_RUNBOOK.md)
- [Hackathon proof inventory](docs/HACKATHON_PROOF_INVENTORY.md)
- [MoneyGram anchor runbook](docs/MONEYGRAM_ANCHOR_RUNBOOK.md)
- [Current MVP readiness](docs/MVP_READINESS.md)

---

Built for the **APAC Stellar Hackathon** in the **Payment & Consumer
Applications** track.
