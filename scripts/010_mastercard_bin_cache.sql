CREATE TABLE IF NOT EXISTS mastercard_bin_cache (
  bin VARCHAR(11) PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_mastercard_bin_cache_expires
  ON mastercard_bin_cache(expires_at);
