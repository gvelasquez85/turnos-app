-- Add font_color column to display_configs (was missing, causing silent save failures)
ALTER TABLE public.display_configs
  ADD COLUMN IF NOT EXISTS font_color text DEFAULT '#ffffff';
