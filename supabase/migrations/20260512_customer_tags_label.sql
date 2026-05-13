-- Add tag_label column to customer_tags for custom tag display names
ALTER TABLE public.customer_tags
  ADD COLUMN IF NOT EXISTS tag_label VARCHAR(100);
