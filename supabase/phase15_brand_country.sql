-- Phase 15: Country field on brands + PayPal plan ID on modules
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Colombia';

-- Optional: PayPal recurring plan ID per module (filled by superadmin later)
ALTER TABLE marketplace_modules
  ADD COLUMN IF NOT EXISTS paypal_plan_id VARCHAR(100);
