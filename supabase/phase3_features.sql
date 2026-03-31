-- ============================================================
-- PHASE 3: Feature flags per establishment + Display widgets
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Feature flags on establishments
ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{"queue":true,"appointments":false,"surveys":false,"menu":false}'::jsonb;

-- 2. Widgets column on display_configs (replaces simple booleans)
ALTER TABLE public.display_configs
  ADD COLUMN IF NOT EXISTS widgets jsonb DEFAULT '[]'::jsonb;

-- 3. New roles constraint (if not already updated)
-- Run only if the check constraint still blocks manager/reporting:
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
--   CHECK (role IN ('superadmin','brand_admin','manager','advisor','reporting'));

-- 4. Ensure survey_responses has consistent column (the app uses 'responses')
-- Already named 'responses' in phase2_migration.sql — no change needed.

-- ============================================================
-- Done. Verify with:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'establishments' AND column_name = 'features';
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'display_configs' AND column_name = 'widgets';
-- ============================================================
