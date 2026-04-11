-- Phase 16: PayPal subscription tracking on memberships
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS subscribed_amount NUMERIC(10,2) DEFAULT 0;
