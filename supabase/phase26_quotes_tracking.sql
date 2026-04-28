-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 26: Quote tracking columns + public quote support
-- Run in Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Add tracking columns to sales table (only if they don't exist)
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS sent_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_to_email  TEXT,
  ADD COLUMN IF NOT EXISTS opened_at      TIMESTAMPTZ;

-- Add quote_template to brands (if not already added)
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS quote_template JSONB;

-- Helper RPC for first-open tracking (idempotent)
CREATE OR REPLACE FUNCTION set_quote_opened(quote_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE sales
  SET    opened_at = NOW()
  WHERE  id = quote_id
    AND  opened_at IS NULL;
END;
$$;

-- Grant execute to service role + anon
GRANT EXECUTE ON FUNCTION set_quote_opened(UUID) TO service_role, anon, authenticated;

-- Link auto-created sales back to their origin quote
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS source_quote_id UUID REFERENCES sales(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_source_quote ON sales (source_quote_id) WHERE source_quote_id IS NOT NULL;

-- Index for faster quote lookups
CREATE INDEX IF NOT EXISTS idx_sales_type_brand ON sales (type, brand_id);
CREATE INDEX IF NOT EXISTS idx_sales_sent_to_email ON sales (sent_to_email) WHERE sent_to_email IS NOT NULL;
