# Manual Freighter Signing Runbook

Last updated: 2026-06-09.

This runbook is the human-operated path for the first hosted live Stellar
testnet transaction run. It explains exactly what the operator signs in
Freighter, what evidence must be recorded, and when to stop. It does not grant
approval by itself and it does not require server-side wallet secrets in the
hosted runtime.

## Approval Boundary

Only start this runbook after the product owner explicitly approves a live
testnet signing session for the current run.

The browser wallet signs the app flow transactions. The hosted runtime should
not contain `STELLAR_ACCOUNT`, a secret seed, or
`QUORUM_LIVE_SIGNING_APPROVED` unless a separate server-side signing design has
also been approved. The current intended live app path is:

1. The app prepares a Soroban transaction from server-validated state.
2. The operator checks the app summary and Freighter prompt.
3. Freighter signs the prepared transaction.
4. The app submits the signed XDR and records the confirmed testnet result.

Stop immediately if the network, signer, action, amount, token ID, or contract
ID shown by the app/Freighter differs from this runbook.

## Before Opening Freighter

Run these non-signing checks locally from the repository:

```bash
npm run deploy:env:smoke
npm run live:readiness:smoke
npm run live:deployment:validate
npm run live:evidence:audit:smoke
```

Optional but recommended before a public hosted demo:

```bash
npm run lint
npm run build
npm run browser:qa
```

Confirm the hosted environment follows `docs/PRODUCTION_ENV_HANDOFF.md`.
Minimum hosted runtime expectations:

| Area | Expected value |
|---|---|
| App URL | Public HTTPS URL, not localhost or private network |
| Network | `TESTNET` |
| RPC | `https://soroban-testnet.stellar.org` |
| Pass contract | `CAQ44PH2OXYIAJVRYUB57VRL7MG3UUBKVHKN3LIUSNOLLIKGYKCJ7HIH` |
| Core contract | `CBZ7FTHKJ4BEGETYWNUN4RFMSJJ47Y6YJQGXIRVU4WXCFNP33V63IFBV` |
| USDC contract | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |
| Contract status | `/api/contracts/status` reports `proofMode: "live"` |
| Action policy | Publish, checkout, check-in, and withdraw report live actions |
| Storage | Persistent enough for the demo evidence you want to keep |

## Wallet Setup

Prepare separate Freighter testnet accounts when possible:

| Role | Wallet requirement |
|---|---|
| Organizer | Signs wallet session, event publish, and check-in |
| Paid attendee | Signs paid checkout and has testnet USDC balance |
| Free attendee | Signs free claim; no USDC transfer expected |
| Collaborator | Must match one split recipient and signs withdraw |
| Admin | Already used for deployment/init; not needed in browser flow |

Use Freighter testnet mode for every browser action. Record public wallet
addresses only. Never record a secret key, recovery phrase, private key, or
unredacted browser extension backup.

For the paid attendee, confirm the wallet can hold and spend the configured
testnet USDC asset before checkout. If the wallet has no valid testnet USDC
balance or trustline, stop the paid checkout run and fix funding outside this
runbook. Do not fall back to local proof for live evidence.

## Evidence File

Create the live evidence packet only after a real approved signing session:

```bash
cp docs/LIVE_TESTNET_EVIDENCE.example.json docs/LIVE_TESTNET_EVIDENCE.json
```

Fill `docs/LIVE_TESTNET_EVIDENCE.json` with public data only:

- hosted app URL;
- public wallet addresses;
- contract IDs and WASM hashes;
- deployment/init transaction hashes from
  `docs/LIVE_TESTNET_DEPLOYMENT_EVIDENCE.json`;
- app-flow transaction hashes from the Freighter-signed run;
- token IDs, resource URL, contract status URL, and verification results.

After the file is filled, run:

```bash
npm run live:evidence:audit
```

The audit intentionally rejects localhost URLs, private network URLs, non-HTTPS
URLs, reused transaction hashes, duplicate contract IDs, mismatched check-in
token evidence, proof URLs outside the hosted app origin, and zero-value
withdrawal evidence.

## Manual Signing Sequence

### 1. Wallet Session

Page: hosted app home page or any protected action page.

Signer: the role wallet you are about to use.

Contract method: none. This is wallet authentication, not a Soroban
transaction.

Expected behavior:

- The app asks Freighter for a wallet connection.
- The connected address matches the role being tested.
- The app session shows the same public address after authentication.

Evidence to record:

- wallet role and public address in `wallets`;
- screenshot or note showing the connected wallet state.

Stop if:

- Freighter is not on testnet;
- the browser connects the wrong account;
- the app session shows a different address than Freighter.

### 2. Publish Paid Event

Page: create/edit event flow, then publish the paid event.

Signer: organizer wallet.

Contract method: `QuorumCore.create_event`.

Expected app summary before Freighter opens:

| Field | Expected value |
|---|---|
| Source wallet | Organizer address |
| Contract | Core contract ID |
| Action | `create_event` |
| Event ID | New paid event proof ID |
| Price | Exact paid event price in USDC |
| Currency | Configured USDC contract ID |
| Pass contract | Configured pass contract ID |
| Split total | `10000` bps |

Expected Freighter prompt:

- network is Stellar testnet;
- source account is the organizer;
- transaction invokes the configured core contract;
- no unexpected extra operation is shown.

Evidence to record:

- `liveFlows.publishPaidEvent.txHash`;
- `liveFlows.publishPaidEvent.eventUrl`;
- event title/slug used in the demo notes.

Stop if:

- the price, split, core contract, pass contract, or organizer wallet is wrong;
- Freighter shows mainnet or an unknown network;
- the app succeeds without a real transaction hash.

### 3. Paid Checkout

Page: hosted paid event checkout.

Signer: paid attendee wallet.

Contract method: `QuorumCore.purchase`.

Expected app summary before Freighter opens:

| Field | Expected value |
|---|---|
| Source wallet | Paid attendee address |
| Contract | Core contract ID |
| Action | `purchase` |
| Event ID | The paid event proof ID |
| Amount | Exact paid price in USDC base units |
| Metadata URI | Pass metadata URI for the attendee |

Expected Freighter prompt:

- source account is the paid attendee;
- transaction invokes the configured core contract;
- USDC spend amount matches the event price;
- no extra payment destination outside the core contract path is shown.

Evidence to record:

- `liveFlows.paidCheckout.txHash`;
- `liveFlows.paidCheckout.tokenId`;
- `liveFlows.paidCheckout.paymentAsset` as `USDC`;
- pass detail URL or screenshot showing the token ID.

Stop if:

- Freighter shows a different amount than the event price;
- the paid attendee has no valid testnet USDC balance;
- the transaction succeeds but the app does not show a minted token ID.

### 4. Free Claim

Page: hosted free event detail or checkout.

Signer: free attendee wallet.

Contract method: `QuorumCore.purchase`.

Expected app summary before Freighter opens:

| Field | Expected value |
|---|---|
| Source wallet | Free attendee address |
| Contract | Core contract ID |
| Action | `purchase` |
| Amount | `0` |
| Payment asset movement | None |

Evidence to record:

- `liveFlows.freeClaim.txHash`;
- `liveFlows.freeClaim.tokenId`;
- free pass detail URL or screenshot.

Stop if:

- Freighter shows a non-zero payment amount;
- the app allows the same wallet to claim the same free event twice;
- the app records a local proof hash instead of a live transaction hash.

### 5. Resource Unlock

Page: hosted paid event resources page.

Signer: none for the unlock check. Use the paid attendee session.

Contract method: none. This proves the app recognized the paid pass.

Expected behavior:

- without the paid attendee session, resources are locked;
- with the paid attendee session, resources are unlocked;
- the unlocked URL uses the same hosted app origin.

Evidence to record:

- `browserProof.paidResourceUnlockedUrl`;
- screenshot or note showing the paid attendee session.

Stop if:

- the resource unlock works for a wallet without the pass;
- the proof URL is localhost, private network, or a different origin.

### 6. Organizer Check-In

Page: hosted check-in page for the paid event.

Signer: organizer wallet.

Contract method: `QuorumCore.check_in`.

Expected app summary before Freighter opens:

| Field | Expected value |
|---|---|
| Source wallet | Organizer address |
| Contract | Core contract ID |
| Action | `check_in` |
| Event ID | Paid event proof ID |
| Token ID | The paid attendee pass token ID |

Expected Freighter prompt:

- source account is the organizer;
- transaction invokes the configured core contract;
- token ID matches the paid checkout evidence.

Evidence to record:

- `liveFlows.checkIn.txHash`;
- `liveFlows.checkIn.tokenId`, matching the paid checkout token ID;
- pass detail screenshot showing checked-in status.

Stop if:

- the token ID differs from the paid checkout token;
- a non-organizer wallet can check in the pass;
- the app marks check-in complete without a live transaction hash.

### 7. Collaborator Withdraw

Page: hosted dashboard withdrawal action.

Signer: collaborator wallet that exactly matches a split recipient.

Contract method: `QuorumCore.withdraw`.

Expected app summary before Freighter opens:

| Field | Expected value |
|---|---|
| Source wallet | Collaborator address |
| Contract | Core contract ID |
| Action | `withdraw` |
| Event ID | Paid event proof ID |
| Amount | Current collaborator withdrawable USDC balance |

Expected Freighter prompt:

- source account is the collaborator;
- transaction invokes the configured core contract;
- withdrawal is for the expected event;
- no admin or organizer wallet is used.

Evidence to record:

- `liveFlows.collaboratorWithdraw.txHash`;
- `liveFlows.collaboratorWithdraw.withdrawAmountUsdc`;
- dashboard screenshot or note showing the balance moved to withdrawn proof.

Stop if:

- the connected wallet is not a split recipient;
- the withdraw amount is zero;
- the app records more than the collaborator's withdrawable balance;
- Freighter shows a different source account.

## Failure Recovery

| Symptom | Action |
|---|---|
| User rejects Freighter prompt | Do not record evidence. Re-open the action only after confirming the summary still matches. |
| Wallet mismatch | Disconnect, select the correct Freighter account, re-authenticate, and restart that action. |
| Wrong network | Switch Freighter back to testnet and reload the hosted app. |
| Insufficient USDC | Stop paid checkout and fund the paid attendee externally before retrying. |
| RPC timeout or pending result | Wait for finality in the app. Do not manually invent a hash. Retry only if the app treats the pending state as retry-safe. |
| Duplicate transaction | Use the app's finality status. A duplicate submit is not evidence unless the same hash reaches success. |
| App records `stub:` or `local_proof` | Stop the live run. The hosted app is not in live proof mode. |

## Completion Criteria

The signing session is complete only when:

- the hosted app has a public HTTPS URL;
- `/api/contracts/status` reports live proof mode and live action policies;
- publish, paid checkout, free claim, check-in, and collaborator withdraw each
  have real transaction hashes where expected;
- the paid checkout token ID matches the check-in token ID;
- the paid resource unlock URL belongs to the hosted app origin;
- `docs/LIVE_TESTNET_EVIDENCE.json` is filled with public evidence;
- `npm run live:evidence:audit` passes.

Until those conditions are true, describe Quorum as local-demo ready,
live-contract deployed, and app-live-signing ready, not complete live app
transaction evidence.
