# Quorum Frontend Redesign Direction

Last updated: 2026-06-09.

This document locks the frontend redesign direction before implementation. The
goal is to move Quorum from a technically complete MVP surface into a polished
live testnet demo product without changing the core product scope or requiring
manual Freighter signing during frontend development.

## Source Inputs

- User feedback: current UI feels weak in visual design, navigation, layout,
  and flow.
- Installed local design tooling: `ui-ux-pro-max` via `npx uipro-cli init --ai
  codex`; used for design-system, product, style, UX, and stack searches.
- Existing frontend audit: marketplace, event detail, checkout, dashboard, pass,
  resources, and check-in routes under `src/app`.
- Existing implementation constraints: Next.js App Router, Tailwind CSS,
  lucide-react icons, Freighter wallet flow, live testnet contract IDs, local
  smoke evidence, and no new signing/cloud actions without explicit approval.

## Product Thesis

Quorum should feel like a premium event operating system for on-chain
communities.

The product is not a generic crypto dashboard. It is an event commerce and
access product where every payment, pass, check-in, and collaborator payout has
a clear proof trail. The UI should make that proof feel useful and trustworthy,
not noisy or intimidating.

## Design Concept

### Living Event Ledger

Every event has a living ledger that follows the event lifecycle:

1. Event is published.
2. Attendee buys or claims a pass.
3. Pass unlocks resources.
4. Organizer checks the pass in.
5. Collaborators see and withdraw balances.

The proof trail should be shown as a timeline and status system, not as a raw
technical log. Transaction hashes remain available, but the first read should
be human: who paid, what unlocked, what changed, and what is ready next.

## Visual Positioning

Quorum should sit between three references:

- Luma-like event clarity: beautiful event discovery, clear date/price/location,
  frictionless primary CTA, and strong event identity.
- Gemini-like dynamic color: contextual color fields, soft luminous accents,
  and stateful color changes that feel alive without turning into a gradient
  wallpaper.
- Fintech-grade transaction confidence: legible money movement, wallet/network
  clarity, split previews, status checkpoints, and recoverable errors.

## What To Avoid

The `ui-ux-pro-max` search suggested some Web3 defaults such as pixel art,
Orbitron, and heavy crypto-futuristic styling. Quorum should intentionally avoid
that direction because it would make the product feel gimmicky and less
trustworthy.

Avoid:

- Terminal/debug dashboard aesthetics as the dominant interface.
- One-note lime-on-black styling.
- Pixel art, cyberpunk excess, or novelty Web3 typography.
- Huge generic hero marketing sections that delay the usable product.
- Dense proof jargon before the user understands the action.
- Card-inside-card layouts.
- UI copy that explains implementation instead of user value.
- Motion that blocks reading, checkout confidence, or accessibility.

## Design Principles

1. Action before explanation.
   Every screen should have one obvious primary action and one obvious fallback.

2. Role before route.
   Organizer, attendee, and collaborator states should guide layout and copy.
   The dashboard should not feel like a mixed dump of all possible data.

3. Proof as confidence.
   Proof should reduce anxiety: payment split, pass ownership, unlock, check-in,
   and withdrawal status should each explain what happened and what is next.

4. Dynamic color with restraint.
   Event identity should drive accent color, pass visuals, hover states, proof
   timeline highlights, and CTA treatment. The shell remains neutral and highly
   readable.

5. Wallet signing must be calm.
   Checkout and publish flows should clearly state wallet, network, amount,
   contract action, and expected result before Freighter opens.

6. Mobile is not an afterthought.
   Event discovery, checkout, pass, and check-in must be excellent at mobile
   widths. Text cannot overlap or overflow.

7. Live testnet honesty.
   The UI may show deployed contract readiness, but it must not claim a live
   browser transaction is complete until a real signed transaction hash exists.

## Information Architecture

### Navigation

Primary navigation should map to user jobs:

- Discover: marketplace and event discovery.
- Create: organizer draft and publish flow.
- Console: role-aware dashboard.
- Passes: attendee access and verification.

The wallet control should expose:

- disconnected, connecting, connected, and error states;
- shortened wallet address;
- network;
- testnet/live readiness status;
- disconnect as a secondary icon action.

### Marketplace

Purpose: make the event feel worth joining.

Primary content:

- Featured event with date, price, capacity, location, and strongest benefit.
- Event cards with dynamic color, cover image, pass type, and proof highlights.
- Split story summarized as collaborator roles, not basis-point/account jargon.
- Clear CTA: open event or create an event.

Copy direction:

- Replace "Proof path" with "What your pass unlocks" or "Event proof trail".
- Replace "USDC-ready" with "USDC checkout ready".
- Replace "Non-transferable NFT" with "One wallet, one pass" first, then show
  NFT proof as supporting detail.

### Event Detail

Purpose: help a visitor decide and proceed.

Layout direction:

- Hero with event identity, date, location, price, and CTA visible above fold.
- Sticky or persistent checkout CTA on mobile.
- Split preview as "Where the money goes".
- Resources preview as "Included after pass".
- Proof timeline as a compact trust section.

### Checkout

Purpose: create signing confidence.

Required UX blocks:

- Order summary: event, price, capacity, pass type.
- Wallet/network readiness.
- Split preview: organizer/speaker/community shares.
- Signing stepper:
  1. Review.
  2. Prepare transaction.
  3. Sign in Freighter.
  4. Submit to Stellar.
  5. Pass minted.
- Error states with recovery: reconnect wallet, switch to testnet, retry,
  sold-out, already owns pass, insufficient USDC.

No real Freighter signing is required during frontend redesign; UI states can be
designed with local/mock state only.

### Dashboard

Purpose: tell each role what matters now.

Structure:

- Role overview tabs or segmented controls: Organizer, Attendee, Collaborator.
- Organizer: published/draft events, pass count, check-ins, revenue routed,
  next action.
- Attendee: owned passes, resource unlocks, check-in status.
- Collaborator: earned, withdrawable, withdrawn, proof history.
- Proof timeline: publish, checkout, mint, unlock, check-in, withdraw.

### Pass

Purpose: make the access proof feel valuable.

Layout direction:

- Event-colored pass visual.
- Token ID and owner wallet present but not visually dominant.
- Clear actions: open resources, verify/check in.
- Proof details as expandable or supporting panels.

### Resources

Purpose: make access gating obvious.

States:

- Locked: explain which pass unlocks resources and route to checkout.
- Unlocked: show resource cards with clear open actions.
- Wrong wallet: explain that the connected wallet does not own this pass.

### Check-In

Purpose: organizer utility under time pressure.

Layout direction:

- Large input/manual token lookup.
- Clear pass status.
- Recent check-ins.
- Event stats: checked in, minted, remaining.
- Minimal ornamentation; speed and confidence matter.

## Design System Direction

### Palette

Base shell:

- Background: deep neutral graphite, not pure black.
- Surfaces: layered charcoal with subtle translucent treatment.
- Text: warm off-white for headings, soft neutral for body.
- Lines: low-contrast, used sparingly.

Dynamic event accents:

- Accent A: derived from event category or cover mood.
- Accent B: complementary support color.
- Success: trust green, used with text/icon, never color alone.
- Warning/error: amber/coral with `role=alert` copy.

Implementation target:

- CSS variables on event containers, such as `--event-accent`,
  `--event-accent-2`, `--event-glow`, and `--event-ink`.
- Neutral app shell remains stable while event surfaces adapt.

### Typography

Keep typography refined and product-like. Avoid novelty Web3 display fonts for
the app core.

Direction:

- Use the existing Geist foundation if it continues to feel sharp and readable.
- Add distinction through scale, weight, spacing, and layout, not gimmick fonts.
- Use monospace only for addresses, token IDs, transaction hashes, and compact
  proof metadata.

### Shape And Layout

- Cards should use restrained radii, no larger than 8px unless a component has
  a specific reason.
- Avoid cards inside cards. Use full-width bands or unframed grid sections for
  page structure.
- Use repeated cards for events, passes, resources, and proof rows only.
- Build stable dimensions for nav, wallet controls, cards, tiles, and check-in
  forms so dynamic text does not shift layout.

### Motion

- Use 150-300ms transitions for interaction.
- Use subtle 8-12s ambient color movement only on non-critical backgrounds.
- Respect `prefers-reduced-motion`.
- Avoid motion on transaction-critical copy that users must read.

### Accessibility

- All error messages need `role="alert"` or equivalent announcement.
- Do not communicate status by color alone.
- Icon-only actions need accessible names.
- Focus states must be visible.
- Text contrast should be checked on all dynamic-color surfaces.

## Phase Plan

### FE-1: Design System Foundation

Implement tokens, base primitives, dynamic event color helpers, and shared UI
classes. Do not redesign every route in this phase.

Acceptance criteria:

- `npm run lint` passes.
- `npm run build` passes.
- Homepage renders without visual regression.
- Lime grid/terminal styling is no longer the dominant system.
- No cards are nested inside cards.
- Dynamic event color tokens are available for future pages.

Screenshot review:

- Desktop homepage.
- Mobile homepage.

Commit:

```text
style: add Quorum design system foundation
```

### FE-2: App Shell And Navigation

Redesign app shell, navigation, wallet control, and global status treatment.

Acceptance criteria:

- Navigation has clear current-page state.
- Wallet disconnected, connected, loading, and error states are legible.
- Mobile navigation is usable.
- Header does not overlap content.
- Visual direction matches premium event OS, not terminal dashboard.

Screenshot review:

- Desktop home with disconnected wallet.
- Mobile home.
- Dashboard route shell.

Commit:

```text
feat: redesign Quorum app shell navigation
```

### FE-3: Marketplace And Event Detail

Redesign discovery and event decision surfaces.

Acceptance criteria:

- Marketplace reads as event discovery.
- Featured event, price, date, location, capacity, and CTA are immediately
  clear.
- Event cards use dynamic event color with readable contrast.
- Event detail has a clear checkout CTA and "where the money goes" section.
- Mobile event detail remains scannable.

Screenshot review:

- Marketplace desktop and mobile.
- Event detail desktop and mobile.

Commit:

```text
feat: redesign marketplace and event pages
```

### FE-4: Checkout And Signing States

Redesign checkout for transaction confidence.

Acceptance criteria:

- Review, prepare, sign, submit, and minted states are represented.
- Wallet and network status are visible.
- USDC amount and split preview are clear.
- Error states include recovery guidance.
- No real Freighter signing is required for screenshot review.

Screenshot review:

- Disconnected checkout.
- Ready checkout.
- Signing/pending mock state.
- Error mock state.

Commit:

```text
feat: redesign checkout and signing states
```

### FE-5: Role Dashboard

Redesign dashboard around organizer, attendee, and collaborator roles.

Acceptance criteria:

- Role sections or segmented controls are clear.
- Organizer, attendee, and collaborator primary actions are obvious.
- Proof timeline summarizes lifecycle progress.
- Empty/no-wallet states are useful.
- Mobile dashboard avoids table-like overflow.

Screenshot review:

- Dashboard desktop.
- Dashboard mobile.
- No-wallet or sparse-role state.

Commit:

```text
feat: redesign role dashboards
```

### FE-6: Pass, Resources, And Check-In

Redesign access utility surfaces.

Acceptance criteria:

- Pass page feels like a premium access proof.
- Resource locked/unlocked states are clear.
- Check-in is fast and organizer-focused.
- Proof details remain accessible without dominating the UI.

Screenshot review:

- Pass page.
- Resources locked.
- Resources unlocked or pass-owner state.
- Check-in desktop and mobile.

Commit:

```text
feat: redesign pass resources and check-in flows
```

### FE-7: Visual QA And Polish

Run full visual QA and polish before moving back to live-readiness work.

Acceptance criteria:

- Screenshots confirm the redesign is cohesive.
- Text does not overlap or overflow.
- Primary actions are obvious on each route.
- `npm run lint` passes.
- `npm run build` passes.
- Browser QA passes or issues are fixed before commit.

Commit:

```text
test: verify redesigned Quorum frontend
```

## Post-FE Autonomous Live-Readiness

After FE-7 is complete and committed, continue with the non-interactive live
readiness phases already approved:

1. Record live testnet contract deployment evidence.
2. Add read-only live contract validation.
3. Wire read-only validation into evidence.
4. Add production environment handoff.
5. Add manual Freighter signing runbook.
6. Harden hosted deployment preflight.
7. Final autonomous readiness audit.

These phases still exclude Freighter signing, faucet work, cloud deployment, and
new transaction signing unless explicitly approved.
