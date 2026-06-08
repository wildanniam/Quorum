CREATE UNIQUE INDEX IF NOT EXISTS idx_events_core_event_id_unique
  ON events(core_event_id)
  WHERE core_event_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_publish_tx_hash_unique
  ON events(publish_tx_hash)
  WHERE publish_tx_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_passes_mint_tx_hash_unique
  ON passes(mint_tx_hash)
  WHERE mint_tx_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_check_ins_tx_hash_unique
  ON check_ins(tx_hash)
  WHERE tx_hash IS NOT NULL;
