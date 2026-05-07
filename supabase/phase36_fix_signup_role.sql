-- ─── phase36: Fix default role on signup trigger ─────────────────────────────
-- The on_auth_user_created trigger was defaulting new users to 'advisor'.
-- Users who self-register via /register should be 'brand_admin'.
-- Advisors are always created by a brand_admin via invite, never self-signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    -- Use role from metadata if explicitly set (e.g. 'advisor' when invited by admin),
    -- otherwise default to 'brand_admin' for self-registered users.
    coalesce(new.raw_user_meta_data->>'role', 'brand_admin')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
