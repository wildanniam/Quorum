# Quorum FE v2 Design Spec

Last updated: 2026-06-09.

This document locks the frontend redesign direction before implementation. It
is the source of truth for the FE v2 refactor and visual QA gates.

## Product Positioning

Quorum is not a Stellar console for events. Quorum is a premium event platform
with transparent settlement, access, and proof built in quietly.

Locked direction:

> Premium minimal event experience. Luma-inspired, event-first, dark editorial,
> dynamic event color, calm wallet trust layer, smooth purposeful motion.

Users should first understand:

1. I can discover or create a good event.
2. I can sell or claim passes.
3. Collaborators, access, and check-in stay organized.
4. Stellar, USDC, pass proof, and wallet approval make the flow trustworthy.

The technical layer is a trust detail, not the first impression.

## Current Problems To Remove

- The home page starts as a marketplace, so Quorum feels like an internal app
  instead of a product with a point of view.
- The UI overuses panels, cards, borders, badges, and stat boxes.
- The global visual language feels cyber-console: grid background, cyan/lime
  accents, mono labels, and proof-heavy copy.
- Event identity is weaker than system mechanics.
- The navigation exposes a dashboard/console posture too early.
- Motion is mostly hover transitions and loading spinners, not choreography.
- Checkout explains implementation details before it creates confidence.

## Information Architecture

| Route | FE v2 purpose |
|---|---|
| `/` | Premium landing page with product story and CTA. |
| `/discover` | Public event discovery and marketplace. |
| `/events/[slug]` | Event-first detail page with calm trust details. |
| `/events/[slug]/checkout` | Guided pass checkout and wallet approval flow. |
| `/events/[slug]/resources` | Access state and resources for pass owners. |
| `/passes` | Attendee pass library. |
| `/passes/[tokenId]` | Visual pass detail and proof state. |
| `/dashboard` | User-facing Studio workspace for organizers and collaborators. |
| `/dashboard/events/new` | Guided event creation with live preview. |
| `/check-in/[eventId]` | Organizer check-in flow. |

The route `/dashboard` may stay for implementation compatibility, but the
visible product label is `Studio`.

## Visual System

### Tone

- Minimal dark editorial.
- Spacious, calm, and event-led.
- Premium without looking like a luxury fashion template.
- Trustworthy without looking like blockchain infrastructure.

### Color

Base palette:

| Role | Direction |
|---|---|
| Background | Near-black or deep charcoal, mostly flat. |
| Surface | Very subtle elevation, not heavy glass everywhere. |
| Text | Warm white for primary, muted gray for secondary. |
| Line | Low-contrast hairlines only where structure is needed. |
| Accent | Comes from the event theme or active state. |
| Success/proof | Used sparingly in trust details, not as hero color. |

Rules:

- Remove the global cyber grid as the default page atmosphere.
- Do not let cyan, lime, amber, or coral dominate the full product.
- Use dynamic event color on event-specific visuals, CTA, glow, and selected
  metadata.
- Keep proof/USDC/pass colors quiet and secondary.

### Typography

- Use large editorial headings only for true hero moments.
- Use clean sans body copy for readability.
- Avoid mono text except for addresses, hashes, proof IDs, and tiny technical
  metadata.
- Headlines must be user-facing, not implementation-facing.

### Containers

Container diet:

- Use page sections and whitespace before adding a card.
- Cards are for repeated events, passes, modals, and contained tools.
- Avoid card-inside-card.
- Use borders as hairlines, not as the main design language.
- Replace many stat boxes with grouped narrative or simple inline metadata.

## Copywriting Rules

Use:

- "Create paid events with transparent splits."
- "Sell passes, unlock access, and check people in."
- "Attendees approve wallet actions before anything is submitted."
- "Collaborators can see what is owed."

Avoid as primary copy:

- "USDC routed"
- "Proof path"
- "Non-transferable NFT"
- "Local proof mode"
- "Soroban"
- "Contract action"
- "Live transaction boundary"

Those terms may appear inside trust details, diagnostics, runbooks, or compact
developer-facing proof sections.

## Motion System

Core libraries:

- `motion` for React component animation, layout transitions, card hover,
  page sections, checkout states, and pass reveal.
- `gsap` plus `@gsap/react` for landing page scroll storytelling only.
- `embla-carousel-react` for featured event carousel behavior.

Optional implementation patterns:

- Magic UI style `Blur Fade`, `Number Ticker`, `Animated List`, and `Confetti`
  patterns may be implemented locally or used selectively.
- Remotion is for future marketing/demo video assets, not runtime app motion.

Motion rules:

- Respect `prefers-reduced-motion`.
- Animate 1-2 key elements per view, not everything.
- Entrances use ease-out timing. Exits can be faster.
- Staggers follow hierarchy, not DOM order.
- Keep continuous animation subtle and rare.
- Use scroll-driven motion only on the landing story, not on operational flows.

Required motion moments:

1. Landing staged hero reveal.
2. Floating event card stack or event preview visual.
3. Scroll story for create, sell, attend, split, check in.
4. Discover card hover with image zoom, metadata lift, and CTA reveal.
5. Discover filter/layout transitions.
6. Event detail page entrance and trust detail expansion.
7. Checkout stepper for review, approval, processing, pass ready.
8. Pass reveal on success.
9. Studio number ticker and activity list reveal.

## Page Direction

### Landing `/`

Purpose: create product desire before marketplace browsing.

Must include:

- Simple nav.
- Hero headline and short subcopy.
- CTA pair: `Create event`, `Explore events`.
- Visual event preview/card stack.
- Short how-it-works story.
- Featured events teaser.
- Final CTA.

Must not:

- Show dashboard-style stats as the dominant hero.
- Lead with USDC, NFT, proof, or contract language.
- Look like a template SaaS landing page.

### Discover `/discover`

Purpose: browse events.

Must include:

- Search/category/filter in a light, unobtrusive way.
- Featured event carousel or editorial rail.
- Event-first cards with visual identity.
- Date, host, location, price/free, and CTA.
- Trust indicator as a small secondary detail.

### Event Detail

Purpose: decide to attend.

Must include:

- Large event visual.
- Clear title, host, date, time, location, price/free, and capacity.
- Clear CTA.
- Compact trust details for split, pass, access, and check-in.

### Checkout

Purpose: make wallet approval feel safe.

Must include:

- Stepper: Review, Approve wallet, Processing, Pass ready.
- Plain language wallet explanation.
- Calm transaction detail summary.
- Rewarding success state.

### Passes And Resources

Purpose: make access feel valuable.

Must include:

- Pass library with visual event identity.
- Pass detail that feels like an access object.
- Locked/unlocked resource states.
- Proof details available but not visually dominant.

### Studio

Purpose: organizer and collaborator workspace.

Must include:

- Creator workspace tone.
- Event management.
- Revenue/split overview.
- Attendee/pass activity.
- Proof timeline as a secondary trust surface.

## Development Phases And Acceptance Gates

Each FE implementation phase must follow this gate:

1. Implement only the current phase scope.
2. Start the app and capture desktop and mobile screenshots of affected pages.
3. Analyze screenshots before committing:
   - first impression;
   - hierarchy;
   - spacing;
   - container overload;
   - color balance;
   - copy clarity;
   - mobile fit;
   - motion appropriateness.
4. Fix visual issues before moving on.
5. Run phase-relevant checks.
6. Commit before starting the next phase.

Screenshots can be stored outside the repo under `/tmp` unless a doc update
needs to reference them.

## Phase List

1. FE v2 design spec.
2. Motion and visual foundation.
3. App shell and navigation.
4. Landing page at `/`.
5. Discover marketplace at `/discover`.
6. Event detail.
7. Checkout and wallet flow.
8. Passes and resources.
9. Studio dashboard.
10. Create event flow.
11. Global motion QA and visual polish.

## Final FE Definition Of Done

FE v2 is complete only when:

- `/` is a premium landing page, not the marketplace.
- `/discover` is event-first and browseable.
- event detail focuses on attending.
- checkout clearly explains wallet approval and feels rewarding.
- Studio feels like a creator workspace, not a console.
- passes/resources feel like access products.
- technical terms are secondary trust details.
- motion feels intentional and respects reduced motion.
- desktop and mobile screenshots pass visual review for all major pages.
- `npm run lint`, `npm run build`, and browser QA pass after final polish.

## Phase 0 Baseline Screenshot Audit

Captured locally on 2026-06-09:

- `/tmp/quorum-fev2-phase0-home-desktop.png`
- `/tmp/quorum-fev2-phase0-home-mobile.png`
- `/tmp/quorum-fev2-phase0-event-desktop.png`
- `/tmp/quorum-fev2-phase0-event-mobile.png`
- `/tmp/quorum-fev2-phase0-studio-desktop.png`
- `/tmp/quorum-fev2-phase0-studio-mobile.png`

Baseline findings:

- Home currently behaves like discover/marketplace instead of a landing page.
- The first viewport is dominated by event mechanics and a ledger panel.
- Header still presents `Console`, which reinforces the technical product
  posture.
- Event detail has a strong visual event cover, but price/pass/proof mechanics
  compete with the event decision too early.
- Studio mobile is readable, but the language and structure are operational:
  role console, proof trail, contract policy, and many bordered panels.
- Motion is not visible as a product language; current perceived motion is
  mostly hover transitions and loading feedback.
