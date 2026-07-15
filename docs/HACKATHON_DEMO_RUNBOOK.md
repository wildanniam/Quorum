# Quorum Hackathon Demo Runbook

Last reviewed: 2026-07-15.

This runbook follows the product that exists now. It does not treat the landing
page as the marketplace, does not require hidden local setup, and never presents
historical or local proof as a fresh hosted transaction.

## One-Sentence Positioning

Quorum is a Stellar-native event checkout and settlement layer that lets an
organizer define collaborator revenue shares before ticket sales, issue
wallet-bound passes, and expose readable proof from checkout through settlement.

## What To Emphasize

1. **The split is agreed before sales.** Ticket revenue is not a private manual
   spreadsheet after the event.
2. **Access and payment share one flow.** A successful purchase produces a
   wallet-bound event pass used for resources and check-in.
3. **Proof has levels.** Quorum visibly separates app records, indexed contract
   events, and explorer-verifiable Stellar transactions.
4. **Cash-out is downstream of settlement.** MoneyGram is an optional provider
   integration, not the core proof of Quorum and not a completed claim while
   provider approval is pending.

## Pre-Demo Gate

Do not start the judge demo until all mandatory rows are green:

| Gate | Required result |
| --- | --- |
| Landing, discover, selected event, checkout, pass, proof, ledger | HTTP 200 |
| `/api/contracts/status` | Expected contract IDs, testnet network, RPC reachable |
| Production migration status | No missing repository migration |
| Evidence page | Loads records or a legitimate empty state, not a data-service error |
| Candidate quality suite | Lint, build, targeted smokes pass |
| Browser QA | Desktop, tablet, mobile pass with no horizontal overflow |
| Final evidence audit | `npm run live:evidence:audit:current`, `npm run live:evidence:network`, and `npm run readiness:final` pass on the release commit |

If the evidence data service is degraded, use the historical proof packet for a
technical review but do not pretend the final hosted flow is ready.

## Five-Minute Judge Flow

### 1. Start With The Product, Not The Console

Open `/`.

- Explain the collaborative payment problem in one sentence.
- Use **Start Splitting** or **Discover** to enter the application.
- Avoid opening technical status pages first.

### 2. Show A Real Event Decision

Open `/discover`, then a published event.

- Show time, location, capacity, price, and lifecycle state.
- Show the collaborator split before checkout.
- Explain that ended events remain readable but sales close automatically.

### 3. Show Checkout And The Pass Outcome

Open `/events/[slug]/checkout`.

- Point out the exact amount, network, and wallet-bound pass result.
- If a fresh signing run was approved, connect Freighter and approve only the
  transaction described in the signing runbook.
- Otherwise, use an already recorded pass and do not simulate a wallet prompt.

Open `/passes/[tokenId]`.

- Show owner wallet, event, source, and proof classification.
- If an Explorer button exists, open it; if it does not, call the row app proof.

### 4. Show Access And Settlement Transparency

Open `/events/[slug]/resources` with the pass-owning wallet session, then open
`/events/[slug]/proof`.

- Show that resources depend on pass ownership.
- Show that event proof contains only rows for this event.
- Open technical details for one row and explain whether it is app, indexed, or
  explorer-verifiable proof.

Open `/dashboard/ledger` with a collaborator wallet.

- Show earned, settled, and available balances.
- Keep event-level proof separate from wallet-scoped credit/debit history.

### 5. Close With Stellar And The Boundary

Open `/api/contracts/status` only at the end.

- Show the deployed core, pass, and USDC contract IDs.
- Explain that wallet transactions require explicit Freighter approval.
- Describe MoneyGram as a testnet cash-out integration whose provider approval
  is pending unless a real provider response is available that day.

## Optional Fresh Testnet Flow

This is not autonomous. It requires Wildan's explicit approval and manual
Freighter confirmation for each transaction.

1. Organizer creates a future event draft.
2. Organizer publishes the event on testnet.
3. Attendee wallet buys or claims a pass.
4. Organizer checks in that exact token.
5. Collaborator withdraws a non-zero balance.
6. Indexer ingests the resulting contract events.
7. Record the current Vercel event URL, proof URL, pass URL, unique transaction
   hashes, token ID, and withdrawal amount.

Use `docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md` for the approval sequence and
`docs/LIVE_TESTNET_EVIDENCE.example.json` for the evidence shape. After the
public packet is recorded, run `npm run live:evidence:audit:current`; the
historical audit alone is not sufficient for the final release gate. Then run
`npm run live:evidence:network` to prove the recorded hashes and USDC effects on
Stellar testnet.

## MoneyGram Rule

- If approval is still pending: show the provider-dependent UI state and explain
  the SEP-1/10/24 architecture. Do not promise pickup.
- If approval arrives: start only from an explorer-verifiable settlement and
  record the provider response separately from the Stellar settlement proof.
- Never use a mock reference as evidence of MoneyGram execution.

## Fallback Without Signing

If a judge session cannot sign:

1. show the current product flow through checkout review;
2. use the recorded pass/proof pages from the approved evidence packet;
3. open Stellar Explorer links from that packet;
4. show contract tests and deterministic smoke output;
5. state exactly which proof is historical and which deployment is current.

## Final Capture List

- landing page at desktop and mobile;
- discover and selected event;
- checkout review before wallet approval;
- pass receipt with proof classification;
- gated resource state;
- event proof timeline;
- collaborator ledger;
- contract status response;
- Stellar Explorer transaction pages for the fresh approved flow;
- MoneyGram provider state only if it is genuine.
