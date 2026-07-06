CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL,
  short_description TEXT NOT NULL,
  cover_image_url TEXT,
  start_date_time TIMESTAMPTZ NOT NULL,
  end_date_time TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('physical', 'virtual', 'hybrid')),
  location_text TEXT,
  meeting_url TEXT,
  price_usdc TEXT NOT NULL DEFAULT '0',
  is_free BOOLEAN NOT NULL DEFAULT false,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  organizer_wallet TEXT NOT NULL,
  metadata_hash TEXT,
  core_event_id TEXT,
  publish_tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date_time > start_date_time),
  CHECK ((is_free = true AND price_usdc = '0') OR is_free = false)
);

CREATE TABLE IF NOT EXISTS collaborators (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  split_percentage DOUBLE PRECISION NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('link', 'file', 'text')),
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS passes (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  owner_wallet TEXT NOT NULL,
  token_id TEXT UNIQUE,
  metadata_uri TEXT,
  metadata_hash TEXT,
  mint_tx_hash TEXT,
  source TEXT NOT NULL CHECK (source IN ('purchase', 'free_claim')),
  checked_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE (event_id, owner_wallet)
);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  buyer_wallet TEXT NOT NULL,
  amount_usdc TEXT NOT NULL,
  token_id TEXT,
  tx_hash TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  collaborator_wallet TEXT NOT NULL,
  amount_usdc TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  token_id TEXT NOT NULL,
  owner_wallet TEXT NOT NULL,
  checked_in_by_wallet TEXT NOT NULL,
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE (event_id, token_id)
);

CREATE INDEX IF NOT EXISTS idx_events_status_start ON events(status, start_date_time);
CREATE INDEX IF NOT EXISTS idx_events_organizer_wallet ON events(organizer_wallet);
CREATE INDEX IF NOT EXISTS idx_collaborators_event_id ON collaborators(event_id);
CREATE INDEX IF NOT EXISTS idx_resources_event_sort ON resources(event_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_passes_owner_wallet ON passes(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_purchases_event_id ON purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_event_id ON withdrawals(event_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_event_id ON check_ins(event_id);

CREATE OR REPLACE FUNCTION quorum_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;

CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION quorum_set_updated_at();
