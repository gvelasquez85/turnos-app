-- Phase 11: Brand update RLS + advisor_fields brand_id + promotions brand scope

-- ── Brand admin can update their own brand ─────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='brands' AND policyname='brands: brand_admin update own') THEN
    EXECUTE $p$CREATE POLICY "brands: brand_admin update own" ON public.brands
      FOR UPDATE USING (get_my_role() = 'brand_admin' AND id = get_my_brand_id())$p$;
  END IF;
END $$;

-- ── advisor_fields: add brand_id column ────────────────────────────────────
ALTER TABLE advisor_fields ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES brands(id);

-- Backfill brand_id from establishment
UPDATE advisor_fields af
SET brand_id = e.brand_id
FROM establishments e
WHERE e.id = af.establishment_id AND af.brand_id IS NULL;

-- Make establishment_id nullable (fields are now brand-scoped)
ALTER TABLE advisor_fields ALTER COLUMN establishment_id DROP NOT NULL;

-- ── promotions: add brand_id for "all establishments" scope ────────────────
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES brands(id);
ALTER TABLE promotions ALTER COLUMN establishment_id DROP NOT NULL;

-- Backfill brand_id from establishment
UPDATE promotions p
SET brand_id = e.brand_id
FROM establishments e
WHERE e.id = p.establishment_id AND p.brand_id IS NULL;
