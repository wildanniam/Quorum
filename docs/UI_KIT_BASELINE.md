# UI Kit Baseline Evidence

Captured: 2026-07-12.

This baseline supports Phase 0 of
`docs/INTERNAL_UI_DONOR_ADOPTION_PLAN.md`. It records the reference state before
shared UI primitives are adopted by product routes.

## Routes and viewports

The following screenshots were captured locally under
`output/playwright/ui-kit-baseline/` (intentionally Git-ignored):

| Route | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| `/` | `landing-desktop.png` | `landing-tablet.png` | `landing-mobile.png` |
| `/discover` | `discover-desktop.png` | `discover-tablet.png` | `discover-mobile.png` |
| `/ui-kit` | `ui-kit-desktop.png` | `ui-kit-tablet.png` | `ui-kit-mobile.png` |

Viewport sizes:

- Desktop: `1440 x 900`
- Tablet: `1024 x 768`
- Mobile: `390 x 844`

## Result

- Landing page rendered normally at all baseline sizes.
- Discover rendered without visible horizontal overflow at all baseline sizes.
- `/ui-kit` rendered with readable action, status, form, record, feedback, and
  loading fixtures at all baseline sizes.
- The mobile UI kit screenshot showed action controls wrapping without clipping
  and the product mobile navigation remained usable.
- Keyboard focus reached the product skip link first.
- `/ui-kit` returned `noindex, nofollow` metadata.
- Browser console contained no error or warning messages during the UI kit check.

These images are audit artifacts, not source assets. Future shared-style or
layout changes must recapture the landing views and investigate any unexplained
visual difference before merge.
