-- Phase 18: Store FCM push tokens on customers for CRM campaigns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS fcm_token_updated_at TIMESTAMPTZ;
