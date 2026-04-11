-- Phase 14: Module-level pricing fields
-- Each marketplace module now has its own price_monthly (flat) and
-- optional per-user charge (price_per_user + price_per_user_amount).
-- All modules include a 7-day trial by default.

ALTER TABLE marketplace_modules
  ADD COLUMN IF NOT EXISTS price_monthly        NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_per_user       BOOLEAN       DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS price_per_user_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_days           INTEGER       DEFAULT 7;

-- Drop old per-establishment / per-advisor columns (no longer used)
-- Only run this if you are sure no code is reading these columns any more.
-- ALTER TABLE marketplace_modules DROP COLUMN IF EXISTS price_per_establishment;
-- ALTER TABLE marketplace_modules DROP COLUMN IF EXISTS price_per_advisor;
