-- Phase 24: CRM → Clientes Module Upgrade
-- Extend customers table with new fields
-- Create supporting tables for customer management

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTEND CUSTOMERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS celular VARCHAR(20);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS canal_contacto VARCHAR(100);
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS ultima_compra TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS intereses TEXT[];
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cumpleanos DATE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS recordatorios_enviados INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_cumpleanos ON public.customers(cumpleanos);
CREATE INDEX IF NOT EXISTS idx_customers_intereses ON public.customers USING gin(intereses);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CUSTOMER TAGS TABLE (predefined tags for segmentation)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tag_key VARCHAR(100) NOT NULL,
  -- Predefined options: "cliente_frecuente", "cliente_nuevo", "cliente_inactivo",
  --                     "pregunto_pero_no_compro", "requiere_seguimiento", "cliente_premium",
  --                     "debe_volver_30_dias"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_id UUID REFERENCES public.profiles(id),
  UNIQUE(customer_id, tag_key)
);

CREATE INDEX IF NOT EXISTS idx_customer_tags_customer_id ON public.customer_tags(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_tags_key ON public.customer_tags(tag_key);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. CUSTOMER HISTORY TABLE (visit and purchase tracking)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE SET NULL,
  tipo VARCHAR(50) NOT NULL,  -- "visita", "compra", "consulta", "soporte"
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  detalles TEXT,  -- Free-form notes about the interaction
  monto DECIMAL(10, 2),  -- For purchases
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_history_customer_id ON public.customer_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_history_establishment_id ON public.customer_history(establishment_id);
CREATE INDEX IF NOT EXISTS idx_customer_history_fecha ON public.customer_history(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_customer_history_tipo ON public.customer_history(tipo);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. CUSTOMER REMINDERS TABLE (follow-up and birthday reminders)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.customer_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,  -- "cumpleanos", "inactividad", "compra_pendiente", "custom"
  descripcion TEXT,
  fecha_recordatorio TIMESTAMP WITH TIME ZONE,
  enviado BOOLEAN DEFAULT FALSE,
  enviado_at TIMESTAMP WITH TIME ZONE,
  medio_envio VARCHAR(50),  -- "whatsapp", "email", "sms"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_reminders_customer_id ON public.customer_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_reminders_tipo ON public.customer_reminders(tipo);
CREATE INDEX IF NOT EXISTS idx_customer_reminders_fecha ON public.customer_reminders(fecha_recordatorio);
CREATE INDEX IF NOT EXISTS idx_customer_reminders_enviado ON public.customer_reminders(enviado);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS POLICIES FOR NEW TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reminders ENABLE ROW LEVEL SECURITY;

-- Policies for customer_tags
CREATE POLICY "Users can view customer_tags for their brand's customers" ON public.customer_tags
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE brand_id = (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert customer_tags for their brand's customers" ON public.customer_tags
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE brand_id = (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete customer_tags for their brand's customers" ON public.customer_tags
  FOR DELETE
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE brand_id = (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Policies for customer_history
CREATE POLICY "Users can view customer_history for their brand's customers" ON public.customer_history
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE brand_id = (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert customer_history for their brand's customers" ON public.customer_history
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE brand_id = (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Policies for customer_reminders
CREATE POLICY "Users can view customer_reminders for their brand's customers" ON public.customer_reminders
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE brand_id = (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert customer_reminders for their brand's customers" ON public.customer_reminders
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE brand_id = (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update customer_reminders for their brand's customers" ON public.customer_reminders
  FOR UPDATE
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE brand_id = (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. MARKETPLACE MODULES: ADD QUEUE MODULE (was core, now paid)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.marketplace_modules (
  module_key, label, description, icon, color, price_monthly,
  price_per_user, features, trial_days, is_visible_to_brands, is_coming_soon, sort_order
) VALUES (
  'queue',
  'Colas de espera',
  'Panel de asesores, pantalla de llamado en tiempo real, reportes de espera y analítica completa de colas',
  'Clock',
  'indigo',
  70000,
  NULL,
  ARRAY[
    'Panel de asesores en tiempo real',
    'Pantalla TV de llamado automático',
    'Reportes y analítica de tiempos',
    'Control de colas por sucursal',
    'Historial de atenciones'
  ],
  7,
  true,
  false,
  1
) ON CONFLICT (module_key) DO UPDATE SET
  label = 'Colas de espera',
  description = 'Panel de asesores, pantalla de llamado en tiempo real, reportes de espera y analítica completa de colas',
  price_monthly = 70000,
  features = ARRAY[
    'Panel de asesores en tiempo real',
    'Pantalla TV de llamado automático',
    'Reportes y analítica de tiempos',
    'Control de colas por sucursal',
    'Historial de atenciones'
  ],
  sort_order = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. UPDATE CRM MODULE: Now "Clientes" - free, core, no gating
-- ─────────────────────────────────────────────────────────────────────────────

-- Update existing CRM module or insert if doesn't exist
INSERT INTO public.marketplace_modules (
  module_key, label, description, icon, color, price_monthly,
  price_per_user, features, trial_days, is_visible_to_brands, is_coming_soon, sort_order
) VALUES (
  'clientes',
  'Clientes',
  'Nunca más pierdas un cliente por falta de seguimiento. Gestiona el historial completo, tags, recordatorios y análisis de tus clientes.',
  'Users',
  'emerald',
  0,
  NULL,
  ARRAY[
    'Directorio completo de clientes',
    'Historial de compras y visitas',
    'Segmentación con tags',
    'Recordatorios de cumpleaños',
    'Notas y seguimiento',
    'Análisis de clientes'
  ],
  0,
  true,
  false,
  0
) ON CONFLICT (module_key) DO UPDATE SET
  label = 'Clientes',
  description = 'Nunca más pierdas un cliente por falta de seguimiento. Gestiona el historial completo, tags, recordatorios y análisis de tus clientes.',
  price_monthly = 0,
  features = ARRAY[
    'Directorio completo de clientes',
    'Historial de compras y visitas',
    'Segmentación con tags',
    'Recordatorios de cumpleaños',
    'Notas y seguimiento',
    'Análisis de clientes'
  ],
  trial_days = 0,
  sort_order = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. NOTES FOR IMPLEMENTATION
-- ─────────────────────────────────────────────────────────────────────────────

-- After running this migration:
-- 1. Code changes needed:
--    - Update AppShell.tsx: Move Queue from OPERATION_ITEMS to MODULE_ITEMS
--    - Rename /app/admin/crm → /app/admin/clientes
--    - Add TrialExpiredGate to queue pages
--    - Update Clientes (CRM) components to show new fields
--    - Update Landing Page with new positioning
--
-- 2. For existing customers:
--    - Queue is now PAID (no auto-gratis for existing customers)
--    - They will see Queue nav item disappear unless in trial/subscription
--    - Advisors without Queue subscription will see upgrade message
--    - Public bookings (lite queue) remain free for all
--
-- 3. Migration is backwards compatible:
--    - New columns are nullable
--    - Old CRM data is preserved
--    - Both module_key entries (crm and clientes) can coexist

\c -- End of migration
