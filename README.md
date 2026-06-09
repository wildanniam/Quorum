# Quorum

Quorum is a Stellar-native collaborative event checkout platform for Web3 events.

The MVP follows the locked direction in `TECHNICAL_SPEC.md` and `DEVELOPMENT_PLAN.md`: lightweight event platform surfaces, split payout escrow, non-transferable NFT event passes, gated resources, and role-based transparency dashboards.

## Current Status

The local hackathon demo flow is implemented and verified on Postgres. The app can create, update, publish, publicly list local paid/free events, run wallet-authenticated checkout/claim, issue a unique local pass proof, show attendee pass pages, gate event resources from the connected wallet session, record organizer check-ins, and let collaborators withdraw local proof balances.

The Soroban contracts cover event registry, token escrow transfer, NFT pass minting, split accounting, collaborator withdrawal transfer, platform fee withdrawal, check-in, and proof event emission. Testnet contract IDs and the USDC contract ID are recorded and read-only validated. Live on-chain publish/checkout/withdraw/check-in from the hosted app still needs Supabase/Vercel configuration, hosted migrations, and explicit wallet signing approval.

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

Not completed yet:

- Vercel project/env configuration;
- Supabase project/env configuration;
- real Freighter-signed hosted publish, checkout, free claim, check-in, and withdraw evidence.

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
npm run demo:live-policy
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
npm run evidence:local
npm run readiness:audit
cargo test
stellar contract build
npm run contracts:doctor
```

`npm run demo:smoke` starts an isolated local Next.js dev server, seeds a temporary Postgres schema, and verifies marketplace, paid checkout, free claim, duplicate pass guard, gated resources, organizer check-in, collaborator withdraw, pass detail, and dashboard proof surfaces.

`npm run demo:live-policy` starts an isolated local Next.js dev server with fake
valid contract IDs, verifies non-signing live action preparation, confirms the
preflight route fails invalid requests before RPC, and confirms mutation routes
fail safe without creating local proof records.

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

Current read-only deployment evidence is recorded in
`docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`. After approved hosted app signing,
record public hosted URLs and real app flow transaction hashes in
`docs/LIVE_TESTNET_EVIDENCE.json`, then run `npm run live:evidence:audit`.
Use `docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md` for the manual browser wallet
signing sequence.

## Planning Docs

- `TECHNICAL_SPEC.md`
- `DEVELOPMENT_PLAN.md`
- `docs/QUORUM_PM_GOAL_BRIEF.md`
- `docs/HACKATHON_DEMO_RUNBOOK.md`
- `docs/DEMO_EVIDENCE.md`
- `docs/MVP_READINESS.md`
- `docs/PRODUCTION_ENV_HANDOFF.md`
- `docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md`
- `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`
- `docs/LIVE_SIGNING_HANDOFF.md`
