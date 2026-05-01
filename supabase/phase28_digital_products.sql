-- Phase 28: Digital products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS digital_url TEXT,
  ADD COLUMN IF NOT EXISTS download_limit INT DEFAULT 3;

-- product_type already has 'product' and 'service' from phase27
-- Add 'digital' as valid value:
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE products ADD CONSTRAINT products_product_type_check
  CHECK (product_type IN ('product', 'service', 'digital'));

-- Table to track unique download tokens per sale item
CREATE TABLE IF NOT EXISTS digital_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  sale_item_id UUID REFERENCES sale_items(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'base64url'),
  download_count INT DEFAULT 0,
  max_downloads INT DEFAULT 3,
  digital_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_digital_downloads_token ON digital_downloads (token);
CREATE INDEX IF NOT EXISTS idx_digital_downloads_sale ON digital_downloads (sale_id);
