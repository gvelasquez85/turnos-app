-- Brand-level active modules (superadmin controls these)
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS active_modules jsonb DEFAULT '{"queue":true,"appointments":false,"surveys":false,"menu":false,"display":false}'::jsonb;

-- Brand contact/settings fields
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS website text;

-- Membership tracking
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic','professional','enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled','trial')),
  started_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,
  max_establishments int DEFAULT 1,
  max_advisors int DEFAULT 5,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memberships: superadmin all" ON public.memberships
  FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "memberships: brand read own" ON public.memberships
  FOR SELECT USING (
    brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
  );
