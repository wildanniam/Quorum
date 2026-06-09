# Quorum Handoff TODO

Last updated: 2026-06-09
Current repo checkpoint: `8e1616e`

This file is the handoff for finishing Quorum until it satisfies the full live
Stellar testnet goal. Read this first, then use the linked docs for detailed
runbooks.

## Goal

Quorum must become a working live Stellar testnet event checkout product:

- organizer creates and publishes a paid event;
- public users can discover the event;
- attendee buys a paid pass with testnet USDC;
- attendee can also claim a free pass for a free event;
- one wallet receives one non-transferable pass per event;
- resources unlock only for the pass owner;
- organizer checks in a real pass;
- collaborator withdraws a real split balance;
- all live app-flow transaction hashes are recorded and audited.

The target final state is **not** just local proof mode. The target is a public
hosted app that performs real Freighter-signed Stellar testnet transactions and
has evidence for those transactions.

## Current State Summary

Quorum is currently:

- local-demo ready;
- FE v2 redesigned and screenshot-QA accepted;
- contract-test covered;
- live testnet contract deployed;
- browser live-signing flow wired and tested with mocked signer/RPC boundaries;
- not yet hosted with production-grade persistence;
- not yet proven with real Freighter-signed app-flow transactions.

Use this wording when reporting status:

> Quorum is local-demo ready, live-contract deployed, and app-live-signing ready.
> It is not complete live app transaction evidence yet.

## Already Done

### Product And Frontend

- Landing page exists at `/`.
- Discover marketplace exists at `/discover`.
- Event detail exists at `/events/[slug]`.
- Checkout exists at `/events/[slug]/checkout`.
- Attendee resources exist at `/events/[slug]/resources`.
- Studio dashboard exists at `/dashboard`.
- Create event flow exists at `/dashboard/events/new`.
- Pass list exists at `/passes`.
- Final FE v2 QA report: `docs/FE_V2_QA_REPORT.md`.
- Final FE v2 screenshot QA covered desktop and mobile for:
  - `/`
  - `/discover`
  - `/events/apac-stellar-builder-meetup`
  - `/events/apac-stellar-builder-meetup/checkout`
  - `/events/apac-stellar-builder-meetup/resources`
  - `/dashboard`
  - `/dashboard/events/new`
  - `/passes`

### Local App Behavior

Local proof mode is verified for:

- event marketplace;
- draft validation;
- publish lifecycle;
- paid checkout proof;
- free claim proof;
- duplicate checkout/claim guards;
- resource gating;
- organizer check-in proof;
- duplicate check-in guard;
- collaborator withdrawal proof;
- duplicate withdrawal guard;
- pass page;
- dashboard proof/readiness surfaces.

Important smoke commands already exist:

```bash
npm run db:migrate
npm run db:seed
npm run db:smoke
npm run demo:smoke
npm run wallet:auth:smoke
npm run api:origin:smoke
npm run browser:qa
```

### Live Contract Deployment

The live testnet deployment is already recorded and read-only validated in
`docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`.

Network:

```text
TESTNET
```

RPC:

```text
https://soroban-testnet.stellar.org
```

Admin public address:

```text
GCVU24AUYIXAJNIRWCAXX5OKF6AZY23R6IYGPMRGFN5XDDFMW6I7XKUW
```

Contracts:

```text
QuorumPassNFT:
CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH

QuorumCore:
CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV

USDC testnet contract:
CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
```

WASM hashes:

```text
Pass WASM:
e78624a8bf8dbb1babdf808ff38bc29053fe8a91c3761ee64c519983797202ec

Core WASM:
73ad1844be4fbcf16c76206b18461b020c68c6e230e4fb8b37d50e2dcddb2ac0
```

Deployment and initialization transaction hashes:

```text
passWasmUploadTxHash:
b1506f1fc396f2040a6f6e6cbcf0d025344a692b973921f4f3a24eb0ea46011f

passDeployTxHash:
ba7133cef219e08aae0d27657aca94df8e5cb495d7de304690f567f375eb8002

coreWasmUploadTxHash:
552e3056c087269fab121583a0c5ada5629c119308fc9ead1fe64af37da17efb

coreDeployTxHash:
579021fd3e1ee60e24e9c8117e98cc27c4bf065b56dce5f50ff17b1a8ddad2a8

passInitTxHash:
4fb637aa6841134dc1de8332f460710b5831076354dd44291b283028bb3a4ed0

coreInitTxHash:
b0c66ce6c6479c14740559f02bd594733c7aa1d30a471389dcdb4695e495b582

passSetCoreTxHash:
77896a93eb556e356eac4df87cbd8b38ad8e4772cc83ef42077614b39a7d4f0b
```

Run this to revalidate deployment evidence without signing anything:

```bash
npm run live:deployment:validate
```

Expected result: `ok: true`.

### Live Transaction Wiring

The app already has a live browser flow:

- server prepares action from DB/session state;
- server preflights with Stellar RPC;
- browser asks Freighter to sign;
- browser submits signed XDR back to the app;
- server validates signed XDR;
- server submits to RPC and polls finality;
- server persists verified live results.

Important files:

- `src/lib/stellar/action-policy.ts`
- `src/lib/stellar/contracts.ts`
- `src/lib/stellar/live-action.ts`
- `src/lib/stellar/live-preflight.ts`
- `src/lib/stellar/freighter-live-signing.ts`
- `src/lib/stellar/live-submission.ts`
- `src/lib/stellar/live-browser-flow.ts`
- `src/lib/stellar/live-result-persistence.ts`
- `src/app/api/events/[eventId]/contract-action/preflight/route.ts`
- `src/app/api/events/[eventId]/contract-action/route.ts`

Live wiring smoke commands:

```bash
npm run live:readiness:smoke
npm run live:args:smoke
npm run live:xdr:smoke
npm run live:preflight:smoke
npm run live:signing:smoke
npm run live:submission:smoke
npm run live:flow:smoke
npm run live:persistence:smoke
npm run live:browser-flow:smoke
npm run live:ui-wiring:smoke
npm run demo:live-policy
```

These are mostly non-signing/mock-boundary tests. Passing them does not mean a
real user has completed live Freighter transactions.

## Remaining Work Overview

The remaining work is in six major phases:

1. Refresh local evidence after the latest FE commits.
2. Decide and implement/confirm hosted persistence.
3. Deploy the app to a public HTTPS host with correct env vars.
4. Prepare Freighter testnet wallets and paid testnet USDC.
5. Run the real manual live signing sequence and record evidence.
6. Run final verification and prepare the submission packet.

Each phase below has acceptance criteria. Do not continue to the next phase if
the acceptance criteria fail.

## Phase 1: Refresh Local Evidence

Why this matters:

`npm run readiness:audit` currently fails because `docs/DEMO_EVIDENCE.md`
references an older source commit. This is stale evidence, not necessarily a
runtime bug.

Tasks:

- Run the full local evidence collection.
- Re-run readiness audit.
- Commit refreshed evidence if the generated file changes.

Commands:

```bash
npm run evidence:local
npm run readiness:audit
git status --short
```

Acceptance criteria:

- `npm run evidence:local` exits `0`.
- `npm run readiness:audit` exits `0`.
- `docs/DEMO_EVIDENCE.md` references the current commit.
- Any evidence update is committed.

Stop if:

- `readiness:audit` fails for anything other than expected live signing gates;
- generated evidence shows failed lint/build/smoke checks;
- local DB migration or seed fails.

## Phase 2: Choose Hosted Storage Strategy

Current constraint:

The app uses `better-sqlite3` with a `file:` database URL. This is fine for
local demos or a single host with persistent disk, but it is not durable on
typical serverless hosting with ephemeral filesystem.

Choose one strategy:

### Option A: Single Host With Persistent Disk

Use this if speed matters most and the hosting environment can keep a persistent
SQLite file.

Requirements:

- one app instance;
- persistent disk path for `DATABASE_URL`;
- writable filesystem for migrations and live proof records;
- deployment process runs `npm run db:migrate`.

Acceptance criteria:

- hosted app can create event records;
- hosted app can persist session-related app records long enough for the live
  evidence demo;
- app data survives a normal restart.

### Option B: Migrate DB Adapter To Supabase Postgres

Use this if the app must run on serverless or scale beyond a single instance.
This is the planned handoff path if Quorum will use Supabase.

Important:

This is **not** only an env change. The current code rejects non-`file:`
database URLs in `src/lib/db/client.ts`, and the current migration runner uses
`better-sqlite3`. Supabase requires a real DB adapter migration.

Supabase setup tasks:

1. Create a Supabase project.
2. Save the database password in a password manager.
3. Get the Postgres connection string from Supabase project settings.
4. Decide which connection string is used by the app runtime:
   - pooled connection string for serverless-style hosting;
   - direct connection string for a single long-running host or migration
     runner if needed.
5. Keep all DB credentials server-only. Do not expose the database password,
   service-role key, or Postgres URL to the browser.
6. Do not add `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   unless the frontend is intentionally changed to use Supabase client APIs.
   The current app only needs server-side database access.

Recommended env shape after Supabase migration:

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require"
DIRECT_DATABASE_URL="postgresql://<user>:<password>@<direct-host>:<port>/<database>?sslmode=require"
```

`DIRECT_DATABASE_URL` is optional but useful if the runtime uses pooled
connections and migrations need a direct connection. If the migration runner can
use the same pooled connection safely, keep only `DATABASE_URL`.

Code migration tasks:

- replace `better-sqlite3` assumptions in `src/lib/db/client.ts`;
- replace sync DB calls with an async Postgres client, for example `pg` or
  another Postgres driver;
- update `src/lib/events/repository.ts` from sync functions to async functions;
- update all call sites that read/write events, passes, check-ins, purchases,
  withdrawals, and users to `await` repository calls;
- update API routes and server components that currently assume synchronous DB
  reads;
- update smoke scripts that import DB/repository helpers;
- update migration scripts to run against Postgres;
- update DB smoke tests to verify Postgres indexes/constraints instead of
  SQLite PRAGMA checks;
- update `DATABASE_URL` docs.

Migration SQL conversion notes:

- `datetime('now')` becomes `now()`.
- `TEXT` timestamps should become `timestamptz` where practical.
- SQLite `INTEGER` booleans can become Postgres `boolean`.
- `julianday(end_date_time) > julianday(start_date_time)` becomes direct
  timestamp comparison, for example `end_date_time > start_date_time`.
- SQLite triggers need a Postgres `plpgsql` trigger function.
- Query placeholders change from `?` to `$1`, `$2`, etc.
- `INSERT OR IGNORE` patterns should become `ON CONFLICT DO NOTHING`.
- Preserve all uniqueness constraints for:
  - `events.core_event_id`;
  - `events.publish_tx_hash`;
  - `passes.mint_tx_hash`;
  - `purchases.tx_hash`;
  - `check_ins.tx_hash`;
  - `withdrawals.tx_hash`;
  - `passes(event_id, owner_wallet)`.

Security notes:

- Use Supabase as Postgres, not as browser-side table API, unless a separate
  Supabase API/RLS design is intentionally added.
- If tables are exposed through Supabase APIs, configure RLS policies before
  exposing anon keys. The current app auth is wallet-cookie based and lives in
  Next.js routes, so the safest path is server-only DB access.
- Never commit Supabase passwords or service-role keys.

Acceptance criteria:

- all existing DB smoke and demo smoke commands pass;
- live result persistence still rejects duplicate/replayed transaction hashes;
- hosted app can persist events, passes, purchases, check-ins, and withdrawals;
- live publish, checkout, check-in, and withdraw flows still persist confirmed
  transaction hashes exactly once;
- production env docs are updated.

Stop if:

- any local proof path silently writes local records while live contracts are
  configured;
- Postgres migration drops a uniqueness guard for live transaction evidence;
- browser code needs Supabase service credentials;
- Supabase table access works without the intended server-side auth boundary.

### Option C: UI-Only Hosted Demo

Use this only if live transaction evidence is postponed.

This option does not satisfy the full live testnet goal because the app must
record live proof. Only use it for visual demo.

Recommended path:

- Option A if this is a near-term hackathon handoff.
- Option B if this needs production credibility.

Acceptance criteria for this phase:

- storage choice is documented in this TODO or a new handoff note;
- `DATABASE_URL` plan is clear;
- the deploy target is known.

## Phase 3: Configure Hosted Environment

Required hosted runtime env vars:

```bash
DATABASE_URL="<file: persistent path before Supabase, or postgresql://... after Supabase migration>"
QUORUM_SESSION_SECRET="<32+ random chars>"
NEXT_PUBLIC_STELLAR_NETWORK="TESTNET"
NEXT_PUBLIC_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID="CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH"
NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID="CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV"
NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"
```

If Supabase migration is complete, hosted env should use:

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require"
DIRECT_DATABASE_URL="postgresql://<user>:<password>@<direct-host>:<port>/<database>?sslmode=require"
```

Only add Supabase public env vars if the frontend intentionally uses Supabase
client APIs:

```bash
NEXT_PUBLIC_SUPABASE_URL="<only if frontend Supabase client is introduced>"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<only if frontend Supabase client is introduced and RLS is configured>"
```

Generate session secret:

```bash
openssl rand -base64 48
```

Do not put these operator-only variables in the normal hosted runtime unless a
separate server-side signing design is explicitly approved:

```bash
STELLAR_NETWORK
STELLAR_ACCOUNT
QUORUM_LIVE_SIGNING_APPROVED
ADMIN_ADDRESS
QUORUM_PLATFORM_FEE_BPS
QUORUM_NONZERO_PLATFORM_FEE_APPROVED
```

Why:

- hosted app flow is intended to use browser Freighter signing;
- server-side funded secrets should not sit in routine hosted runtime;
- accidental signing must stay impossible without explicit approval.

Acceptance criteria:

- hosted app has a public HTTPS URL;
- `QUORUM_SESSION_SECRET` is not placeholder/local/short;
- public Stellar env vars match the testnet deployment evidence;
- `/api/contracts/status` on the hosted app reports live proof mode;
- publish, checkout, check-in, and withdraw action policies report live actions.

Verification:

```bash
npm run deploy:env:smoke
npm run deploy:hosted:preflight -- --url https://<hosted-app> --env-file <pulled-env-file>
npm run live:readiness:smoke
npm run live:deployment:validate
npm run lint
npm run build
```

Stop if:

- hosted URL is not HTTPS;
- hosted URL is localhost/private network;
- `/api/contracts/status` reports local proof mode;
- hosted preflight says env does not match deployment evidence;
- hosted runtime includes operator signing secrets by accident.

## Phase 4: Prepare Wallets And Testnet USDC

Prepare separate Freighter testnet accounts when possible:

| Role | Needed for | Requirement |
|---|---|---|
| Organizer | wallet login, paid event publish, check-in | Freighter testnet account |
| Paid attendee | paid checkout | Freighter testnet account with valid testnet USDC |
| Free attendee | free claim | Freighter testnet account |
| Collaborator | withdrawal | Freighter testnet account matching a split recipient |
| Admin | already used for deploy/init | not required for browser app flow |

Rules:

- Use Freighter testnet mode.
- Record public wallet addresses only.
- Never record secret key, recovery phrase, private key, seed phrase, or
  unredacted extension backup.
- The paid attendee must be able to hold and spend the configured testnet USDC.
- If USDC funding/trustline is missing, stop paid checkout and fix funding
  before continuing.

Acceptance criteria:

- each role wallet is known by public address;
- paid attendee has testnet USDC balance/trustline;
- collaborator wallet exactly matches one event split recipient;
- Freighter is on testnet for every browser signing action.

Stop if:

- wallet connects to mainnet;
- app session wallet differs from Freighter wallet;
- paid attendee cannot spend testnet USDC;
- collaborator wallet is not in event split.

## Phase 5: Run Real Hosted Freighter Signing

Use `docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md` as the primary runbook.

Before opening Freighter:

```bash
npm run deploy:env:smoke
npm run live:readiness:smoke
npm run live:deployment:validate
npm run live:evidence:audit:smoke
npm run lint
npm run build
```

Create the live evidence file only when a real signing session starts:

```bash
cp docs/LIVE_TESTNET_EVIDENCE.example.json docs/LIVE_TESTNET_EVIDENCE.json
```

### 5.1 Wallet Session

Expected:

- app asks Freighter to connect;
- connected address matches the role wallet;
- app session shows the same public address.

Evidence:

- public wallet role/address;
- screenshot/note of connected state.

### 5.2 Publish Paid Event

Page:

- hosted create event flow;
- then publish.

Signer:

- organizer wallet.

Contract method:

- `QuorumCore.create_event`.

Expected:

- source wallet is organizer;
- contract is `CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV`;
- currency is `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA`;
- pass contract is `CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH`;
- split total is `10000` bps;
- Freighter shows Stellar testnet.

Evidence:

- `liveFlows.publishPaidEvent.txHash`;
- `liveFlows.publishPaidEvent.eventUrl`;
- event title/slug.

### 5.3 Paid Checkout

Page:

- hosted paid event checkout.

Signer:

- paid attendee wallet.

Contract method:

- `QuorumCore.purchase`.

Expected:

- source wallet is paid attendee;
- amount matches exact event price in USDC base units;
- app shows minted token ID after finality;
- transaction hash is real, not `stub:` and not local proof.

Evidence:

- `liveFlows.paidCheckout.txHash`;
- `liveFlows.paidCheckout.tokenId`;
- `liveFlows.paidCheckout.paymentAsset`;
- pass detail URL/screenshot.

### 5.4 Free Claim

Page:

- hosted free event detail or checkout.

Signer:

- free attendee wallet.

Contract method:

- `QuorumCore.purchase`.

Expected:

- amount is `0`;
- no payment asset movement;
- token ID is minted;
- duplicate claim by same wallet is rejected.

Evidence:

- `liveFlows.freeClaim.txHash`;
- `liveFlows.freeClaim.tokenId`;
- free pass detail URL/screenshot.

### 5.5 Resource Unlock

Page:

- hosted paid event resources page.

Signer:

- none for unlock check; use paid attendee session.

Expected:

- without paid attendee session, resources are locked;
- with paid attendee session, resources unlock;
- URL belongs to hosted app origin.

Evidence:

- `browserProof.paidResourceUnlockedUrl`;
- screenshot/note showing paid attendee session.

### 5.6 Organizer Check-In

Page:

- hosted check-in page for the paid event.

Signer:

- organizer wallet.

Contract method:

- `QuorumCore.check_in`.

Expected:

- source wallet is organizer;
- token ID matches paid checkout token ID;
- app records real transaction hash;
- non-organizer cannot check in.

Evidence:

- `liveFlows.checkIn.txHash`;
- `liveFlows.checkIn.tokenId`;
- pass detail screenshot showing checked-in status.

### 5.7 Collaborator Withdraw

Page:

- hosted Studio/dashboard withdrawal action.

Signer:

- collaborator wallet matching one split recipient.

Contract method:

- `QuorumCore.withdraw`.

Expected:

- source wallet is collaborator;
- withdrawal amount is greater than `0`;
- amount does not exceed DB withdrawable balance;
- app records real transaction hash.

Evidence:

- `liveFlows.collaboratorWithdraw.txHash`;
- `liveFlows.collaboratorWithdraw.withdrawAmountUsdc`;
- dashboard screenshot/note showing balance moved to withdrawn proof.

Acceptance criteria for Phase 5:

- all required app-flow transaction hashes are recorded;
- paid checkout token ID equals check-in token ID;
- resource unlock URL is hosted HTTPS;
- no recorded transaction hash is local/stub;
- `docs/LIVE_TESTNET_EVIDENCE.json` contains public evidence only;
- `npm run live:evidence:audit` passes.

Stop if:

- Freighter shows mainnet;
- signer wallet is wrong;
- contract ID is wrong;
- amount is wrong;
- app records `stub:` or `local_proof`;
- transaction succeeds on-chain but app fails to persist the proof;
- any live evidence audit fails.

## Phase 6: Final Verification And Submission Packet

Run:

```bash
npm run db:migrate
npm run db:smoke
npm run lint
npm run build
npm run demo:smoke
npm run browser:qa
npm run live:deployment:validate
npm run live:readiness:smoke
npm run live:evidence:audit
npm run readiness:audit
```

If contracts or Rust code changed, also run:

```bash
npm run contracts:test
npm run contracts:build
npm run contracts:doctor
npm run contracts:approval:smoke
```

Final acceptance criteria:

- hosted app is public HTTPS;
- hosted `/api/contracts/status` reports live mode;
- real publish tx hash exists;
- real paid checkout tx hash exists;
- real free claim tx hash exists;
- real check-in tx hash exists;
- real collaborator withdraw tx hash exists;
- paid token ID matches check-in token ID;
- resource unlock is proven for pass owner;
- `npm run live:evidence:audit` passes;
- `npm run readiness:audit` passes;
- final docs/evidence changes are committed.

## Important Existing Docs

Read in this order:

1. `TODO.md`
2. `docs/MVP_READINESS.md`
3. `docs/PRODUCTION_ENV_HANDOFF.md`
4. `docs/MANUAL_FREIGHTER_SIGNING_RUNBOOK.md`
5. `docs/LIVE_SIGNING_HANDOFF.md`
6. `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`
7. `docs/LIVE_TESTNET_EVIDENCE.example.json`
8. `docs/FE_V2_QA_REPORT.md`
9. `docs/DEMO_EVIDENCE.md`

## Known Gaps And Risks

### Stale Local Evidence

`docs/DEMO_EVIDENCE.md` may be stale relative to the latest FE commit. Refresh
with:

```bash
npm run evidence:local
npm run readiness:audit
```

### Hosted Storage

The biggest technical product gap is not Stellar; it is hosted persistence.
Without reliable storage, the app may sign real transactions but lose the local
records that connect event/pass/check-in/withdrawal state in the UI.

### Paid Testnet USDC

Paid checkout cannot be claimed as complete until a paid attendee wallet can
actually spend the configured testnet USDC.

### Manual Signing Time

The final live proof requires human Freighter prompts. This cannot be completed
fully autonomously unless the operator is available to approve prompts.

### Evidence Discipline

Do not invent or manually guess transaction hashes. Only record hashes returned
by the app after RPC finality or validated from the relevant chain explorer/RPC
source.

## Suggested Work Order For The Next Developer

1. Pull latest repo and confirm clean state.
2. Run `npm install` if dependencies are missing.
3. Run `npm run lint` and `npm run build`.
4. Run `npm run evidence:local`.
5. Run `npm run readiness:audit`.
6. Create the Supabase project and collect the server-only Postgres connection
   string.
7. Migrate the DB adapter from SQLite to Supabase Postgres.
8. Convert migrations and DB smoke tests to Postgres.
9. Run the full local smoke suite against Supabase.
10. Deploy hosted app.
11. Configure hosted env vars exactly.
12. Run hosted preflight.
13. Prepare Freighter testnet wallets.
14. Fund/confirm paid attendee testnet USDC.
15. Run manual Freighter signing sequence.
16. Fill `docs/LIVE_TESTNET_EVIDENCE.json`.
17. Run `npm run live:evidence:audit`.
18. Run final verification commands.
19. Commit all evidence/docs/code changes.

## Commit Guidance

Commit after each meaningful phase:

- evidence refresh;
- storage/deployment changes;
- hosted env docs;
- live evidence packet;
- final verification update.

Use concise commit messages such as:

```text
docs: refresh local readiness evidence
chore: configure hosted persistence
docs: record live testnet app evidence
```

## Final Definition Of Done

The project is done only when this statement is true:

> Quorum is deployed on a public HTTPS host, configured for the recorded Stellar
> testnet contracts, and has audited evidence that real Freighter-signed
> publish, paid checkout, free claim, check-in, and collaborator withdrawal
> transactions completed on Stellar testnet.

Until then, keep the status precise:

> Quorum is local-demo ready, live-contract deployed, and app-live-signing ready,
> but full live app transaction evidence is still pending.
