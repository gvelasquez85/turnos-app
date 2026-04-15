-- Phase 19: Exchange rates table for multimoneda support
CREATE TABLE IF NOT EXISTS exchange_rates (
  base_currency CHAR(3) NOT NULL DEFAULT 'USD',
  target_currency CHAR(3) NOT NULL,
  rate NUMERIC(20, 6) NOT NULL,
  source TEXT DEFAULT 'manual',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (base_currency, target_currency)
);

-- Enable RLS
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Anyone can read rates (needed for price display)
CREATE POLICY "exchange_rates: public read" ON exchange_rates
  FOR SELECT USING (true);

-- Only service role can update rates
CREATE POLICY "exchange_rates: service write" ON exchange_rates
  FOR ALL USING (false);

-- Seed initial approximate rates (2025 estimates)
INSERT INTO exchange_rates (base_currency, target_currency, rate, source) VALUES
  ('USD', 'COP', 4200.0, 'seed'),
  ('USD', 'USD', 1.0, 'seed')
ON CONFLICT (base_currency, target_currency) DO NOTHING;
