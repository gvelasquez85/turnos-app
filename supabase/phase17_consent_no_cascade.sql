-- Phase 17: Preserve consents when an establishment is deleted
-- Change data_consents.establishment_id FK from CASCADE to SET NULL
-- so customer authorization records are never lost

ALTER TABLE public.data_consents
  DROP CONSTRAINT IF EXISTS data_consents_establishment_id_fkey;

ALTER TABLE public.data_consents
  ADD CONSTRAINT data_consents_establishment_id_fkey
    FOREIGN KEY (establishment_id)
    REFERENCES public.establishments(id)
    ON DELETE SET NULL;
