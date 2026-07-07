# Agent Guide - Quorum

Quorum is a Next.js + Stellar/Soroban product surface for event passes, receipt
evidence, check-in, settlement, and anchor payout flows.

## Operating Mode

Use the global Wildan coding workflow:

- meaningful work starts from an issue
- work happens on a `codex/<issue>-short-topic` branch
- changes land through a pull request
- verification is recorded in the PR
- merge requires Wildan approval

Do not create fake issues, empty PRs, or metric-only commits.

## Risk Model

Treat these areas as high-risk:

- wallet authentication and signature flows
- Stellar/Soroban transaction creation, signing, and submission
- settlement, check-in, payout, and ledger persistence
- database migrations, schema changes, and seed data
- deployment configuration, secrets, Vercel, and hosted env validation
- MoneyGram or anchor integration behavior

For high-risk work, plan first, keep the PR small, document unverified parts,
and do not merge without explicit approval.

## Repository Shape

- `src/app` contains Next.js routes.
- `src/components` contains UI and interaction components.
- `src/lib` contains domain, DB, Stellar, auth, anchor, and event logic.
- `scripts` contains smoke tests, deployment checks, and operational utilities.
- `contracts` contains Soroban contract source.
- `docs` contains live evidence, runbooks, and deployment documentation.

## Common Commands

Use npm for this repo.

```bash
npm run lint
npm run build
```

Run targeted smoke checks when touching related areas:

```bash
npm run demo:smoke
npm run wallet:auth:smoke
npm run settlement:smoke
npm run anchor:config:smoke
npm run anchor:sep10:smoke
npm run live:preflight:smoke
npm run live:submission:smoke
npm run contracts:doctor
```

For contract changes, also consider:

```bash
npm run contracts:test
npm run contracts:build
```

Only run live testnet deployment/signing commands after Wildan explicitly
approves the live operation and required env vars.

## Verification Expectations

- Docs-only changes: review rendered Markdown when practical.
- UI changes: run lint/build and verify browser/mobile behavior when feasible.
- API/server changes: run lint/build and a targeted smoke script if one exists.
- Wallet/Stellar/anchor changes: run the closest smoke script and document any
  external network or signing behavior not verified.
- DB changes: avoid destructive operations; document migration and rollback notes.

If a command cannot run locally because env, network, or credentials are missing,
state that clearly in the PR.

## Pull Requests

Use the shared PR template inherited from `wildanniam/.github` unless a local
template is added later. PRs should include summary, verification, risks/notes,
and `Closes #N` when resolving an issue.

Prefer focused PRs. Avoid mixing UI polish, backend behavior, contract changes,
and deployment config unless they are inseparable.

