-- ── Fix: allow manager role to update brand form_fields and data_policy_text ──

-- Drop existing update policy (only allowed brand_admin)
DROP POLICY IF EXISTS "brands: brand_admin update own" ON public.brands;

-- Re-create with both brand_admin and manager roles
CREATE POLICY "brands: brand_admin update own" ON public.brands
  FOR UPDATE
  USING (
    get_my_role() IN ('brand_admin', 'manager')
    AND id = get_my_brand_id()
  )
  WITH CHECK (
    get_my_role() IN ('brand_admin', 'manager')
    AND id = get_my_brand_id()
  );
