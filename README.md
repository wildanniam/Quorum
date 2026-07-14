# Quorum

Quorum is a Stellar-native collaborative event checkout platform for Web3 events.

The MVP follows the locked direction in `TECHNICAL_SPEC.md` and `DEVELOPMENT_PLAN.md`: lightweight event platform surfaces, split payout escrow, non-transferable NFT event passes, gated resources, and role-based transparency dashboards.

## Current Status

Quorum is publicly deployed at
`https://quorum-sandy-eight.vercel.app`. The Soroban core and pass contracts are
deployed on Stellar testnet, the runtime exposes the expected contract and USDC
IDs, and a historical July 4 live flow records real publish, paid checkout, free
claim, check-in, and withdrawal hashes.

The current release is deployed from `main`, production Postgres has all five
repository migrations, the evidence page is healthy, and the hosted indexer is
protected by a sensitive `CRON_SECRET`. Two authenticated indexer runs advanced
the cursor and latest-ledger checkpoint without errors. They found no recoverable
Quorum events because the older flow is outside RPC event retention, so a fresh
current-origin Freighter-signed flow is still required before final submission.
MoneyGram SEP integration is implemented, but provider allowlist approval and a
successful cash pickup are not proven.

Use `docs/MVP_READINESS.md` for current status and
`docs/HACKATHON_PROOF_INVENTORY.md` for claim-to-evidence mapping.

Implemented in the app shell:

- public marketplace surface;
- featured published event from the local database;
- event detail pages;
- role-aware transparency dashboard;
- draft event create/update form;
- checkout and claim page;
- attendee pass index and pass detail pages;
- session-gated resources page;
- organizer check-in page;
- Freighter-first wallet auth foundation;
- signed wallet session API routes;
- Postgres migration foundation for local, Supabase, and isolated smoke schemas;
- custom Soroban event indexer storage and Vercel Cron route;
- public evidence ledger and event-specific proof pages with explicit app,
  indexed, and explorer-verifiable labels;
- collaborator ledger page with credit/debit rows and explorer proof links;
- draft event create/update API routes;
- publish-to-marketplace DB stub;
- collaborator percentage split setup;
- gated resource setup;
- `QuorumPassNFT` Soroban contract;
- `QuorumCore` Soroban contract;
- local checkout/claim API route;
- local pass proof and purchase recording;
- marketplace metrics for minted passes and routed USDC;
- organizer-authorized local check-in API route;
- collaborator local withdrawal API route;
- dashboard metrics for organizer revenue, collaborator balances, attendee passes, and proof queue.
- settlement smoke proof for indexer, evidence pages, and collaborator ledger;
- event lifecycle guards for upcoming, live, and ended events;
- MoneyGram eligibility guard that rejects local settlement proof.

Release checkpoints still open:

- current-Vercel Freighter-signed evidence after explicit approval, followed by
  one hosted indexer run that captures those fresh events;
- final responsive browser QA and screenshot packet;
- MoneyGram provider approval, if it arrives before submission.
- final hackathon submission approval.

## Local Development

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local` when you need local secrets. The default database URL is `postgresql://postgres:postgres@127.0.0.1:5432/quorum`; set `DATABASE_URL` to your local Postgres or Supabase pooled URL. Set `DIRECT_DATABASE_URL` only when migrations need a separate direct connection. `QUORUM_DB_SCHEMA` defaults to `public`.
Hosted or production deployments must set `QUORUM_SESSION_SECRET` to a
non-placeholder value of at least 32 characters; local development can use the
fallback secret.

Supabase is used only as server-side Postgres. Do not add
`NEXT_PUBLIC_SUPABASE_*` variables or service-role keys to the browser/runtime
env.

## Verification

```bash
npm run db:migrate
npm run db:seed
npm run db:smoke
npm run lint
npm run build
npm audit --audit-level=moderate
npm run demo:smoke
npm run event:lifecycle:smoke
npm run product:messaging:smoke
npm run demo:live-policy
npm run settlement:smoke
npm run indexer:security:smoke
npm run anchor:config:smoke
npm run anchor:eligibility:smoke
npm run anchor:sep10:smoke
npm run browser:qa
npm run deploy:env:smoke
npm run deploy:hosted:preflight:smoke
npm run live:args:smoke
npm run live:flow:smoke
npm run live:persistence:smoke
npm run live:preflight:smoke
npm run live:signing:smoke
npm run live:submission:smoke
npm run live:xdr:smoke
npm run live:browser-flow:smoke
npm run live:ui-wiring:smoke
npm run live:deployment:validate
npm run indexer:run
npm run evidence:local
npm run readiness:audit
npm run readiness:final
npm run submission:hosted:probe
npm run submission:gate
npm run submission:db:gate:smoke
npm run submission:package:smoke
cargo test
stellar contract build
npm run contracts:doctor
```

`npm run readiness:audit` verifies source readiness while accepting the two
clearly labeled historical QA snapshots. `npm run readiness:final` is the final
submission gate: it rejects those historical snapshots and requires freshly
generated command and browser evidence from the release candidate.

`npm run submission:gate` runs the complete non-destructive autonomous suite.
It intentionally excludes database-writing integration tests, browser
automation, hosted cron calls, wallet signing, provider execution, deployment,
and submission. `npm run submission:hosted:probe` performs public GET requests
only and cannot mutate the hosted application.

The database-backed release suite is available separately and refuses every
non-local database host:

```bash
QUORUM_RELEASE_DATABASE_URL='postgresql://user:password@127.0.0.1:5432/quorum_release' \
  npm run submission:db:gate
```

It migrates and seeds that disposable local database, then runs database,
demo, wallet auth, live-policy, settlement/indexer, live-flow, and persistence
smokes sequentially. Never substitute a Supabase or production URL.

`npm run anchor:sep10:smoke` is hermetic and uses generated fixture keys.
`npm run anchor:sep10:live` is intentionally outside the autonomous gate because
it requires the real client-domain secret and a live MoneyGram response.

`npm run demo:smoke` starts an isolated local Next.js dev server, seeds a temporary Postgres schema, and verifies marketplace, paid checkout, free claim, duplicate pass guard, gated resources, organizer check-in, collaborator withdraw, pass detail, and dashboard proof surfaces.

`npm run demo:live-policy` starts an isolated local Next.js dev server with fake
valid contract IDs, verifies non-signing live action preparation, confirms the
preflight route fails invalid requests before RPC, and confirms mutation routes
fail safe without creating local proof records.

`npm run settlement:smoke` creates a temporary Postgres schema and proves the
PR 2/3/5 surfaces together: idempotent Soroban event ingestion, indexer
cursor/latest-ledger state, global and event evidence read models, Stellar
Explorer links, collaborator credit ledger rows, collaborator withdrawal debit
rows, and withdrawable balance math.

`npm run indexer:run` performs one real Stellar RPC `getEvents` indexer pass
for the configured Quorum contracts. The same worker is exposed at
`GET /api/indexer/stellar-events` for Vercel Cron and manual hosted ingestion.

`npm run browser:qa` runs a headless browser across desktop/mobile viewport
checks and regenerates `docs/BROWSER_QA.md`.

`npm run live:args:smoke` verifies deterministic contract argument encoding for
future Freighter-signed publish, checkout, check-in, and withdraw flows,
including USDC decimal-to-atomic and atomic-to-decimal conversion.

`npm run live:flow:smoke` verifies the mock full live publish, paid checkout,
free claim, check-in, and withdraw chain from prepared DB action to preflight,
mock Freighter signing, mock RPC finality, decoded return values, and
post-success persistence through `live-result-persistence.ts`, without
submitting to testnet.

`npm run live:persistence:smoke` verifies the DB path for recording verified
live publish, pass, check-in, and withdrawal transaction results while rejecting
stub hashes and replayed hashes through the global live proof registry.

`npm run live:preflight:smoke` verifies the pre-signing RPC orchestration with a
mock server: fetch signer sequence, prepare/simulate the Soroban transaction,
and return parseable XDR ready for wallet signing.

`npm run live:signing:smoke` verifies the Freighter signing adapter with a mock
signer, including address/network options, prepared XDR source/contract/function
and argument guards before wallet signing, signer mismatch handling, wallet
rejection normalization, and returned signed XDR validation.

`npm run live:submission:smoke` verifies the signed transaction submission and
finality polling adapter with a mock RPC server, including source wallet,
contract/function/argument mismatch rejection before RPC, failure, timeout paths,
and Soroban return value decoding for purchase token IDs and withdraw amounts.

`npm run live:browser-flow:smoke` verifies the browser-side preflight,
Freighter signing, and signed-XDR submit sequence with mock fetch and signer
boundaries, including rejection of mismatched preflight metadata and argument
XDR before signing. It does not open Freighter or submit to testnet.

`npm run live:ui-wiring:smoke` verifies the publish, checkout, check-in, and
withdraw UI actions are wired to the browser live flow helper when
`live_required` is returned.

`npm run live:deployment:validate` validates the recorded testnet deployment
evidence against Horizon, Soroban RPC events, and fetched contract interfaces
without signing or submitting transactions.

`npm run live:xdr:smoke` verifies pre-simulation unsigned Soroban XDR templates
for the same contract actions. These XDRs are not signed and still require live
account sequence fetch plus RPC simulation/assembly before Freighter signing.

`npm run contracts:doctor` is safe to run without signing transactions. It
reports live deployment blockers such as missing `STELLAR_ACCOUNT` or missing
`QUORUM_LIVE_SIGNING_APPROVED=I_APPROVE_TESTNET_SIGNING`.

`npm run evidence:local` runs the local verification suite and writes `docs/DEMO_EVIDENCE.md`.

`npm run readiness:audit` is a non-signing final consistency check for the
local evidence packet, readiness docs, live approval gates, and contract doctor
output.

`npm run deploy:env:smoke` verifies hosted-session guardrails without using
cloud credentials: production rejects missing, placeholder, local fallback, and
short `QUORUM_SESSION_SECRET` values.

`npm run deploy:hosted:preflight:smoke` verifies the hosted deployment
preflight rules without cloud credentials or signing: public HTTPS URL,
production session secret, Postgres `DATABASE_URL`, exact contract/env match
against `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`, absence of operator
signing env and browser Supabase env, and live `/api/contracts/status` action
policies. For a real hosted target, run
`npm run deploy:hosted:preflight -- --url https://<hosted-app> --env-file <pulled-env-file>`.

Live testnet deployment signs transactions and is intentionally gated by funded
wallet approval:

```bash
npm run contracts:deploy:testnet
npm run contracts:init:testnet
```

Those scripts refuse to run unless `QUORUM_LIVE_SIGNING_APPROVED` is set to
`I_APPROVE_TESTNET_SIGNING` after explicit approval.

Read-only deployment evidence is recorded in
`docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`. The current
`docs/LIVE_TESTNET_EVIDENCE.json` is a historical July 4 ngrok run. After an
approved Vercel signing session, refresh that packet with current-origin URLs
and unique app-flow transaction hashes, then run `npm run live:evidence:audit`.
Use `docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md` for the manual browser wallet
signing sequence.

## Planning Docs

- `TECHNICAL_SPEC.md`
- `DEVELOPMENT_PLAN.md`
- `docs/QUORUM_PM_GOAL_BRIEF.md`
- `docs/HACKATHON_DEMO_RUNBOOK.md`
- `docs/HACKATHON_PROOF_INVENTORY.md`
- `docs/HACKATHON_SUBMISSION_RECOVERY_PLAN.md`
- `docs/DEMO_EVIDENCE.md`
- `docs/MVP_READINESS.md`
- `docs/PRODUCTION_ENV_HANDOFF.md`
- `docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md`
- `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`
- `docs/LIVE_SIGNING_HANDOFF.md`
