-- Brand primary color for public pages
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6366f1';
