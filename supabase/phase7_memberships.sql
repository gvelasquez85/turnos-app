-- Phase 7: Membership tiers + free plan enforcement
-- Run this in Supabase SQL editor

-- 1. Update memberships table: add 'free' plan, add tier limits columns
ALTER TABLE public.memberships
  DROP CONSTRAINT IF EXISTS memberships_plan_check;

ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_plan_check
  CHECK (plan IN ('free', 'basic', 'professional', 'enterprise'));

-- 2. Add plan column to brands so we can quickly check limits without joining
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS current_plan text NOT NULL DEFAULT 'free'
  CHECK (current_plan IN ('free', 'basic', 'professional', 'enterprise'));

-- 3. Ensure every brand has a free membership (backfill)
INSERT INTO public.memberships (brand_id, plan, status, max_establishments, max_advisors)
SELECT
  b.id,
  'free',
  'active',
  1,    -- free: 1 establishment
  3     -- free: 3 advisors
FROM public.brands b
WHERE NOT EXISTS (
  SELECT 1 FROM public.memberships m WHERE m.brand_id = b.id
);

-- 4. Sync brands.current_plan from their active membership
UPDATE public.brands b
SET current_plan = m.plan
FROM public.memberships m
WHERE m.brand_id = b.id
  AND m.status IN ('active', 'trial')
  AND b.current_plan = 'free'
  AND m.plan != 'free';

-- 5. Plan limits reference (used by app, not enforced at DB level)
-- free:         1 est,  3 advisors,  queue only
-- basic:        3 est, 10 advisors,  queue + display + surveys
-- professional: 10 est, 30 advisors, queue + display + surveys + appointments + menu
-- enterprise:   unlimited

-- 6. Function to get plan limits
CREATE OR REPLACE FUNCTION public.get_plan_limits(p_plan text)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_plan
    WHEN 'free'         THEN '{"max_establishments":1,"max_advisors":3,"modules":["queue"]}'::jsonb
    WHEN 'basic'        THEN '{"max_establishments":3,"max_advisors":10,"modules":["queue","display","surveys"]}'::jsonb
    WHEN 'professional' THEN '{"max_establishments":10,"max_advisors":30,"modules":["queue","display","surveys","appointments","menu"]}'::jsonb
    WHEN 'enterprise'   THEN '{"max_establishments":999,"max_advisors":999,"modules":["queue","display","surveys","appointments","menu","precheckin","precheckout","minibar"]}'::jsonb
    ELSE                     '{"max_establishments":1,"max_advisors":3,"modules":["queue"]}'::jsonb
  END;
$$;

-- 7. Grant execute
GRANT EXECUTE ON FUNCTION public.get_plan_limits(text) TO authenticated, anon;
