-- Phase 27: Sales complete — product types + fulfillment states
-- Run in Supabase SQL Editor

-- Add product type to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'product' CHECK (product_type IN ('product', 'service'));

-- Add fulfillment_type to sales (derived from items, set at creation time)
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(20) DEFAULT NULL CHECK (fulfillment_type IN ('physical', 'service', NULL));

-- Update existing sales: if type='sale', set fulfillment_type='physical' as default
UPDATE sales SET fulfillment_type = 'physical' WHERE type = 'sale' AND fulfillment_type IS NULL;

-- Index for status-based queries
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales (status, brand_id);
