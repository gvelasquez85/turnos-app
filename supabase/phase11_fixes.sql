-- Phase 11: Brand update RLS + advisor_fields brand_id + promotions brand scope + handle_new_user fix

-- ── CRÍTICO: Fix role check constraint (faltaba manager y reporting) ──────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('superadmin','brand_admin','manager','advisor','reporting'));

-- ── Fix handle_new_user trigger to capture brand_id and establishment_id ──────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, brand_id, establishment_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'advisor'),
    NULLIF(new.raw_user_meta_data->>'brand_id', '')::uuid,
    NULLIF(new.raw_user_meta_data->>'establishment_id', '')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    brand_id = COALESCE(EXCLUDED.brand_id, profiles.brand_id),
    establishment_id = COALESCE(EXCLUDED.establishment_id, profiles.establishment_id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



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

-- ── display_configs: add widgets column if not present ──────────────────────
ALTER TABLE public.display_configs
  ADD COLUMN IF NOT EXISTS widgets jsonb DEFAULT '[]'::jsonb;

-- RLS for display_configs: brand users can manage their own establishment configs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='display_configs' AND policyname='display_configs: brand read') THEN
    EXECUTE $p$CREATE POLICY "display_configs: brand read" ON public.display_configs
      FOR SELECT USING (
        establishment_id IN (
          SELECT id FROM public.establishments
          WHERE brand_id = get_my_brand_id()
        )
      )$p$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='display_configs' AND policyname='display_configs: brand write') THEN
    EXECUTE $p$CREATE POLICY "display_configs: brand write" ON public.display_configs
      FOR ALL USING (
        establishment_id IN (
          SELECT id FROM public.establishments
          WHERE brand_id = get_my_brand_id()
        )
      )$p$;
  END IF;
END $$;

-- ── NOTA: Para asociar manualmente usuarios huérfanos (sin brand_id) ──────────
-- Ejecuta esto en el SQL Editor reemplazando el UUID de tu marca:
-- UPDATE public.profiles
--   SET brand_id = 'TU-BRAND-UUID-AQUI'
-- WHERE brand_id IS NULL AND role NOT IN ('superadmin', 'brand_admin');
--
-- O para ver los usuarios sin marca:
-- SELECT id, email, role, brand_id FROM public.profiles WHERE brand_id IS NULL;
