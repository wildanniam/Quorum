# Live Signing Handoff

This handoff defines the remaining work to move Quorum from verified local proof
mode to live Stellar testnet transactions. It preserves the approval boundary:
do not deploy contracts, configure funded secrets, or ask Freighter to sign live
transactions until the user explicitly approves that step.

## Current State

- `QuorumCore` creates published event records on-chain.
- Paid `purchase` calls transfer the payment token from the buyer into the core
  contract escrow, calculate platform fee and collaborator balances, and mint a
  `QuorumPassNFT` pass.
- Free `purchase` calls mint a pass without moving tokens.
- Collaborator `withdraw` calls transfer escrowed token balance from
  `QuorumCore` to the collaborator.
- Admin `admin_withdraw` can withdraw accumulated platform fee balance.
- `QuorumPassNFT` mints one unique non-transferable token per owner/event pair
  and lets `QuorumCore` mark passes checked in.
- The web app intentionally uses local proof records until contract IDs and the
  payment asset ID are valid. When live IDs are configured, mutation routes fail
  safe with `501` instead of silently creating local proof records.

## Approval Gates

These actions require explicit user approval:

1. Configure `STELLAR_ACCOUNT` or any funded signing identity.
2. Deploy contracts or initialize deployed contracts.
3. Configure hosted environment variables containing real contract IDs.
4. Ask Freighter to sign publish, checkout, check-in, withdraw, or admin
   transactions.
5. Change product scope, fee policy, payment asset, or transferability rules.

## Required Environment

Local deployment/signing:

```bash
STELLAR_NETWORK="testnet"
STELLAR_ACCOUNT="<funded Stellar CLI identity or secret>"
ADMIN_ADDRESS="<admin public key>"
QUORUM_PLATFORM_FEE_BPS="0"
```

App/runtime:

```bash
NEXT_PUBLIC_STELLAR_NETWORK="TESTNET"
NEXT_PUBLIC_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID="<deployed core contract id>"
NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID="<deployed pass contract id>"
NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID="<confirmed testnet USDC token contract id>"
```

`NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID` must be confirmed at live setup time from
the current Stellar testnet asset/token source. Do not use the dummy local
currency address from tests for deployment.

## Contract Deployment Sequence

```bash
npm run contracts:doctor
npm run contracts:deploy:testnet
export NEXT_PUBLIC_QUORUM_PASS_CONTRACT_ID="<printed pass id>"
export NEXT_PUBLIC_QUORUM_CORE_CONTRACT_ID="<printed core id>"
npm run contracts:init:testnet
```

Record the deployment transaction hashes, contract IDs, network, WASM hashes,
and admin address in the final evidence packet.

## App Signing Architecture

The app should replace each `local_proof` mutation with a multi-step live flow:

1. Server prepares an unsigned Soroban transaction from validated DB/session
   state. Use `src/lib/stellar/live-encoding.ts` for deterministic event IDs,
   USDC atomic units, split bps, metadata hashes, and action argument DTOs.
   The current non-signing boundary is
   `GET /api/events/[eventId]/contract-action?action=<action>`, which returns
   the target contract ID, network metadata, contract function name, signer, and
   encoded args without signing or submitting a transaction. If `sourceSequence`
   is supplied, the response also includes a pre-simulation unsigned transaction
   XDR template. The signing path should call
   `POST /api/events/[eventId]/contract-action/preflight` to fetch the signer
   sequence from RPC, run `prepareTransaction`, and return a prepared
   transaction XDR that is ready for Freighter signing.
2. Browser asks Freighter to sign the prepared transaction.
3. Browser posts the signed XDR back to
   `POST /api/events/[eventId]/contract-action`; the server reconstructs the
   action from DB/session state, checks that the signed transaction source
   matches the connected wallet, submits the signed XDR to RPC, and polls
   finality.
4. Server verifies the result, then stores the real transaction hash, token ID,
   and proof metadata in SQLite using the `recordLivePublishedEvent`,
   `recordLivePass`, `recordLiveCheckIn`, and `recordLiveWithdrawal`
   repository functions.

The current action policy is the switch point:

| Action | Current local route | Live contract method |
|---|---|---|
| Publish | `POST /api/events/[eventId]/publish` | `QuorumCore.create_event` |
| Checkout / claim | `POST /api/events/[eventId]/passes` | `QuorumCore.purchase` |
| Check-in | `POST /api/events/[eventId]/check-ins` | `QuorumCore.check_in` |
| Withdraw | `POST /api/events/[eventId]/withdrawals` | `QuorumCore.withdraw` |

Keep the fail-safe behavior until every row above has a real transaction path.
Partial live mode must not mix live IDs with local proof writes for these
actions.

Run `npm run live:args:smoke`, `npm run live:xdr:smoke`,
`npm run live:preflight:smoke`, `npm run live:signing:smoke`,
`npm run live:submission:smoke`, `npm run live:flow:smoke`,
`npm run live:persistence:smoke`, and `npm run demo:live-policy` before wiring
Freighter signing to verify the argument encoding, XDR template, pre-signing RPC
preflight, mock wallet signing adapter, signed transaction submission/finality
polling, finality return value decoding, full mock live action flows,
post-success persistence, and preparation boundaries.
`src/lib/stellar/live-encoding.ts` also provides USDC atomic-to-decimal
conversion for storing contract-returned withdraw amounts in SQLite.

Before asking Freighter to sign, the live implementation must fetch the
signer's current account sequence from testnet, simulate the Soroban transaction
through RPC, assemble the simulated transaction data, and only then request the
wallet signature. `src/lib/stellar/live-preflight.ts` implements that
pre-signing orchestration behind a mockable RPC boundary.
`src/lib/stellar/freighter-live-signing.ts` implements the browser-side
Freighter `signTransaction` boundary and validates signer address, wallet
errors, and returned XDR before submission.
`src/lib/stellar/live-submission.ts` implements the RPC `sendTransaction` and
`getTransaction` finality polling boundary for signed XDR, including Soroban
return value decoding for purchase token IDs and withdraw amounts. The route
submit path rejects invalid signed XDR before persistence and still requires a
real RPC-confirmed finality result before writing live proof data.
`POST /api/events/[eventId]/contract-action/preflight` exposes the non-signing
RPC preflight boundary over HTTP and fails invalid requests before touching RPC.
`src/lib/stellar/live-browser-flow.ts` is the browser-side orchestration helper:
`executeLiveBrowserContractAction` calls the preflight route, asks Freighter to
sign, and posts signed XDR to the submit route. Before signing, the helper
checks that the returned preflight metadata still matches the requested action,
contract, function, network passphrase, and source wallet. The publish,
checkout, check-in, and withdraw UI actions call this helper when the local
mutation route reports `live_required`.
`src/lib/stellar/live-flow.ts` composes prepare, preflight, mockable Freighter
signing, mockable submission, decoded return values, and post-success
persistence inputs so publish, paid checkout, free claim, check-in, and withdraw
chains can be tested without a real wallet signature.
`src/lib/stellar/live-result-persistence.ts` maps verified successful finality
results into `recordLivePublishedEvent`, `recordLivePass`,
`recordLiveCheckIn`, and `recordLiveWithdrawal`, rejecting mismatched
prepared/submitted actions before any DB write.

## Contract Call Inputs

`create_event`:

- `organizer: Address`
- `event_id: BytesN<32>` derived deterministically from the database event ID
- `price: i128` in the payment asset base unit
- `currency: Address` from `NEXT_PUBLIC_STELLAR_USDC_CONTRACT_ID`
- `capacity: u32`
- `is_free: bool`
- `splits: Vec<SplitRecipient>` with `percent_bps` totaling `10000`
- `metadata_hash: BytesN<32>`
- `pass_contract: Address`

`purchase`:

- `buyer: Address`
- `event_id: BytesN<32>`
- `amount: i128`; zero for free claims, exact price for paid purchases
- `metadata_uri: String`
- `metadata_hash: BytesN<32>`

`check_in`:

- `organizer: Address`
- `event_id: BytesN<32>`
- `token_id: u64`

`withdraw`:

- `collaborator: Address`
- `event_id: BytesN<32>`

## Acceptance Evidence For Live Mode

Live mode is not complete until the evidence packet includes:

- deployed app URL;
- pass and core contract IDs;
- confirmed testnet USDC contract ID;
- publish transaction hash for a paid event;
- checkout transaction hash showing token transfer into `QuorumCore` escrow;
- minted pass token ID from `QuorumPassNFT`;
- resource unlock for the buyer wallet;
- check-in transaction hash;
- collaborator withdraw transaction hash showing token transfer out of escrow;
- `GET /api/contracts/status` showing `proofMode: "live"` and all action
  policies live;
- `npm run contracts:doctor`, `npm run contracts:test`, `npm run
  contracts:build`, `npm run lint`, `npm run build`, and a browser smoke pass
  on the deployed URL.
- a filled `docs/LIVE_TESTNET_EVIDENCE.json` based on
  `docs/LIVE_TESTNET_EVIDENCE.example.json` that passes
  `npm run live:evidence:audit`.

Until this evidence exists, Quorum should be described as locally demo-ready and
contract-ready, not fully live-testnet complete.
