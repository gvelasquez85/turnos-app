-- ══════════════════════════════════════════════════════════════════════════════
-- Phase 13 – New per-seat pricing model + marketplace modules table
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. app_translations (for TranslationsManager) ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_translations (
  id    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lang  text NOT NULL,
  key   text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lang, key)
);
ALTER TABLE public.app_translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_translations: public read" ON public.app_translations;
CREATE POLICY "app_translations: public read" ON public.app_translations
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "app_translations: superadmin write" ON public.app_translations;
CREATE POLICY "app_translations: superadmin write" ON public.app_translations
  FOR ALL USING (get_my_role() = 'superadmin');

-- ── 2. marketplace_modules – superadmin-controlled catalogue ──────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_modules (
  id                       uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  module_key               text    NOT NULL UNIQUE,
  label                    text    NOT NULL,
  description              text,
  icon                     text,               -- lucide icon name
  color                    text,               -- tailwind bg-* class
  features                 text[]  DEFAULT '{}',
  price_per_establishment  numeric(10,2) DEFAULT 5.00,
  price_per_advisor        numeric(10,2) DEFAULT 2.00,
  is_visible_to_brands     boolean DEFAULT false,  -- superadmin toggles this
  is_coming_soon           boolean DEFAULT false,
  sort_order               int     DEFAULT 0,
  created_at               timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketplace_modules: read all" ON public.marketplace_modules;
CREATE POLICY "marketplace_modules: read all" ON public.marketplace_modules
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "marketplace_modules: superadmin write" ON public.marketplace_modules;
CREATE POLICY "marketplace_modules: superadmin write" ON public.marketplace_modules
  FOR ALL USING (get_my_role() = 'superadmin');

-- ── 3. Seed marketplace modules (idempotent) ──────────────────────────────────
INSERT INTO public.marketplace_modules
  (module_key, label, description, icon, color, features, price_per_establishment, price_per_advisor, is_visible_to_brands, sort_order)
VALUES
  ('crm',          'CRM de Clientes',       'Historial unificado de clientes, historial de visitas, notas y segmentación.',
   'UserCheck',    'bg-cyan-500',
   ARRAY['Perfil unificado por cliente','Historial de visitas','Notas y etiquetas','Exportar datos'],
   5, 2, false, 1),

  ('surveys',      'Encuestas NPS / CSAT',  'Mide la satisfacción automáticamente al cerrar cada atención.',
   'ClipboardList','bg-purple-500',
   ARRAY['NPS, CSAT y CES','Pregunta abierta','Dashboard de resultados','Tendencias en el tiempo'],
   5, 2, false, 2),

  ('appointments', 'Citas programadas',     'Reserva de citas online, agenda por servicio y check-in integrado.',
   'CalendarClock','bg-blue-500',
   ARRAY['Reserva online 24/7','Confirmación automática','Gestión de agenda','Check-in en app'],
   5, 2, false, 3),

  ('menu',         'Menú y Preorden',       'Carta digital y pedidos mientras el cliente espera su turno.',
   'UtensilsCrossed','bg-orange-500',
   ARRAY['Catálogo de productos','Carrito digital','Pedidos en espera','Gestión de estados'],
   5, 2, false, 4),

  ('precheckin',   'Pre check-in',          'El cliente completa su información antes de llegar.',
   'LogIn',        'bg-teal-500',
   ARRAY['Formulario personalizable','Validación de datos','Integración con cola','Historial del cliente'],
   5, 2, false, 5),

  ('precheckout',  'Pre check-out',         'Digitaliza la salida y revisión de cargos con firma digital.',
   'LogOut',       'bg-indigo-500',
   ARRAY['Resumen de consumos','Firma digital','Envío por email','Registro de cierre'],
   5, 2, false, 6),

  ('minibar',      'Consumo en habitación', 'Registro de consumos de habitación o sala VIP en tiempo real.',
   'Coffee',       'bg-amber-600',
   ARRAY['Catálogo por habitación','Registro en tiempo real','Cierre automático','Reporte de consumos'],
   5, 2, false, 7)
ON CONFLICT (module_key) DO UPDATE SET
  label                   = EXCLUDED.label,
  description             = EXCLUDED.description,
  icon                    = EXCLUDED.icon,
  color                   = EXCLUDED.color,
  features                = EXCLUDED.features,
  price_per_establishment = EXCLUDED.price_per_establishment,
  price_per_advisor       = EXCLUDED.price_per_advisor,
  sort_order              = EXCLUDED.sort_order;

-- ── 4. New per-seat pricing columns on memberships ────────────────────────────
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS price_per_establishment  numeric(10,2) DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS price_per_additional_advisor numeric(10,2) DEFAULT 5.00;

-- ── 5. Expand current_plan to accept 'standard' ───────────────────────────────
-- Remove the old CHECK constraint and add a looser one
DO $$ BEGIN
  ALTER TABLE public.brands DROP CONSTRAINT IF EXISTS brands_current_plan_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.brands
  ADD CONSTRAINT brands_current_plan_check
  CHECK (current_plan IN ('free','basic','professional','enterprise','enterprise_plus','standard'));

-- ── 6. Expand memberships plan to accept 'standard' ───────────────────────────
DO $$ BEGIN
  ALTER TABLE public.memberships DROP CONSTRAINT IF EXISTS memberships_plan_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_plan_check
  CHECK (plan IN ('free','basic','professional','enterprise','enterprise_plus','standard'));

-- ── 7. NOTA: después de ejecutar este script ──────────────────────────────────
--   • Para activar un módulo en el marketplace:
--       UPDATE marketplace_modules SET is_visible_to_brands = true WHERE module_key = 'crm';
--   • Para agregar FIREBASE_SERVER_KEY:
--       INSERT INTO system_settings (key, value) VALUES ('FIREBASE_SERVER_KEY', 'tu-server-key')
--       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
