ALTER TABLE anchor_payouts
  ADD COLUMN IF NOT EXISTS stellar_transaction_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_anchor_payouts_stellar_transaction_id
  ON anchor_payouts(stellar_transaction_id)
  WHERE stellar_transaction_id IS NOT NULL;

COMMENT ON COLUMN anchor_payouts.withdrawal_id IS
  'Source contract settlement that moved event USDC to the collaborator wallet.';

COMMENT ON COLUMN anchor_payouts.stellar_transaction_id IS
  'Stellar payment hash for the separate collaborator-wallet to anchor transfer.';
