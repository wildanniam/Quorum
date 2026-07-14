# Deferred Quorum Product Work

Last audited: 2026-07-15.

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
- Production migration `0005_anchor_cashout_proof.sql` is applied.
- Hosted indexer auth and monotonic cursor progress are recorded in
  `docs/HOSTED_RELEASE_EVIDENCE.json`.

## Deferred Required Work

1. Run the manual MoneyGram end-to-end flow with a real Freighter testnet
   session: hosted identity/pickup details, exact testnet USDC transfer, status
   refresh, pickup reference, and final evidence capture.
2. Decide whether the final classic Stellar USDC transfer remains an explicit
   wallet step or is constructed and submitted from Quorum. The current product
   validates and displays the transfer instructions but does not submit that
   transfer in-app.
3. Refresh final evidence so public proof points to the Vercel production host,
   not the older temporary ngrok host.

## Safety Boundary

The final wallet/MoneyGram flow is a high-risk operation. It requires explicit
approval, focused checks, and no automatic provider or signing claims.
