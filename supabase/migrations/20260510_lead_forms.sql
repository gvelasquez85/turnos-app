-- Lead source tracking on customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- Lead forms table for embeddable form builder
CREATE TABLE IF NOT EXISTS lead_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for brand lookup
CREATE INDEX IF NOT EXISTS idx_lead_forms_brand_id ON lead_forms(brand_id);

-- RLS
ALTER TABLE lead_forms ENABLE ROW LEVEL SECURITY;

-- Brands can manage their own forms
CREATE POLICY "lead_forms_brand_access" ON lead_forms
  FOR ALL USING (
    brand_id IN (
      SELECT brand_id FROM profiles WHERE id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Public read for active forms (needed for /f/[formId] page)
CREATE POLICY "lead_forms_public_read" ON lead_forms
  FOR SELECT USING (active = true);
