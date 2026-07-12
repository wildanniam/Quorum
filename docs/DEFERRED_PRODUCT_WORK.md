# Deferred Quorum Product Work

Last audited: 2026-07-12.

This note preserves verified product work that is intentionally deferred while
the team focuses on the product UI and UX refactor.

## Current Verified State

- PR `#28` is merged into `main` and all recorded GitHub/Vercel checks passed.
- The production Vercel deployment is ready and was created immediately after
  the PR `#28` merge.
- The hosted contract status reports Stellar Testnet, live proof mode, reachable
  RPC, deployed core/pass contracts, and a configured USDC contract.
- Core live flows have existing evidence for event publish, paid checkout, free
  claim, check-in, and collaborator withdrawal.
- MoneyGram SEP-10 authentication and SEP-24 sandbox withdrawal initiation have
  succeeded for the Quorum client domain.

## Deferred Required Work

1. Apply `db/migrations/0005_anchor_cashout_proof.sql` to the hosted Supabase
   database. The audit found migrations `0001` through `0004` applied, but not
   `0005`.
2. Run the manual MoneyGram end-to-end flow with a real Freighter testnet
   session: hosted identity/pickup details, exact testnet USDC transfer, status
   refresh, pickup reference, and final evidence capture.
3. Decide whether the final classic Stellar USDC transfer remains an explicit
   wallet step or is constructed and submitted from Quorum. The current product
   validates and displays the transfer instructions but does not submit that
   transfer in-app.
4. Refresh final evidence so public proof points to the Vercel production host,
   not the older temporary ngrok host.
5. Reconcile stale readiness language in `README.md`, `TODO.md`, and evidence
   documentation with the current deployed state.

## Safety Boundary

Applying the hosted migration and running the final wallet/MoneyGram flow are
high-risk operations. They require a dedicated issue/branch, explicit approval,
focused smoke checks, and no automatic merge.
