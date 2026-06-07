# Quorum Development Plan

## 1. Development Principles

This plan guides implementation of Quorum from an empty repository to a hackathon-ready MVP.

The engineer must work phase by phase, verify each phase, correct mistakes before committing, and avoid blindly following the plan when implementation findings prove a better path is needed.

Primary development rule:

> Commit only after the phase or sub-phase has been implemented, reviewed, corrected if needed, and verified.

## 2. Commit And Correction Discipline

### 2.1 Commit Rules

- Each phase ends with a commit.
- A meaningful sub-phase can also end with a commit if it produces a coherent, verified milestone.
- Do not commit incomplete work just because files changed.
- Do not mix unrelated phases in one commit.
- Inspect the diff before each commit.
- Run the verification checklist before each commit.
- If the product owner or engineer identifies a correction, apply the correction and re-run verification before committing.

### 2.2 Dynamic Correction Protocol

At the start of every phase:

1. Re-read the relevant part of `TECHNICAL_SPEC.md`.
2. Check current repository state.
3. Validate risky assumptions against current SDK/docs/testnet behavior.
4. Identify what could invalidate the phase plan.
5. If assumptions are wrong, update docs or plan first.

During every phase:

1. Keep changes scoped to the phase goal.
2. Prefer the smallest coherent implementation that can be tested.
3. If the plan is wrong, pause and correct the plan.
4. If correction affects product behavior, ask for approval before continuing.
5. If correction is technical-only and preserves product behavior, document it and continue.

Before every commit:

1. Run phase verification.
2. Review diff.
3. Confirm no unrelated files are included.
4. Use the planned commit message or a more accurate one.

### 2.3 Correction Commit Examples

Use correction commits when a verified change needs to amend the plan or architecture:

```txt
docs: update plan after Stellar Wallets Kit integration findings
fix: correct escrow split rounding behavior
fix: prevent duplicate pass minting per wallet
refactor: separate pass ownership checks from dashboard queries
docs: clarify NFT metadata storage strategy
test: add regression coverage for duplicate free claims
```

## 3. Repository Baseline

Current expected state:

- repository path: `/Users/wildanniam/Development/project/Quorum`;
- repository may not yet be initialized as git;
- current planning docs may exist before app scaffold.

If `.git` does not exist, initialize git during Phase 0 before the first commit.

## 4. Phase Overview

| Phase | Goal | Commit |
|---|---|---|
| 0 | Lock spec, repo, and implementation assumptions | `docs: lock Quorum technical spec and development plan` |
| 1 | Scaffold app and tooling | `chore: scaffold Quorum app workspace` |
| 2 | Add wallet auth foundation | `feat: add wallet auth foundation` |
| 3 | Add database and event drafting | `feat: add event drafting workflow` |
| 4 | Build marketplace and public event pages | `feat: add public event marketplace` |
| 5 | Implement Soroban contracts | `feat: implement core escrow and pass NFT contracts` |
| 6 | Deploy contracts and integrate app | `feat: integrate Stellar contract flows` |
| 7 | Implement checkout and claim flows | `feat: add paid checkout and free pass claim` |
| 8 | Add dashboards | `feat: add role-based transparency dashboards` |
| 9 | Add gated resources and check-in | `feat: add NFT gated resources and check-in` |
| 10 | Polish demo and reliability | `feat: polish Quorum hackathon demo` |
| 11 | Final test, deploy, and evidence | `test: verify Quorum demo flow end to end` |

## 5. Phase 0: Spec Lock And Repository Planning

### Goal

Prepare the repo for implementation and lock planning docs before coding.

### Sub-phases

#### 0.1 Confirm Repository State

Tasks:

- Check files in repo.
- Confirm whether `.git` exists.
- If no `.git`, initialize git.
- Add `.gitignore` if missing.

Verification:

- `git status` works.
- No unexpected files are staged.

Suggested sub-phase commit if only git/docs setup is committed:

```txt
chore: initialize Quorum repository
```

#### 0.2 Review Technical Spec

Tasks:

- Review `TECHNICAL_SPEC.md`.
- Confirm locked product decisions.
- Mark any implementation assumptions that need a spike.

Verification:

- Spec includes scope, non-scope, flows, architecture, contracts, database, API, frontend, tests, deployment, and risks.

#### 0.3 Review Development Plan

Tasks:

- Review this `DEVELOPMENT_PLAN.md`.
- Confirm phase order.
- Confirm commit discipline.
- Confirm correction protocol.

Verification:

- Plan has phase/sub-phase details, acceptance criteria, and commit names.

### Phase Acceptance Criteria

- Technical spec and development plan are present.
- Product owner approves proceeding to scaffold.
- Git repository is ready for commits.

### Phase Commit

```txt
docs: lock Quorum technical spec and development plan
```

## 6. Phase 1: App Scaffold And Tooling

### Goal

Create the baseline web app and development tooling.

### Recommended Stack

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- shadcn/ui or equivalent component primitives.
- ESLint/Prettier.
- Package manager chosen by scaffold default or local preference.

### Sub-phases

#### 1.1 Scaffold App

Tasks:

- Create Next.js TypeScript app in repo root or `apps/web` if monorepo is chosen.
- Choose structure deliberately:
  - simple single app if speed is priority;
  - monorepo only if contract/frontend split benefits are clear.

Verification:

- App starts locally.
- Default route renders.

Suggested commit:

```txt
chore: scaffold Next.js app
```

#### 1.2 Configure Tooling

Tasks:

- Add lint/build scripts.
- Add formatting setup.
- Add `.env.example`.
- Add project README local setup.
- Add base directory structure.

Verification:

- Install succeeds.
- `lint` succeeds or is documented if scaffold has no lint command yet.
- `build` succeeds.

Suggested commit:

```txt
chore: configure app tooling and environment
```

#### 1.3 Add Base UI Shell

Tasks:

- Add app layout.
- Add navigation.
- Add basic responsive shell.
- Add placeholder routes for marketplace, dashboard, create event, pass page.

Verification:

- Routes compile and render.
- No broken navigation links.
- Basic responsive layout is usable.

Suggested commit:

```txt
feat: add Quorum app shell
```

### Phase Acceptance Criteria

- App can run locally.
- Build/lint baseline is usable.
- Project has basic routes and layout.

### Phase Commit

If sub-phase commits are not used:

```txt
chore: scaffold Quorum app workspace
```

## 7. Phase 2: Wallet Auth Foundation

### Goal

Implement wallet-only auth and wallet readiness.

### Sub-phases

#### 2.1 Integrate Freighter-first wallet adapter

Tasks:

- Evaluate Stellar Wallets Kit dependency health before adding it to the app.
- Use direct Freighter API integration for MVP if the Wallets Kit dependency tree has unacceptable audit risk.
- Add a wallet adapter boundary that can support Stellar Wallets Kit or WalletConnect later.
- Configure Freighter as primary demo wallet.
- Keep WalletConnect path deferred if package audit risk or setup friction is high.

Verification:

- Wallet dependency audit is reviewed.
- Wallet connection button renders.
- Freighter can be detected.

Suggested commit:

```txt
feat: integrate Freighter wallet adapter
```

#### 2.2 Implement Connect/Disconnect State

Tasks:

- Add wallet context/provider.
- Show connected address.
- Add disconnect.
- Persist session state only where appropriate.

Verification:

- Connect works.
- Disconnect clears UI state.
- Refresh behavior is understood and documented.

Suggested commit:

```txt
feat: add wallet connection state
```

#### 2.3 Implement Signed Session Auth

Tasks:

- Add challenge generation.
- Ask wallet to sign challenge.
- Verify signature server-side or through chosen auth utility.
- Store session.

Verification:

- Valid signature creates session.
- Invalid/stale challenge fails.
- User identity is wallet address.

Suggested commit:

```txt
feat: add wallet signed session auth
```

#### 2.4 Add Wallet Readiness Panel

Tasks:

- Show connected wallet.
- Show testnet readiness.
- Show actionable errors for missing wallet, rejected signature, wrong network, and transaction failure.
- Add placeholder for USDC readiness if exact implementation is deferred.

Verification:

- Error states can be manually triggered or mocked.
- UI copy is clear enough for hackathon demo.

Suggested commit:

```txt
feat: add Stellar wallet readiness panel
```

### Phase Acceptance Criteria

- Freighter wallet can connect.
- Wallet-only session is available to app routes.
- UI can identify connected wallet role later.
- Error states are understandable.

### Phase Commit

```txt
feat: add wallet auth foundation
```

## 8. Phase 3: Database And Event Drafting Workflow

### Goal

Allow organizers to create draft events and configure collaborators/resources before blockchain integration.

### Sub-phases

#### 3.1 Choose And Configure Database

Tasks:

- Use Supabase Postgres or equivalent.
- Add schema/migrations.
- Add DB client utilities.
- Add local env example.

Verification:

- DB connection works locally.
- Migrations apply cleanly.

Suggested commit:

```txt
chore: configure database schema
```

#### 3.2 Implement Event Schema

Tasks:

- Add `User`.
- Add `Event`.
- Add `Collaborator`.
- Add `Resource`.
- Add `Pass`.
- Add `Purchase`.
- Add `Withdrawal`.
- Add `CheckIn`.

Verification:

- Schema matches `TECHNICAL_SPEC.md`.
- Basic CRUD can be tested manually or via simple scripts.

Suggested commit:

```txt
feat: add Quorum event data model
```

#### 3.3 Build Draft Event Form

Tasks:

- Add create event page.
- Add fields:
  - title;
  - event type;
  - description;
  - cover image URL/upload placeholder;
  - start/end time;
  - timezone;
  - location type/text;
  - price/free mode;
  - capacity.

Verification:

- Organizer can create draft.
- Validation catches missing required fields.
- Paid/free UI is clear.

Suggested commit:

```txt
feat: add draft event creation form
```

#### 3.4 Add Collaborator Split Input

Tasks:

- Add collaborator table/form.
- Validate wallet format.
- Validate split total equals 100%.
- Use percentage UI, not basis point language.

Verification:

- Invalid total cannot publish.
- Split can be edited while draft.

Suggested commit:

```txt
feat: add collaborator split configuration
```

#### 3.5 Add Resource Input

Tasks:

- Add resource form.
- Support type, title, description, URL, sort order.
- Store resources in DB.

Verification:

- Resource can be added to draft event.
- Resource list renders in organizer preview.

Suggested commit:

```txt
feat: add event resource setup
```

### Phase Acceptance Criteria

- Organizer can create and edit draft event.
- Draft includes collaborators and resources.
- Split validation works.
- No contract integration is required yet.

### Phase Commit

```txt
feat: add event drafting workflow
```

## 9. Phase 4: Public Marketplace And Event Pages

### Goal

Make published events discoverable and viewable in a simple marketplace.

### Sub-phases

#### 4.1 Add Marketplace Page

Tasks:

- Create `/` marketplace.
- List published events.
- Add polished event cards.
- Show price/free, capacity, date, event type, and proof badges.

Verification:

- Published seeded/test events appear.
- Draft events do not appear.

Suggested commit:

```txt
feat: add public marketplace page
```

#### 4.2 Add Public Event Detail Page

Tasks:

- Create `/events/[slug]`.
- Show event metadata, collaborators, split preview, resources teaser, price/free state.
- Add CTA: buy pass or claim pass.

Verification:

- Paid and free event states render correctly.
- CTA directs to checkout/claim flow.

Suggested commit:

```txt
feat: add public event detail page
```

#### 4.3 Add Publish UX Stub

Tasks:

- Add publish button from draft event.
- For now, publish can update DB status if contract is not ready.
- Mark contract integration TODO clearly.

Verification:

- Draft -> Published works in DB.
- Published event appears publicly.

Suggested commit:

```txt
feat: add event publish UX
```

### Phase Acceptance Criteria

- Marketplace is visually strong enough for demo foundation.
- Event page clearly communicates collaborative split and NFT pass value.

### Phase Commit

```txt
feat: add public event marketplace
```

## 10. Phase 5: Soroban Contracts

### Goal

Implement and test `QuorumCore` and `QuorumPassNFT`.

### Critical Spike First

Before full contract build, verify:

- current Stellar CLI/tooling;
- Rust/Soroban project layout;
- testnet USDC token contract details;
- token transfer authorization pattern;
- contract-to-contract call pattern for minting pass;
- OpenZeppelin Stellar NFT library suitability.

If any spike finding changes architecture, update `TECHNICAL_SPEC.md` and `DEVELOPMENT_PLAN.md` before continuing.

Suggested correction commit if needed:

```txt
docs: update contract plan after Soroban spike
```

### Sub-phases

#### 5.1 Scaffold Contract Workspace

Tasks:

- Add contracts directory.
- Add Rust/Soroban project.
- Add test harness.
- Document contract build/test commands.

Verification:

- Minimal contract compiles.
- Tests run.

Suggested commit:

```txt
chore: scaffold Soroban contract workspace
```

#### 5.2 Implement QuorumPassNFT

Tasks:

- Implement NFT storage.
- Implement unique token mint.
- Implement owner lookup.
- Implement event lookup.
- Implement metadata URI/hash.
- Disable transfer.
- Restrict minting to `QuorumCore`.

Verification:

- Mint returns unique token ID.
- Owner lookup works.
- Event lookup works.
- Transfer attempt fails or is unavailable.
- Unauthorized mint fails.

Suggested commit:

```txt
feat: implement non-transferable pass NFT contract
```

#### 5.3 Implement QuorumCore Event Registry

Tasks:

- Implement initialize.
- Implement create event.
- Implement split setup.
- Implement publish.
- Implement organizer authorization.
- Lock split after publish.

Verification:

- Organizer can create event.
- Non-organizer cannot mutate event.
- Split must total 100%.
- Split cannot change after publish.

Suggested commit:

```txt
feat: implement QuorumCore event registry
```

#### 5.4 Implement Paid Purchase Escrow

Tasks:

- Implement paid purchase.
- Transfer USDC into contract escrow.
- Calculate platform fee and collaborator balances.
- Mint NFT pass.
- Prevent duplicate pass.
- Enforce capacity.

Verification:

- Purchase succeeds with valid payment.
- Balances match split.
- Duplicate purchase fails.
- Capacity exceeded fails.
- Pass minted exactly once.

Suggested commit:

```txt
feat: add escrow purchase and pass minting
```

#### 5.5 Implement Free Claim

Tasks:

- Implement free claim.
- Enforce free event mode.
- Enforce one pass per wallet.
- Enforce capacity.
- Mint NFT pass.

Verification:

- Claim succeeds for free event.
- Claim fails for paid event.
- Duplicate claim fails.
- Capacity exceeded fails.

Suggested commit:

```txt
feat: add free event pass claim
```

#### 5.6 Implement Withdraw

Tasks:

- Implement collaborator balance lookup.
- Implement withdraw.
- Transfer USDC to collaborator.
- Reset/decrement balance.
- Emit withdrawal proof.

Verification:

- Collaborator can withdraw own balance.
- Other wallet cannot withdraw someone else's balance.
- Zero balance withdraw fails.

Suggested commit:

```txt
feat: add collaborator withdrawals
```

#### 5.7 Implement Check-In State

Tasks:

- Implement check-in by organizer.
- Verify token belongs to event.
- Record checked-in state.
- Prevent or safely handle duplicate check-in.

Verification:

- Organizer can check in valid token.
- Invalid token fails.
- Non-organizer fails.
- Checked-in status persists.

Suggested commit:

```txt
feat: add on-chain pass check-in
```

### Phase Acceptance Criteria

- Contract tests prove all MVP invariants.
- Contract design matches technical spec or docs are updated after approved correction.

### Phase Commit

```txt
feat: implement core escrow and pass NFT contracts
```

## 11. Phase 6: Contract Deployment And App Integration

### Goal

Deploy contracts to Stellar testnet and connect app flows to contract calls.

### Sub-phases

#### 6.1 Add Deployment Scripts

Tasks:

- Add deployment scripts/commands.
- Add contract ID env vars.
- Add deployment README.

Verification:

- Contracts deploy to testnet.
- Contract IDs recorded.

Suggested commit:

```txt
chore: add contract deployment scripts
```

#### 6.2 Add Contract Client Utilities

Tasks:

- Add app utilities for contract calls.
- Add typed wrappers if generated.
- Add error normalization.

Verification:

- App can read contract event/pass state in dev mode.

Suggested commit:

```txt
feat: add Stellar contract client utilities
```

#### 6.3 Wire Publish Flow

Tasks:

- Publish event on-chain.
- Store `coreEventId`, metadata hash, and tx hash in DB.
- Lock DB event after successful publish.

Verification:

- Published event exists on-chain and in DB.
- Split cannot be edited after publish.

Suggested commit:

```txt
feat: wire event publish to contract
```

### Phase Acceptance Criteria

- Testnet contracts are deployed.
- App can call at least read and publish flows.
- Contract IDs and env setup are documented.

### Phase Commit

```txt
feat: integrate Stellar contract flows
```

## 12. Phase 7: Checkout And Claim Flows

### Goal

Complete attendee paid purchase and free claim in the app.

### Sub-phases

#### 7.1 Implement Paid Checkout UI

Tasks:

- Add checkout screen.
- Show event summary, price, split preview, wallet readiness.
- Call `purchase_pass`.
- Handle wallet rejection/error/success.

Verification:

- Paid purchase succeeds on testnet.
- App records tx hash and token ID.
- Duplicate purchase is blocked.

Suggested commit:

```txt
feat: add paid event checkout
```

#### 7.2 Implement Free Claim UI

Tasks:

- Add free event claim state.
- Call `claim_free_pass`.
- Handle success/error.

Verification:

- Free claim succeeds.
- Duplicate claim is blocked.

Suggested commit:

```txt
feat: add free event pass claim UI
```

#### 7.3 Add Pass Recording And Pass Page

Tasks:

- Record confirmed pass in DB.
- Create `/passes/[tokenId]`.
- Show pass visual, token ID, event, owner, tx hash.

Verification:

- Pass page renders after purchase/claim.
- Pass ownership matches connected wallet.

Suggested commit:

```txt
feat: add attendee NFT pass page
```

### Phase Acceptance Criteria

- Paid attendee can buy pass.
- Free attendee can claim pass.
- Each flow mints unique NFT.
- App records proof surfaces.

### Phase Commit

```txt
feat: add paid checkout and free pass claim
```

## 13. Phase 8: Role-Based Dashboards

### Goal

Build the dashboards that make Quorum's transparency visible.

### Sub-phases

#### 8.1 Organizer Dashboard

Tasks:

- Show organizer events.
- Show sales/claims.
- Show capacity.
- Show split.
- Show attendees and token IDs.
- Show check-in status.
- Show tx hashes.

Verification:

- Organizer sees only owned events.
- Visual layout is polished.

Suggested commit:

```txt
feat: add organizer event dashboard
```

#### 8.2 Collaborator Dashboard

Tasks:

- Detect events where wallet is collaborator.
- Show split percentage.
- Show earned/pending/withdrawn balance.
- Add withdraw action.
- Show withdrawal tx hash.

Verification:

- Collaborator sees correct events.
- Withdraw succeeds for rightful collaborator.
- Wrong wallet cannot withdraw.

Suggested commit:

```txt
feat: add collaborator payout dashboard
```

#### 8.3 Attendee Dashboard

Tasks:

- Show owned passes.
- Link to pass page and resources.
- Show payment/claim proof.
- Show checked-in status.

Verification:

- Attendee sees only owned passes.
- Locked/empty states are polished.

Suggested commit:

```txt
feat: add attendee pass dashboard
```

#### 8.4 Add Dashboard Visual Polish

Tasks:

- Add proof badges.
- Add compact stats.
- Add tx link components.
- Add empty/loading/error states.

Verification:

- Dashboard communicates transparency in screenshots.
- Text does not overflow on mobile/desktop.

Suggested commit:

```txt
feat: polish transparency dashboard visuals
```

### Phase Acceptance Criteria

- Organizer, collaborator, and attendee roles are usable.
- Dashboards show money/access proof clearly.
- Withdraw can be demonstrated or proof is displayed if withdraw is deferred for a demo run.

### Phase Commit

```txt
feat: add role-based transparency dashboards
```

## 14. Phase 9: Gated Resources And Check-In

### Goal

Make the NFT pass useful beyond a payment receipt.

### Sub-phases

#### 9.1 Implement Gated Resource Page

Tasks:

- Add `/events/[slug]/resources`.
- Check connected wallet ownership of event pass.
- Show resources only to pass owner.
- Show locked state for non-owner.

Verification:

- Pass owner can view resources.
- Non-owner cannot view resources.

Suggested commit:

```txt
feat: add NFT gated resource page
```

#### 9.2 Implement Pass QR/Verification Code

Tasks:

- Show token/event verification code on pass page.
- Add QR if dependency/time is acceptable.
- Ensure fallback manual token lookup exists.

Verification:

- Organizer can identify token from pass page.
- QR/manual fallback works.

Suggested commit:

```txt
feat: add pass verification code
```

#### 9.3 Implement Organizer Check-In Page

Tasks:

- Add `/check-in/[eventId]`.
- Search/scan token.
- Validate pass/event/owner.
- Call check-in contract function.
- Show checked-in state.

Verification:

- Organizer can check in valid pass.
- Invalid pass fails.
- Duplicate check-in is handled clearly.

Suggested commit:

```txt
feat: add organizer check-in verification
```

### Phase Acceptance Criteria

- NFT unlocks resources.
- NFT can be checked in.
- Check-in status is on-chain and visible.

### Phase Commit

```txt
feat: add NFT gated resources and check-in
```

## 15. Phase 10: Demo Polish And Reliability

### Goal

Make the product feel compelling and reduce hackathon demo risk.

### Sub-phases

#### 10.1 Seed Demo Event

Tasks:

- Seed `APAC Stellar Builder Meetup`.
- Add collaborators:
  - Organizer 70%;
  - Speaker 20%;
  - Community Partner 10%.
- Add resources:
  - Workshop Deck;
  - Soroban Starter Repo;
  - Private Builder Notes.

Verification:

- Demo event renders in marketplace.
- Demo event has polished content.

Suggested commit:

```txt
feat: seed Quorum demo event
```

#### 10.2 Improve Error And Empty States

Tasks:

- Wallet errors.
- Contract errors.
- Empty dashboards.
- No pass state.
- Capacity full state.
- Already owns pass state.

Verification:

- Common demo failure modes are understandable.

Suggested commit:

```txt
feat: add resilient demo states
```

#### 10.3 Add Proof Links And Demo Copy

Tasks:

- Add Stellar Explorer links where useful.
- Add token ID display.
- Add simple explanations near proof badges.
- Avoid long in-app tutorial text.

Verification:

- Judge can see proof without product feeling like documentation.

Suggested commit:

```txt
feat: surface Stellar proof links
```

#### 10.4 Rehearse Demo Flow

Tasks:

- Run full 3-5 minute demo.
- Capture blockers.
- Fix high-impact issues.
- Update demo notes.

Verification:

- Demo flow completes without manual hidden steps.

Suggested commit:

```txt
fix: stabilize Quorum demo flow
```

### Phase Acceptance Criteria

- Demo is visually polished.
- Demo can complete end to end.
- Known limitations are documented.

### Phase Commit

```txt
feat: polish Quorum hackathon demo
```

## 16. Phase 11: Final Test, Deploy, And Evidence

### Goal

Ship the demo and produce evidence for hackathon submission.

### Sub-phases

#### 11.1 Run Full Verification

Tasks:

- Run contract tests.
- Run app lint.
- Run app build.
- Run API/integration tests if available.
- Run browser smoke test.

Verification:

- All required checks pass or documented exceptions are approved.

Suggested commit:

```txt
test: add final Quorum verification coverage
```

#### 11.2 Deploy App

Tasks:

- Deploy app.
- Configure env vars.
- Verify deployed app loads.
- Verify wallet connection works on deployed URL.

Verification:

- Deployed app loads.
- Deployed contract calls work.

Suggested commit:

```txt
chore: configure Quorum deployment
```

#### 11.3 Record Evidence

Tasks:

- Record deployed URL.
- Record contract IDs.
- Record demo wallet addresses.
- Record publish tx hash.
- Record purchase tx hash.
- Record token ID.
- Record check-in tx hash.
- Record withdraw tx hash if available.
- Capture screenshots/video.

Verification:

- Evidence is complete enough for submission.

Suggested commit:

```txt
docs: record Quorum demo evidence
```

### Phase Acceptance Criteria

- Deployed demo works end to end.
- Evidence is recorded.
- Submission risks are documented.

### Phase Commit

```txt
test: verify Quorum demo flow end to end
```

## 17. Fallback Rules

Fallbacks are allowed only when they preserve the core product thesis or are explicitly approved.

### Allowed Technical Fallbacks

- If WalletConnect or Stellar Wallets Kit adds risk, ship Freighter-first with a wallet adapter boundary still present.
- If wallet NFT display is unreliable, use Quorum pass page as canonical visual pass.
- If QR dependency adds risk, use manual token verification code for MVP.
- If dashboard real-time contract reads are slow, use DB cache plus explicit tx/proof links.

### Product Fallbacks That Need Approval

- Replacing full NFT contract with registry-only pass proof.
- Removing paid checkout.
- Removing collaborator withdraw.
- Moving check-in off-chain.
- Removing free event support.
- Removing marketplace.

These affect locked product scope and require product owner approval.

## 18. Final Definition Of Done

The MVP is development-complete when:

- app is deployed;
- contracts are deployed on Stellar testnet;
- organizer can create and publish event;
- public marketplace shows event;
- attendee can buy paid pass with Freighter;
- attendee can claim free pass;
- each successful purchase/claim mints unique non-transferable NFT pass;
- resources are gated by NFT ownership;
- organizer can check in pass;
- collaborator can see balance and withdraw;
- dashboards show proof surfaces;
- final verification commands pass or exceptions are documented;
- hackathon evidence is recorded.
