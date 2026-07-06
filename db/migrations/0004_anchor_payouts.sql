CREATE TABLE IF NOT EXISTS anchor_payouts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  collaborator_wallet TEXT NOT NULL,
  amount_usdc TEXT NOT NULL,
  asset TEXT NOT NULL DEFAULT 'USDC' CHECK (asset = 'USDC'),
  provider TEXT NOT NULL CHECK (provider IN ('mock', 'moneygram')),
  status TEXT NOT NULL CHECK (
    status IN (
      'requested',
      'pending_anchor',
      'ready_for_pickup',
      'completed',
      'failed',
      'cancelled'
    )
  ),
  anchor_transaction_id TEXT,
  reference_number TEXT,
  pickup_url TEXT,
  withdrawal_id TEXT UNIQUE,
  failure_reason TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (withdrawal_id) REFERENCES withdrawals(id) ON DELETE SET NULL,
  CHECK (CAST(amount_usdc AS numeric) > 0)
);

CREATE INDEX IF NOT EXISTS idx_anchor_payouts_event_wallet
  ON anchor_payouts(event_id, collaborator_wallet);

CREATE INDEX IF NOT EXISTS idx_anchor_payouts_wallet_created
  ON anchor_payouts(collaborator_wallet, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_anchor_payouts_status
  ON anchor_payouts(status);

DROP TRIGGER IF EXISTS trg_anchor_payouts_updated_at ON anchor_payouts;

CREATE TRIGGER trg_anchor_payouts_updated_at
BEFORE UPDATE ON anchor_payouts
FOR EACH ROW
EXECUTE FUNCTION quorum_set_updated_at();
