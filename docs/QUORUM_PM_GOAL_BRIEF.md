# Quorum PM Goal Brief

## Purpose

This brief defines the goal, acceptance criteria, and working expectations for producing Quorum's Technical Specification and Detailed Development Plan.

This is not the final technical spec. It is the PM-level assignment for a senior software engineer who will write the technical spec and implementation plan before development starts.

## Product Context

Quorum is a Stellar-native collaborative event checkout platform for Web3 events.

The product should not become a full Luma clone, generic payment link tool, or generic NFT ticketing app. Its core value is the money and access layer for collaborative events:

- sell event access;
- split revenue transparently between organizer, speaker, partner, and future platform fee;
- mint non-transferable NFT event passes;
- verify attendee access and check-in;
- expose payout and access proof through role-based dashboards.

Primary framing:

> Luma helps one organizer run an event. Quorum helps multiple collaborators build, monetize, and verify an event together.

## Locked Product Decisions

The technical spec and development plan must preserve these decisions unless a documented technical finding proves they are unsafe or infeasible.

- Target first user: Web3 organizer.
- Demo scenario: paid Web3 builder meetup plus mini-workshop/resource access.
- Product shape: collaborative event checkout platform with lightweight event platform surfaces.
- Supported event types in the data model: meetup, workshop, cohort, side event, webinar, and resource access.
- MVP event lifecycle: Draft -> Published.
- Published events are public in the MVP.
- MVP supports paid and free events.
- MVP uses a single pass per event.
- One wallet can own at most one pass per event.
- Split is editable during draft and locked after publish.
- Refunds are out of scope for MVP.
- Ticket tiers, resale, transfer, fiat checkout, email reminders, calendar sync, and full CRM are out of scope.
- Wallet auth only; no email/password auth.
- Wallet integration uses Stellar Wallets Kit, with Freighter as the primary demo wallet.
- Payment asset is USDC on Stellar testnet for MVP.
- Paid event payments go into smart contract escrow.
- Collaborators withdraw their own balances.
- Platform fee must be supported by the contract, but demo fee is 0%; production candidate is 2.5%.
- UI split input is shown as percentages.
- Smart contract model uses two contracts:
  - `QuorumCore` for events, split rules, escrow, purchase/claim, withdraw, and check-in state.
  - `QuorumPassNFT` for unique non-transferable event pass NFTs.
- NFT model uses one pass contract for all events.
- Every successful purchase or free claim mints a unique NFT pass.
- NFT passes are non-transferable.
- NFT metadata uses `metadataUri` plus `metadataHash`.
- Check-in status is recorded on-chain.
- Resource unlock is provided through a gated resource page inside Quorum.
- MVP resource unlock mode is after purchase.
- Dashboard is role-based for organizer, collaborator, and attendee.

## Primary Goal

Produce a Technical Specification and Detailed Development Plan that a senior software engineer can use to start development confidently.

The result must be detailed enough to guide implementation, testing, and commits phase by phase, while still allowing correction when research or implementation reveals a better technical path.

## Required Deliverables

The engineer must produce at least these documents:

- `TECHNICAL_SPEC.md`
  - product scope;
  - architecture;
  - on-chain/off-chain source-of-truth boundaries;
  - smart contract design;
  - database model;
  - API design;
  - frontend route and page model;
  - wallet and auth design;
  - dashboard scope;
  - testing and deployment strategy.

- `DEVELOPMENT_PLAN.md`
  - phases and sub-phases;
  - implementation order;
  - verification checklist per phase;
  - acceptance criteria per phase;
  - expected commit name per phase/sub-phase;
  - correction protocol.

Optional but recommended:

- `docs/ARCHITECTURE.md` for diagrams and component responsibilities.
- `docs/DEMO_PLAN.md` for hackathon demo flow and evidence checklist.
- `docs/CONTRACT_SPEC.md` if smart contract details become too large for `TECHNICAL_SPEC.md`.

## Acceptance Criteria For Technical Spec

The technical spec is accepted only if it covers all of the following:

1. Clear MVP scope and explicit non-scope.
2. End-to-end flow for organizer creating and publishing a draft event.
3. End-to-end flow for paid attendee purchase.
4. End-to-end flow for free event claim.
5. End-to-end flow for collaborator withdrawal.
6. End-to-end flow for attendee pass/resource access.
7. End-to-end flow for organizer check-in verification.
8. Source-of-truth table separating on-chain and off-chain data.
9. `QuorumCore` contract responsibilities, storage, functions, events, and failure cases.
10. `QuorumPassNFT` contract responsibilities, storage, functions, non-transferability rule, metadata strategy, and failure cases.
11. Explanation of how one pass contract still produces unique NFT tokens.
12. Payment, escrow, split, platform fee, balance, and withdraw strategy.
13. Free claim strategy with one pass per wallet and capacity enforcement.
14. Check-in strategy with on-chain status.
15. Resource unlock strategy with NFT ownership verification.
16. Database schema draft with entity relationships.
17. API route plan with request/response purpose.
18. Frontend route/page plan.
19. Dashboard scope for organizer, collaborator, and attendee.
20. Marketplace scope for public published events.
21. Wallet auth/session plan using Stellar Wallets Kit and Freighter for demo.
22. Test strategy for contracts, backend/API, frontend, and E2E demo.
23. Deployment and demo strategy for Stellar testnet and web app hosting.
24. Risk register with mitigation for wallet UX, contract complexity, NFT implementation, and Stellar testnet issues.
25. Clear implementation constraints so the product does not drift into a full Luma clone.

## Acceptance Criteria For Development Plan

The development plan is accepted only if it includes:

1. Phases and sub-phases with clear goals.
2. Expected modules/files touched per phase where practical.
3. Verification checklist per phase.
4. Acceptance criteria per phase.
5. Expected commit name per phase/sub-phase.
6. Explicit instruction that no phase should be committed before verification passes.
7. Dynamic correction protocol for incorrect assumptions or implementation findings.
8. Dependency order between frontend, backend, contract, database, and deployment work.
9. Rollback/fallback guidance for high-risk integrations.
10. A final hackathon demo evidence checklist.

## Recommended Development Phases

The engineer may adjust these after writing the technical spec, but must explain any change.

### Phase 0: Spec Lock And Repository Planning

Goal:

- Produce and review `TECHNICAL_SPEC.md` and `DEVELOPMENT_PLAN.md`.
- Confirm assumptions before scaffolding code.
- Initialize git before the first commit if the repository is not already a git repository.

Sub-phases:

- 0.0 Confirm repository state and initialize git if needed.
- 0.1 Review product decisions and MVP scope.
- 0.2 Define architecture and source-of-truth boundaries.
- 0.3 Define contract, database, API, frontend, and dashboard plan.
- 0.4 Define testing and demo evidence plan.

Verification:

- Documents satisfy all acceptance criteria in this brief.
- Product owner approves the spec before implementation begins.

Suggested commit:

```txt
docs: lock Quorum technical spec and development plan
```

### Phase 1: App Scaffold And Tooling

Goal:

- Create the application workspace and baseline tooling.

Sub-phases:

- 1.1 Scaffold Next.js TypeScript app.
- 1.2 Configure linting, formatting, environment examples, and scripts.
- 1.3 Add base UI system and layout shell.
- 1.4 Add initial project README with local development instructions.

Verification:

- App installs cleanly.
- App runs locally.
- Lint/build baseline passes.

Suggested commit:

```txt
chore: scaffold Quorum app workspace
```

### Phase 2: Wallet Auth And Session Foundation

Goal:

- Implement wallet-only auth foundation.

Sub-phases:

- 2.1 Integrate Stellar Wallets Kit.
- 2.2 Add Freighter primary demo path.
- 2.3 Add wallet connect/disconnect UI.
- 2.4 Add signed challenge/session flow.
- 2.5 Add wallet readiness panel for testnet demo.

Verification:

- User can connect Freighter.
- App can identify wallet address.
- Session survives refresh where intended.
- Wrong network or missing wallet shows clear UI.

Suggested commit:

```txt
feat: add wallet auth foundation
```

### Phase 3: Event Drafting And Marketplace Data Model

Goal:

- Build event drafting and public event data surfaces before contract integration.

Sub-phases:

- 3.1 Add database/schema for users, events, collaborators, resources, purchases, and passes.
- 3.2 Add draft event creation form.
- 3.3 Add collaborator split input using percentages.
- 3.4 Add resource input.
- 3.5 Add public marketplace list for published events.
- 3.6 Add public event detail page.

Verification:

- Organizer can create and edit draft events.
- Split must total 100%.
- Published events appear publicly.
- Event page renders paid and free variants.

Suggested commit:

```txt
feat: add event drafting and public marketplace
```

### Phase 4: Soroban Contract Implementation

Goal:

- Implement `QuorumCore` and `QuorumPassNFT` contracts.

Sub-phases:

- 4.1 Implement `QuorumPassNFT` unique non-transferable pass minting.
- 4.2 Implement metadata URI/hash storage.
- 4.3 Implement `QuorumCore` event registry and publish rules.
- 4.4 Implement split storage and locking.
- 4.5 Implement paid purchase escrow accounting.
- 4.6 Implement free claim.
- 4.7 Implement collaborator withdraw.
- 4.8 Implement on-chain check-in state.
- 4.9 Add contract unit tests.

Verification:

- Contract tests prove pass uniqueness.
- Transfer attempts fail.
- One wallet cannot claim/buy twice for the same event.
- Capacity enforcement works.
- Split balances are correct.
- Withdraw only works for the rightful collaborator.
- Check-in status updates on-chain.

Suggested commit:

```txt
feat: implement Quorum core and pass NFT contracts
```

### Phase 5: Contract Deployment And App Integration

Goal:

- Connect the web app to deployed testnet contracts.

Sub-phases:

- 5.1 Add contract deployment scripts/config.
- 5.2 Add contract client utilities.
- 5.3 Wire event publish to contract call.
- 5.4 Wire paid purchase to contract call.
- 5.5 Wire free claim to contract call.
- 5.6 Record transaction hashes in database.

Verification:

- Testnet contracts deploy from documented commands.
- App can publish an event on-chain.
- App can complete paid purchase and mint NFT.
- App can complete free claim and mint NFT.
- Transaction hashes are visible in app.

Suggested commit:

```txt
feat: integrate app with Stellar testnet contracts
```

### Phase 6: Role-Based Dashboards

Goal:

- Build dashboards that make collaboration transparency visible.

Sub-phases:

- 6.1 Organizer dashboard: events, sales, capacity, split, attendee list.
- 6.2 Organizer check-in management.
- 6.3 Collaborator dashboard: events, share, earned balance, withdrawn amount, withdraw action.
- 6.4 Attendee dashboard: my passes, pass detail, payment proof.
- 6.5 Add visual proof surfaces for tx hash, pass token id, and payout status.

Verification:

- Each role sees the correct event data by wallet address.
- Collaborator cannot withdraw another collaborator's balance.
- Organizer can see attendee/pass status.
- Visual dashboard is polished enough for hackathon demo.

Suggested commit:

```txt
feat: add role-based transparency dashboards
```

### Phase 7: Gated Resources And Check-In Experience

Goal:

- Make NFT pass useful beyond payment receipt.

Sub-phases:

- 7.1 Add attendee pass page.
- 7.2 Add pass QR or verification code.
- 7.3 Add resource page gated by NFT ownership.
- 7.4 Add organizer verify/check-in flow.
- 7.5 Show checked-in state on pass and dashboard.

Verification:

- Wallet without pass cannot view gated resources.
- Wallet with pass can view resources.
- Organizer can verify and check in a pass.
- Checked-in status persists through on-chain state.

Suggested commit:

```txt
feat: add NFT gated resources and check-in
```

### Phase 8: Demo Polish, Evidence, And Reliability

Goal:

- Prepare for hackathon judging and reduce demo risk.

Sub-phases:

- 8.1 Seed polished demo event.
- 8.2 Add empty/loading/error states.
- 8.3 Add Stellar Explorer links where useful.
- 8.4 Add demo walkthrough documentation.
- 8.5 Add screenshots or video capture checklist.
- 8.6 Run end-to-end demo rehearsal.

Verification:

- Demo can be completed in 3-5 minutes.
- Demo proves paid purchase, split balance, NFT pass, resource unlock, check-in, and withdraw proof.
- Known limitations are documented.

Suggested commit:

```txt
feat: polish Quorum hackathon demo flow
```

### Phase 9: Final Testing And Deployment

Goal:

- Ship the MVP demo environment.

Sub-phases:

- 9.1 Run contract tests.
- 9.2 Run app lint/build.
- 9.3 Run API/integration tests where available.
- 9.4 Run browser smoke test.
- 9.5 Deploy web app.
- 9.6 Record final contract IDs, env vars, demo wallets, and evidence.

Verification:

- Build passes.
- Deployed app loads.
- Testnet contract calls work from deployed app.
- Demo event works end to end.

Suggested commit:

```txt
test: verify Quorum demo flow end to end
```

## Commit Discipline

Each phase or meaningful sub-phase must end with a commit only after verification.

Rules:

- If the workspace is not a git repository, initialize git before the first planned commit.
- Do not commit incomplete work just because files changed.
- Do not combine unrelated phases in one commit unless the product owner approves.
- Use small correction commits when findings require a plan or implementation adjustment.
- Prefer clear commit messages that describe product progress.
- Before each phase commit, the engineer must report the phase result, apply required corrections, re-run verification, and only then commit.
- If product owner correction changes the phase output, the commit message should reflect the corrected final state, not the original plan.

Examples of correction commits:

```txt
fix: correct escrow split rounding behavior
fix: prevent duplicate pass minting per wallet
refactor: separate pass ownership checks from dashboard queries
docs: update development plan after wallet integration findings
docs: clarify NFT metadata storage strategy
```

## Dynamic Correction Protocol

The engineer must not blindly follow the initial plan.

At the start of each phase:

1. Re-read the relevant technical spec section.
2. Validate assumptions against current docs, SDK behavior, testnet behavior, and current code.
3. Identify high-risk assumptions before implementation.
4. If an assumption is wrong, update the plan before coding further.

During implementation:

1. Keep changes scoped to the current phase.
2. Prefer the smallest coherent milestone that can be verified.
3. If a design is becoming too complex, pause and document the trade-off.
4. If scope must change, write the correction in the development plan and ask for product approval when it affects UX or core behavior.

Before committing:

1. Run the phase verification checklist.
2. Inspect git diff.
3. Confirm no unrelated files are included.
4. Commit with the planned message or a more accurate message if the phase changed.

## Definition Of Done For Planning Stage

This planning stage is complete when:

- the PM goal brief exists;
- the required technical spec and development plan deliverables are clear;
- acceptance criteria for both documents are explicit;
- locked product decisions are recorded;
- development phases and commit expectations are defined;
- dynamic correction behavior is specified;
- the product owner can hand this brief to a senior engineer and reasonably expect a complete technical spec and development plan.
