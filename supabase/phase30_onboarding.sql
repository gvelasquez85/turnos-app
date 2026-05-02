-- Phase 30: Onboarding & business vertical
-- Adds business_type and onboarding tracking to brands

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'otros',
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tagline TEXT;

-- business_type values:
-- 'belleza'       → peluquerías, barberías, estética, uñas
-- 'restaurante'   → restaurantes, cafeterías, comidas rápidas
-- 'ferreteria'    → ferreterías, repuestos, talleres
-- 'servicios'     → profesionales independientes, servicios locales
-- 'tienda'        → tiendas especializadas, minimercados
-- 'otros'         → default
