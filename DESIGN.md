# Quorum Design System

## Register

Quorum uses a hybrid design register:

- Brand UI for the public landing page.
- Product UI for discover, event checkout, passes, evidence, and dashboard flows.

The landing page should feel like a premium Stellar event-payment product, not
a technical console or marketplace listing. The app pages can remain more
operational, but should inherit the same disciplined cyan-on-black system over
time.

## Audience And Path

Primary landing audience:

- Web3 community organizers deciding whether Quorum solves paid event payouts.
- Collaborators, speakers, and partners who care about settlement visibility.
- Hackathon judges evaluating Stellar relevance and technical credibility.

Primary landing path:

1. Understand the product promise in the hero.
2. See that ticket revenue can be split automatically.
3. Understand the three-step flow.
4. Trust that passes, settlement, and proof are verifiable.
5. Continue to `/discover` or `/dashboard/events/new`.

## Figma Source

Approved landing reference:

- Figma file: `APAC Stellar`
- Node: `181:757`
- URL: `https://www.figma.com/design/XqdufXkbe8nXIRXoBg1fxO/APAC-Stellar?node-id=181-757`

Key sections in the reference:

- Header with Quorum logo, centered nav, and `Start Splitting` CTA.
- Hero with `Powered by Stellar`, cyan emphasis, orbital glow, and logo strip.
- About copy positioning Quorum as a collaborative checkout layer.
- Three-step workflow with revenue split preview.
- Feature grid for split, checkout, ledger, and wallet-verifiable pass.
- Testimonials carousel.
- FAQ row list.
- Oversized `Quorum.` footer wordmark.

## Visual Principles

- Use near-black surfaces, not pure black.
- Use cyan as the primary signal color. Avoid bringing the old gold accent into
  the landing page.
- Keep cards thin, quiet, and edge-lit. Do not make the page a card collage.
- Prefer open space and section rhythm over dense dashboard composition.
- Use the orbit/grid/glow motif as product atmosphere, not random decoration.
- Copy must be specific: revenue split, settlement proof, wallet pass, Stellar.
- Avoid vague marketing words such as "seamless" unless they are part of the
  Figma copy being intentionally preserved.

## Tokens

Landing tokens are scoped through `.landing-shell` and CSS variables:

- Background: `#0b0b0b`, `#0f0f0f`, `#111314`
- Text: `#f5f7f7`
- Muted text: `#a7acad`
- Cyan: `#26c6da`
- Soft cyan: `#8feaf2`
- Deep cyan: `#0f343a`
- Border: `rgba(255, 255, 255, 0.13)`
- Strong cyan border: `rgba(142, 238, 247, 0.34)`

Typography:

- Product/landing font: Outfit.
- Mono/data labels: Geist Mono.
- Avoid Playfair on the landing page; the Figma reference is a rounded modern
  sans direction.

## Component Vocabulary

Landing-specific components should live under `src/components/landing/`:

- `LandingHeader`
- `LandingLogo`
- `LandingButton`
- `SectionLabel`
- `HeroOrbit`
- `LogoStrip`
- `RevenueSplitPreview`
- `WorkflowSteps`
- `FeatureCard`
- `TestimonialCard`
- `FAQAccordion`
- `LandingFooter`

Shared app components such as `QuorumButton`, `StatusPill`, and `ProofSurface`
remain valid for product pages, but landing components may use stricter Figma
styling.

## Motion Budget

Motion should be refined and limited:

- Hero entrance and section reveal are allowed.
- Card hover may use transform and opacity.
- Orbital hero detail can animate subtly only when `prefers-reduced-motion`
  allows it.
- FAQ expansion should be short and stable.
- Do not use continuous decorative animation that distracts from reading.
- Do not animate layout properties such as width, height, top, or left.

## States

Required states for landing controls:

- Default, hover, active, focus-visible, disabled where applicable.
- FAQ expanded and collapsed.
- Mobile nav open and closed if a menu is introduced.
- Reduced-motion fallback.

## Anti-Patterns

- No technical-console first impression.
- No generic purple-blue gradient.
- No decorative orb/bokeh fields.
- No nested cards.
- No fake data that looks like placeholder filler.
- No landing content dependent on live event DB rows.
- No absolute Figma translation that breaks responsive layout.
