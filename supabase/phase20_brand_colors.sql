-- Brand secondary color (used for page backgrounds, TV screen background)
-- and font color (used for text in brand public pages)
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#7c3aed';

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS font_color text DEFAULT '#ffffff';
