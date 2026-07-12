# Quorum Internal UI Donor Adoption Plan

Last audited: 2026-07-12.

Status: **locked for implementation after review**.

This document is the implementation source of truth for selectively adopting
mature product UI patterns from `faiz-ui-app` into Quorum. It complements the
product diagnosis in `docs/PRODUCT_UI_UX_AUDIT_V2.md` and does not replace the
completed route refactor history in `docs/APP_UI_REFACTOR_ROADMAP.md`.

## Executive Decision

`faiz-ui-app` is a component and interaction-pattern donor, not a template to
copy into Quorum.

Quorum keeps its own identity, product model, route structure, and working
behavior. The donor is useful for improving component completeness, consistent
states, form ergonomics, overlays, and developer-facing UI fixtures.

The implementation must follow these non-negotiable rules:

1. The landing page (`/`) must not be redesigned, restyled, or structurally
   refactored by this plan.
2. Quorum keeps its current near-black, cyan, Outfit, thin-border design
   language and existing product navigation.
3. Donor components are reimplemented in Quorum's vocabulary. They are not
   copied wholesale with donor tokens, radius, typography, icons, or layout.
4. Existing wallet, signing, transaction, settlement, check-in, payout,
   ledger, database, and MoneyGram behavior must not change in a UI-only phase.
5. Standard and high-risk work must be separated into different issues and
   pull requests.
6. A phase cannot advance until its checks pass and its screenshots have been
   reviewed against the acceptance criteria.

## Inputs Audited

### Quorum

- `src/components/ui/product-layout.tsx`
- `src/components/ui/product-primitives.tsx`
- `src/components/ui/quorum-button.tsx`
- `src/components/ui/status-pill.tsx`
- Product routes under `src/app`
- `docs/PRODUCT_UI_UX_AUDIT_V2.md`
- `docs/APP_UI_REFACTOR_ROADMAP.md`
- Current browser QA and smoke scripts in `package.json`

### Donor application

Source: `/Users/wildanniam/Development/project/faiz-ui-app`.

Useful donor patterns:

- a living component catalogue;
- structured button loading states;
- reusable fields and input composition;
- alerts, skeletons, empty states, dialogs, drawers, tooltips, and toasts;
- explicit interaction states rather than one-off route markup;
- composable primitives that separate behavior from page layout.

Patterns that must not be inherited:

- donor color, typography, radius, shadow, and spacing tokens;
- Base Luma visual styling;
- Hugeicons or a second icon language;
- dashboard layouts that hide or collapse core content on mobile;
- hardcoded light surfaces that fail in dark mode;
- donor build shortcuts that bypass type validation;
- broad dependency adoption without isolated review.

## Current Quorum Gaps

The existing Quorum product foundation is usable, but component behavior is
still uneven:

- loading-button markup is repeated across transaction and form components;
- alerts and inline error surfaces are implemented locally in several routes;
- Create Event relies on many raw form controls and route-local field markup;
- empty, loading, error, retry, success, disabled, wrong-wallet, and
  wrong-network states are not demonstrated in one deterministic place;
- generic dialog, drawer, tooltip, and toast primitives are not available;
- visually similar actions can behave differently because their state handling
  is local to each feature.

The goal is not to produce more components. The goal is to make critical
product states predictable, accessible, reusable, and easier to verify.

## Target Component Architecture

### Keep and evolve

- `QuorumButton`
- `StatusPill`
- existing product layout and surface primitives
- the current Quorum logo, tokens, typography, and Lucide icon language

### Add only when adopted by a real route

- `Spinner`
- `Skeleton`
- `Alert`
- `EmptyState`
- `Field`
- `FieldLabel`
- `FieldDescription`
- `FieldMessage`
- `Input`
- `Textarea`
- `Select`
- `InputGroup`
- `Dialog`
- `Drawer`
- `Tooltip`
- `Toast` integration

### Internal component catalogue

Add a development-only `/ui-kit` route or an equivalent internal fixture page.
It must show deterministic examples of:

- button variants and loading/disabled states;
- inputs with default, focus, filled, disabled, error, and success states;
- alert tones;
- loading skeletons;
- empty states;
- dialog, drawer, tooltip, and toast behavior;
- keyboard focus and reduced-motion behavior.

The catalogue is a verification surface, not a public marketing page.

## Global Engineering Loop

Every implementation phase follows the same loop:

1. Sync local `main` with `origin/main`.
2. Create one GitHub issue containing goal, scope, exclusions, acceptance
   criteria, verification, and risk classification.
3. Create `codex/<issue-number>-short-topic` from the updated `main`.
4. Implement the smallest complete change for that phase.
5. Inspect the diff before testing. Unless explicitly scoped, reject changes
   to `src/lib`, API routes, contracts, database files, environment files,
   deployment configuration, and operational scripts.
6. Run the phase verification matrix.
7. Capture desktop, tablet, and mobile screenshots for every affected route and
   deterministic component state.
8. Audit hierarchy, spacing, typography, contrast, focus, overflow, loading,
   empty, error, success, disabled, and reduced-motion behavior.
9. Fix any acceptance-criteria failure before committing.
10. Commit once the phase is coherent and verified.
11. Push and open a PR with summary, verification, screenshots, risks, and
    `Closes #N`.
12. Merge only under the merge policy below, then sync `main` before the next
    phase.

## Screenshot Gate

For meaningful UI phases, capture at minimum:

- desktop: `1440 x 900`;
- tablet: `1024 x 768`;
- mobile: `390 x 844`.

Review screenshots for:

- no horizontal overflow or clipped controls;
- no text overlap, truncated critical copy, or unstable layout shift;
- one obvious primary action per workflow state;
- visible keyboard focus and adequate contrast;
- loading, error, and success feedback located near the action that caused it;
- mobile action order matching the user's task order;
- visual consistency with Quorum's current product system.

Before Phase 1, capture a landing-page baseline at all three viewports. Repeat
the same screenshots after every phase that changes shared CSS, layout, fonts,
or primitives. Any unexplained landing-page visual diff blocks the PR.

## Phase Plan

### Phase 0 - Baseline, adoption contract, and UI catalogue

Risk: **standard**.

Scope:

- record the donor contract and exclusions in the repo;
- establish the internal `/ui-kit` verification surface;
- capture baseline screenshots for `/` and representative product routes;
- document the existing Quorum tokens used by all new primitives.

Acceptance criteria:

- the donor contract is visible to future contributors;
- `/ui-kit` is excluded from primary product navigation;
- fixture states are deterministic and do not require wallet signing;
- baseline screenshots exist for desktop, tablet, and mobile;
- landing visuals and behavior are unchanged.

Verification:

- `npm run lint`
- `npm run build`
- browser screenshots for `/`, `/ui-kit`, and representative product routes

Commit boundary: one commit for the baseline and catalogue foundation.

### Phase 1 - Action and feedback primitives

Risk: **standard**.

Scope:

- evolve `QuorumButton` with consistent loading and disabled behavior;
- add `Spinner`, `Skeleton`, `Alert`, and `EmptyState`;
- represent every state in `/ui-kit`;
- preserve existing action semantics and handlers.

Acceptance criteria:

- loading buttons retain stable width and prevent duplicate activation;
- loading state has an accessible label;
- alerts expose semantic status without relying only on color;
- skeletons do not cause major content layout shift;
- empty states contain one clear next action when an action is available;
- no product route behavior changes in this phase.

Verification:

- `npm run lint`
- `npm run build`
- `/ui-kit` keyboard and screenshot review at all required viewports

Commit boundary: one commit for action and feedback primitives.

### Phase 2 - Form primitives and state contract

Risk: **standard**.

Scope:

- add field composition, input, textarea, select, and input-group primitives;
- define label, description, required, validation, disabled, and success
  relationships;
- demonstrate wallet address, percentage, URL, date, and numeric examples in
  `/ui-kit` without changing Create Event yet.

Acceptance criteria:

- labels and messages are programmatically associated with controls;
- focus styles are visible and consistent;
- error messages do not move unrelated controls unpredictably;
- controls remain usable at `390px` width;
- primitives use Quorum tokens and Lucide icons only;
- no production form behavior changes in this phase.

Verification:

- `npm run lint`
- `npm run build`
- keyboard, focus, error, and mobile screenshot review in `/ui-kit`

Commit boundary: one commit for the form system.

### Phase 3 - Overlay and notification foundation

Risk: **high-risk** because it may add or upgrade dependencies.

Scope:

- make an explicit dependency decision for accessible dialog, drawer, tooltip,
  and toast behavior;
- if adopted, isolate `@base-ui/react` and/or `sonner` installation and lockfile
  changes in this phase only;
- wrap dependency APIs in Quorum-owned primitives;
- do not migrate product transaction flows yet.

Acceptance criteria:

- dependency choice and rejected alternatives are documented in the PR;
- dialog and drawer trap focus and restore it on close;
- Escape and backdrop behavior are deliberate and tested;
- mobile drawer content remains reachable without overflow;
- toasts do not replace persistent error messages for critical actions;
- reduced-motion behavior is supported;
- no existing product workflow is migrated in this phase.

Verification:

- `npm run lint`
- `npm run build`
- keyboard focus, Escape, focus restoration, reduced-motion, and mobile overlay
  review

Commit boundary: one commit for dependency and overlay foundation.

Merge gate: manual approval is mandatory. Never auto-merge.

### Phase 4 - Low-risk product adoption

Risk: **standard**.

Candidate surfaces:

- Discover results and filters;
- pass library read-only states;
- gated resource read-only states;
- non-transactional evidence summaries;
- empty, loading, and error states that do not submit mutations.

Acceptance criteria:

- repeated route-local loading, alert, and empty markup is replaced by shared
  primitives where it genuinely reduces duplication;
- no route data contract or mutation handler changes;
- user-facing copy remains outcome-first and avoids technical-console language;
- all affected routes pass desktop, tablet, and mobile review;
- landing screenshots match the Phase 0 baseline.

Verification:

- `npm run lint`
- `npm run build`
- `npm run browser:qa`
- affected-route screenshots at all required viewports

Commit boundary: one commit for low-risk route adoption.

### Phase 5 - Checkout and wallet action presentation

Risk: **high-risk**.

Scope:

- migrate presentation states around checkout and wallet actions;
- standardize connect, wrong-network, approval, submitting, rejected, retry,
  confirmed, already-owned, and sold-out feedback;
- preserve transaction construction, signing, submission, and API behavior.

Acceptance criteria:

- existing handlers and transaction calls are unchanged or reviewed line by
  line when a mechanical wrapper change is unavoidable;
- duplicate submission remains impossible;
- persistent errors remain visible after a toast disappears;
- the primary action remains visible and understandable on mobile;
- no live signing is triggered during autonomous verification.

Verification:

- `npm run lint`
- `npm run build`
- `npm run wallet:auth:smoke`
- `npm run demo:smoke`
- `npm run api:origin:smoke`
- checkout screenshots for every safely reproducible state

Commit boundary: one commit for checkout and wallet presentation.

Merge gate: manual approval is mandatory. Never auto-merge.

### Phase 6 - Publish and withdrawal presentation

Risk: **high-risk**.

Scope:

- migrate only the UI state wrappers around event publishing and collaborator
  withdrawal;
- standardize loading, disabled, success, error, and retry feedback;
- preserve settlement and mutation behavior.

Acceptance criteria:

- publish and withdrawal handlers retain their existing inputs and outputs;
- critical status remains persistent and is not toast-only;
- repeated activation is blocked while a request is in flight;
- no transaction is signed or submitted during autonomous visual QA;
- PR diff contains no unrelated checkout or MoneyGram changes.

Verification:

- `npm run lint`
- `npm run build`
- `npm run demo:smoke`
- `npm run settlement:smoke`
- `npm run live:ui-wiring:smoke`
- screenshots for safe local states

Commit boundary: one commit for publish and withdrawal presentation.

Merge gate: manual approval is mandatory. Never auto-merge.

### Phase 7 - MoneyGram payout and sync presentation

Risk: **high-risk**.

Scope:

- adopt shared fields, alerts, buttons, and overlays around anchor payout and
  status sync;
- keep SEP behavior, external URLs, session handling, polling, and persistence
  unchanged;
- clearly distinguish unavailable, pending approval, ready, processing,
  completed, failed, and retry states.

Acceptance criteria:

- anchor configuration and SEP behavior are not altered by visual refactoring;
- external unavailability is explained without promising a payout that cannot
  currently complete;
- errors remain actionable and persistent;
- no production credential or secret is introduced;
- no live payout is triggered during autonomous verification.

Verification:

- `npm run lint`
- `npm run build`
- `npm run anchor:config:smoke`
- `npm run anchor:sep1:smoke`
- `npm run anchor:sep10:smoke`
- `npm run anchor:sep24:smoke`
- `npm run anchor:status:smoke`
- safe-state screenshots at all required viewports

Commit boundary: one commit for MoneyGram presentation.

Merge gate: manual approval is mandatory. Never auto-merge.

### Phase 8 - Create Event form migration

Risk: **high-risk** because the form feeds publish and persistence behavior.

Scope:

- migrate Create Event to the shared form system;
- improve section hierarchy, field relationships, validation placement, and
  repeated collaborator/resource controls;
- keep payload shape, defaults, persistence, and publish behavior unchanged.

Acceptance criteria:

- existing valid submissions produce the same payload shape;
- validation rules are preserved unless a behavior change is separately
  approved and tested;
- errors are linked to their fields and an error summary appears when useful;
- keyboard users can add, edit, and remove repeated rows;
- mobile field order follows the event-creation task;
- no landing-page diff exists.

Verification:

- `npm run lint`
- `npm run build`
- `npm run db:smoke`
- `npm run demo:smoke`
- `npm run api:origin:smoke`
- Create Event browser flow and screenshots at all required viewports

Commit boundary: one commit for Create Event migration.

Merge gate: manual approval is mandatory. Never auto-merge.

### Phase 9 - Evidence and ledger read-only presentation

Risk: **standard**, provided no persistence or payout interaction changes.

Scope:

- adopt shared loading, empty, alert, tooltip, and disclosure patterns for
  evidence and ledger display;
- improve proof readability while keeping technical details one layer deeper;
- exclude withdrawal, payout, sync, and check-in mutations.

Acceptance criteria:

- event, recipient, amount, status, timestamp, and explorer evidence remain
  accurate and available;
- empty and partial-data states explain what is missing;
- long hashes and addresses do not cause overflow;
- no ledger query, persistence, payout, or settlement behavior changes;
- all affected routes pass responsive screenshot review.

Verification:

- `npm run lint`
- `npm run build`
- `npm run settlement:smoke`
- `npm run browser:qa`
- evidence and ledger screenshots at all required viewports

Commit boundary: one commit for read-only proof presentation.

### Phase 10 - Check-in interaction presentation

Risk: **high-risk**.

Scope:

- migrate check-in controls and state feedback to shared primitives;
- preserve ownership verification, mutation, and evidence behavior;
- standardize ready, checking, success, already-used, invalid, wrong-event,
  error, and retry states.

Acceptance criteria:

- check-in validation and mutation behavior are unchanged;
- success cannot be confused with a merely valid preview;
- the operator can recover from an error without reloading the page;
- keyboard and mobile operation remain fast and unambiguous;
- no live external signing is required for autonomous QA.

Verification:

- `npm run lint`
- `npm run build`
- `npm run demo:smoke`
- targeted check-in browser flow and state screenshots

Commit boundary: one commit for check-in presentation.

Merge gate: manual approval is mandatory. Never auto-merge.

### Phase 11 - Cleanup, accessibility, responsive, and regression audit

Risk: **standard** unless the audit discovers high-risk behavior changes, which
must move to a separate issue.

Scope:

- remove obsolete route-local UI markup after adoption;
- audit component APIs and eliminate unjustified variants;
- run final accessibility, responsive, copy, state, and landing-regression QA;
- update component documentation and execution status.

Acceptance criteria:

- no dead donor-style tokens, duplicate component systems, or unused wrappers
  remain;
- all 13 product routes pass desktop, tablet, and mobile visual QA;
- all relevant loading, empty, error, success, disabled, and retry states have
  deterministic evidence;
- keyboard focus order is coherent;
- reduced-motion mode remains usable;
- landing page matches the Phase 0 baseline;
- final documentation records completed phases and any deliberately deferred
  work.

Verification:

- `npm run lint`
- `npm run build`
- `npm run browser:qa`
- all smoke scripts relevant to the routes changed by prior phases
- final route-by-viewport screenshot audit

Commit boundary: one commit for cleanup and final QA evidence.

## Route Verification Matrix

The final visual regression set covers:

1. `/`
2. `/discover`
3. `/events/[slug]`
4. `/events/[slug]/checkout`
5. `/events/[slug]/resources`
6. `/events/[slug]/proof`
7. `/dashboard`
8. `/dashboard/events/new`
9. `/dashboard/ledger`
10. `/passes`
11. `/passes/[tokenId]`
12. `/evidence`
13. `/check-in/[eventId]`

Dynamic routes should use the deterministic seeded records already used by
`npm run browser:qa`.

## Risk and Merge Policy

### Standard phases

- require issue, branch, checks, screenshots, commit, and PR;
- may be merged only after Wildan explicitly approves the PR in the active
  thread;
- autonomous implementation may continue through PR preparation, but not past
  an approval boundary unless Wildan has granted a specific active approval.

### High-risk phases

- require a dedicated issue and isolated PR;
- should use a draft PR while implementation or verification is incomplete;
- must state which live behavior was not exercised;
- must never auto-merge;
- require Wildan's explicit review and merge approval after checks pass.

### Scope escalation

Stop the current phase and create a separate issue if implementation requires:

- changing wallet authentication or signatures;
- changing Stellar/Soroban transaction construction or submission;
- changing API contracts, persistence, settlement, check-in, payout, or ledger
  behavior;
- adding a database migration;
- adding secrets or changing Vercel/deployment configuration;
- changing MoneyGram/SEP behavior;
- upgrading dependencies outside the isolated dependency phase.

## Pull Request Evidence

Every implementation PR must contain:

- linked issue with `Closes #N`;
- summary of routes and components changed;
- explicit out-of-scope behavior;
- commands run and their results;
- screenshot links or attached before/after evidence;
- landing regression result when shared styles or primitives changed;
- risks and unverified external behavior;
- manual approval note for high-risk phases.

## Definition of Done

This plan is complete only when:

- the shared primitives are used by real Quorum routes, not only `/ui-kit`;
- route-local duplication has been reduced without creating a second design
  system;
- forms and critical action states are consistent and accessible;
- all route and state screenshot gates pass;
- relevant automated checks pass;
- landing remains unchanged;
- transaction, payout, check-in, and persistence behavior remain intact or any
  separately approved behavior changes are fully documented and verified;
- each phase has a real issue, focused PR, verification record, and appropriate
  merge approval.

## Implementation Start Point

After this document is approved and merged, begin with Phase 0 in a new issue.
Do not combine this planning PR with component implementation.
