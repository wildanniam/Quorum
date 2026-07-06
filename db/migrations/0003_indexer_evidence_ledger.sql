CREATE OR REPLACE FUNCTION quorum_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS indexer_state (
  id TEXT PRIMARY KEY,
  network TEXT NOT NULL,
  rpc_url TEXT NOT NULL,
  contract_ids TEXT[] NOT NULL DEFAULT '{}',
  cursor TEXT,
  latest_ledger INTEGER,
  last_started_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (latest_ledger IS NULL OR latest_ledger >= 0)
);

CREATE TABLE IF NOT EXISTS stellar_events (
  event_key TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'contract',
  topic_key TEXT,
  app_event_id TEXT,
  core_event_id TEXT,
  tx_hash TEXT,
  ledger INTEGER NOT NULL CHECK (ledger >= 0),
  event_index INTEGER NOT NULL DEFAULT 0 CHECK (event_index >= 0),
  paging_token TEXT NOT NULL UNIQUE,
  successful BOOLEAN NOT NULL DEFAULT true,
  topics_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  value_xdr TEXT,
  raw_event_json JSONB NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (app_event_id) REFERENCES events(id) ON DELETE SET NULL,
  CHECK (tx_hash IS NULL OR tx_hash ~ '^[a-f0-9]{64}$'),
  CHECK (core_event_id IS NULL OR core_event_id ~ '^[a-f0-9]{64}$')
);

CREATE INDEX IF NOT EXISTS idx_indexer_state_updated_at
  ON indexer_state(updated_at);

CREATE INDEX IF NOT EXISTS idx_stellar_events_app_event_id
  ON stellar_events(app_event_id);

CREATE INDEX IF NOT EXISTS idx_stellar_events_contract_ledger
  ON stellar_events(contract_id, ledger);

CREATE INDEX IF NOT EXISTS idx_stellar_events_core_event_id
  ON stellar_events(core_event_id)
  WHERE core_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stellar_events_topic_key
  ON stellar_events(topic_key)
  WHERE topic_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stellar_events_tx_hash
  ON stellar_events(tx_hash)
  WHERE tx_hash IS NOT NULL;

DROP TRIGGER IF EXISTS trg_indexer_state_updated_at ON indexer_state;

CREATE TRIGGER trg_indexer_state_updated_at
BEFORE UPDATE ON indexer_state
FOR EACH ROW
EXECUTE FUNCTION quorum_set_updated_at();

DROP TRIGGER IF EXISTS trg_stellar_events_updated_at ON stellar_events;

CREATE TRIGGER trg_stellar_events_updated_at
BEFORE UPDATE ON stellar_events
FOR EACH ROW
EXECUTE FUNCTION quorum_set_updated_at();
