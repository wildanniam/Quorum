# Quorum Hackathon Submission Draft

Last reviewed: 2026-07-15.

This is the single source for copy, links, pitch structure, and claim boundaries
for Quorum's APAC Stellar Hackathon submission. The writing is ready to paste,
but the project is **not yet cleared for final submission**. Complete the
release gate at the end of this document and obtain Wildan's explicit approval
before submitting any form.

## Official Program Fit

The official
[APAC Stellar Hackathon page](https://www.risein.com/programs/apac-stellar-hackathon)
was reviewed on 2026-07-15. It asks for user-facing financial applications,
usable payment products, real utility, wallet integration, composability, and
connections to on/off-ramps. It lists 2026-07-15 as the final submission
deadline and a five-minute live pitch for finalists.

Quorum fits the payments and disbursements direction because its primary user
experience starts with an event purchase and ends with a verifiable settlement
balance for each collaborator. Stellar is part of the product's core money and
access flow, not a decorative integration. The optional MoneyGram path extends
that settlement toward cash-out, but remains an external dependency until the
provider approves the domain and a real pickup succeeds.

## Form-Ready Copy

### Project Name

Quorum

### One-Line Description

Quorum lets event collaborators lock revenue splits before sales, settle
testnet USDC through Soroban, and issue wallet-bound access passes.

### Short Description

Collaborative events bring organizers, speakers, venues, and partners into one
revenue flow, yet their split can still be agreed informally and reconciled
after sales. Quorum moves that agreement into checkout. A Soroban contract locks
the split before launch, credits each collaborator from testnet USDC purchases,
mints a non-transferable event pass, and exposes readable settlement, access,
and check-in proof.

### Extended Description

Quorum is a Stellar-native checkout and settlement layer for collaborative
events. In the workflow Quorum is designed for, an organizer, speaker, venue,
and community partner may all contribute to one event while the ticket revenue
still enters one account and is reconciled manually afterward. The hard part is
not only selling a ticket. It is enforcing the agreement made before sales and
giving every participant understandable proof of what happened.

An organizer configures the event and collaborator percentages while it is a
draft. Publishing locks that split in `QuorumCore`. When an attendee approves a
testnet USDC purchase, the Soroban contract moves the payment into escrow,
credits each collaborator's withdrawable balance, and mints a unique,
non-transferable pass through `QuorumPassNFT`. The same pass unlocks event
resources and supports check-in. A custom Soroban event indexer turns contract
events into scoped proof views for attendees, organizers, and collaborators,
while preserving links to explorer-verifiable transactions.

The product is publicly hosted and its contracts have completed a real Stellar
testnet lifecycle. That live transaction packet is historical because it ran
through an earlier app origin; a fresh Vercel-origin flow remains a release
gate. MoneyGram SEP-1, SEP-10, and SEP-24 boundaries are implemented and tested
in code, but provider approval and cash pickup are not proven.

### Category And Stage

- Category: user-facing financial application; payments and disbursements.
- Target users: Web3 event organizers, collaborators, and attendees.
- Stage: functional Stellar testnet MVP with a public hosted application.
- Network: Stellar testnet.

## The Problem

Quorum addresses a narrow coordination problem rather than claiming that every
event platform hides money:

1. Multiple people contribute to one event, but the revenue agreement may live
   in chat, a document, or a spreadsheet rather than in the checkout rule.
2. When one account receives the ticket revenue, each collaborator must trust a
   later manual reconciliation before they know what they earned.
3. Attendees need access proof, while collaborators need settlement proof; raw
   blockchain data alone is not an understandable product experience.
4. Payment, event access, check-in, and optional cash-out are often separate
   workflows even though they originate from the same purchase.

The valid product claim is therefore: **Quorum makes the pre-sale split
enforceable and turns one purchase into shared settlement and access proof.**

## The Solution

1. The organizer creates an event and defines wallet recipients and percentage
   shares while the event is still editable.
2. Publishing locks the split so the checkout rule cannot silently change after
   sales begin.
3. An attendee explicitly approves the testnet USDC transaction in Freighter.
4. `QuorumCore` escrows the payment and credits collaborator balances according
   to the locked rule; each collaborator withdraws their own balance.
5. `QuorumPassNFT` mints one wallet-bound, non-transferable pass for access,
   resources, and check-in.
6. Quorum's indexer and proof pages translate contract activity into event,
   attendee, and collaborator views without presenting app records as chain
   transactions.
7. A MoneyGram SEP flow can become an optional cash-out path after provider
   approval; it is not required for the core settlement proof.

## Why Stellar

- **USDC settlement:** the event purchase and collaborator accounting use a
  real Stellar testnet asset rather than an app-only points balance.
- **Soroban programmability:** the split, escrow balance, pass issuance, and
  check-in state are enforced by two purpose-built contracts.
- **Wallet authorization:** users approve the financial action themselves;
  Quorum does not custody or store wallet secrets.
- **Composable proof:** RPC events, Horizon transaction history, and the custom
  indexer let the product connect readable UI evidence to the underlying chain.
- **Anchor compatibility:** SEP-based provider boundaries create a path from
  on-chain settlement to cash-out without making an unapproved provider the
  core dependency.

## Technical Architecture

| Layer | Responsibility | Submission status |
| --- | --- | --- |
| Next.js product | Landing, discovery, event setup, checkout, passes, resources, check-in, ledger, and evidence views | Current hosted |
| Supabase Postgres | Event metadata, sessions, proof read models, indexer cursor, and anchor state | Current hosted; server-side only |
| `QuorumCore` | Event configuration, testnet USDC escrow, split balances, purchase/claim, withdrawal, and check-in | Historically live on Stellar testnet |
| `QuorumPassNFT` | Unique non-transferable wallet-bound event passes | Historically live on Stellar testnet |
| Soroban indexer | Authenticated ingestion of contract events with monotonic cursor and idempotent persistence | Current hosted and verified in code; awaiting a fresh event |
| MoneyGram boundary | SEP-1 discovery, SEP-10 authentication, SEP-24 interactive flow, eligibility, and status handling | Verified in code; external provider approval pending |

### Technical Differentiators

- The split is a pre-sale execution rule, not a post-event reporting field.
- A purchase credits explicit withdrawable contract balances; Quorum does not
  claim that funds appear instantly in every recipient wallet.
- Payment, pass ownership, resources, and check-in share one event identity.
- Proof is classified as app evidence, indexed contract evidence, or
  explorer-verifiable transaction evidence.
- The hosted indexer fails closed without its cron secret and preserves a
  monotonic ledger cursor.
- The MoneyGram eligibility guard refuses local or mock settlement references.

## Current Evidence And Honest Boundaries

| Claim class | What is proven | What remains open |
| --- | --- | --- |
| Current hosted | Public Vercel app, contract configuration, production schema, healthy evidence route, protected indexer, and responsive local release QA | A fresh Vercel-origin signed transaction packet is not complete |
| Historically live | Contract deployment and real testnet publish, paid checkout, free claim, check-in, and collaborator withdrawal on 2026-07-04 | The app URLs in that packet belong to the historical ngrok origin |
| Verified in code | Contract tests and deterministic wallet, XDR, lifecycle, indexer, proof, and MoneyGram SEP smoke tests | These checks do not replace a hosted signed transaction or provider pickup |
| External dependency | MoneyGram integration boundary is implemented | Domain/wallet approval and successful cash pickup are not proven |

### Explicit Non-Claims

- Quorum is not mainnet production software.
- The current Vercel-origin signed flow is not complete.
- An advancing indexer cursor is not the same as an indexed Quorum event.
- MoneyGram provider approval and cash pickup are not complete or proven.
- The historical ngrok transaction packet is not current Vercel evidence.
- Quorum does not claim that all existing event platforms conceal revenue.
- Event end time is enforced by Quorum's server and UI policy, not by the
  currently deployed contract.

## Judge-Safe Links

- Product: https://quorum-sandy-eight.vercel.app
- Discover: https://quorum-sandy-eight.vercel.app/discover
- Evidence: https://quorum-sandy-eight.vercel.app/evidence
- Contract status: https://quorum-sandy-eight.vercel.app/api/contracts/status
- Repository: https://github.com/wildanniam/Quorum
- Proof inventory:
  https://github.com/wildanniam/Quorum/blob/main/docs/HACKATHON_PROOF_INVENTORY.md
- Historical testnet flow:
  https://github.com/wildanniam/Quorum/blob/main/docs/LIVE_TESTNET_EVIDENCE.json
- Testnet deployment evidence:
  https://github.com/wildanniam/Quorum/blob/main/docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json

### Testnet Contract IDs

- `QuorumCore`:
  `CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV`
- `QuorumPassNFT`:
  `CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH`
- Testnet USDC asset contract:
  `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`

## Five-Minute Pitch

### 0:00-0:35 - Problem

"A collaborative event may have an organizer, speaker, venue, and community
partner, but the checkout still tends to pay one account. The split is then
reconciled manually. Quorum makes the agreement enforceable before the first
ticket is sold."

### 0:35-1:05 - Product Promise

"Quorum combines collaborative checkout, testnet USDC settlement, a
wallet-bound pass, and readable proof in one event flow."

### 1:05-2:20 - Product Demo

1. Open the landing page, then Discover.
2. Open a published event and show the price, capacity, and locked split.
3. Open checkout and show the exact asset, network, and pass outcome.
4. Use only a previously recorded pass unless the fresh signing run has been
   explicitly approved.

### 2:20-3:15 - Access And Settlement

1. Open the pass and gated resource state.
2. Show event-scoped proof and the collaborator ledger.
3. Explain the difference between app, indexed, and explorer-verifiable proof.

### 3:15-4:20 - Stellar Architecture

1. Show the deployed core, pass, and USDC IDs in the contract-status endpoint.
2. Explain escrow, withdrawable balances, non-transferable passes, and the
   custom Soroban event indexer.
3. Describe MoneyGram as a provider-dependent extension, not completed pickup
   evidence.

### 4:20-5:00 - Close

"Quorum turns a ticket purchase into a shared financial agreement: one locked
split, one wallet-bound access credential, and proof each participant can
verify. The next production step is provider-approved cash-out and mainnet-grade
compliance, not a redesign of the core flow."

## Demo Video Shot List

1. Landing page and Discover navigation.
2. Published event detail with price, capacity, and collaborator split.
3. Checkout review showing Stellar testnet and USDC.
4. Pass ownership, gated resource, and check-in state.
5. Event proof timeline and collaborator ledger.
6. Contract-status endpoint with all three contract IDs.
7. Explorer pages for the approved evidence packet, clearly labeled historical
   unless a fresh current-origin flow has replaced it.
8. MoneyGram UI only as a provider-pending integration; do not stage or imply a
   successful pickup.

The demo video URL is **Not recorded**. Do not submit an invented or placeholder
URL.

## Final Submission Checklist

| Item | Status | Required action |
| --- | --- | --- |
| Form-ready product copy | Ready | Paste from this document without weakening the claim boundaries |
| Public product URL | Ready | Use the Vercel product link above |
| Public repository URL | Ready | Use the GitHub repository link above |
| Contract IDs and historical hashes | Ready | Cross-check against the evidence JSON before submission |
| Current Vercel-origin signed flow | Not complete | Obtain explicit approval for every Freighter transaction, then record the resulting URLs, hashes, token, and wallets |
| Hosted indexer proof for that flow | Not complete | Run the authenticated indexer after the signed flow and verify matching rows |
| Cross-surface evidence reconciliation | Not complete | Confirm evidence, event proof, pass, ledger, and Explorer all reference the same flow |
| Final source/evidence gate | Not complete | Run `npm run readiness:final` on the release commit |
| Demo video URL | Not recorded | Record, review, upload, and verify the public link |
| MoneyGram approval/pickup | External and optional | Keep provider-pending wording unless genuine approval and pickup evidence arrives |
| Explicit final approval | Not granted | Wildan must approve the exact final package before submission |
| Final submission state | **NO-GO** | Change only after every mandatory row above is complete |

Team/member metadata and any account-specific form fields must be entered by the
project owner. They must not be guessed from repository history.

## Release Gate

The submission becomes eligible for final approval only after this sequence:

1. Complete one fresh Vercel-origin testnet flow with explicit human approval
   for each wallet signature.
2. Run the authenticated hosted indexer and prove it captured that flow.
3. Reconcile the event URL, transaction hashes, token ID, wallets, proof rows,
   and collaborator ledger.
4. Run `npm run readiness:final` and preserve the passing output.
5. Record and review the five-minute demo video; verify every public URL.
6. Update this draft only with evidence-backed facts.
7. Obtain Wildan's explicit approval for the exact package, then submit.
