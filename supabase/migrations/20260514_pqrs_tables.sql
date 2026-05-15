-- ============================================================================
-- PQRS Module — Case Management System
-- Peticiones, Quejas, Reclamos y Sugerencias
-- ============================================================================

-- Configuration per brand
CREATE TABLE IF NOT EXISTS pqrs_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  -- Public form settings
  form_title TEXT DEFAULT 'Radicar PQRS',
  form_description TEXT DEFAULT 'Registra tu petición, queja, reclamo o sugerencia',
  form_slug TEXT, -- public URL: /pqrs/{slug}
  form_enabled BOOLEAN DEFAULT true,
  -- Categories available
  categories TEXT[] DEFAULT ARRAY['Petición', 'Queja', 'Reclamo', 'Sugerencia', 'Felicitación'],
  -- SLA days per type
  sla_peticion_days INT DEFAULT 15,
  sla_queja_days INT DEFAULT 15,
  sla_reclamo_days INT DEFAULT 15,
  sla_sugerencia_days INT DEFAULT 30,
  -- Notifications
  notify_email TEXT, -- internal email for new cases
  auto_reply_enabled BOOLEAN DEFAULT true,
  auto_reply_subject TEXT DEFAULT 'Confirmación de radicación PQRS',
  auto_reply_body TEXT DEFAULT 'Hemos recibido su caso con número de radicado {{radicado}}. Será atendido en un plazo máximo de {{sla_days}} días hábiles.',
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#059669',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id),
  UNIQUE(form_slug)
);

-- Cases
CREATE TABLE IF NOT EXISTS pqrs_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  -- Radicado (consecutive per brand)
  radicado TEXT NOT NULL,
  -- Requester info
  requester_name TEXT NOT NULL,
  requester_email TEXT,
  requester_phone TEXT,
  requester_id_type TEXT DEFAULT 'CC',
  requester_id_number TEXT,
  -- Case details
  category TEXT NOT NULL, -- Petición, Queja, Reclamo, Sugerencia
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  -- Status tracking
  status TEXT DEFAULT 'open', -- open, in_progress, waiting_response, resolved, closed, rejected
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  -- SLA
  sla_due_date DATE,
  sla_breached BOOLEAN DEFAULT false,
  -- Resolution
  resolution_summary TEXT,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  -- Source
  source TEXT DEFAULT 'public_form', -- public_form, internal, email, phone
  source_sale_id UUID, -- optional link to sale
  customer_id UUID, -- optional link to customer
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pqrs_cases_brand ON pqrs_cases(brand_id);
CREATE INDEX idx_pqrs_cases_status ON pqrs_cases(brand_id, status);
CREATE INDEX idx_pqrs_cases_radicado ON pqrs_cases(brand_id, radicado);

-- Attachments
CREATE TABLE IF NOT EXISTS pqrs_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES pqrs_cases(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  file_type TEXT, -- mime type
  uploaded_by UUID REFERENCES auth.users(id), -- null if uploaded by requester
  is_internal BOOLEAN DEFAULT false, -- internal attachments not visible to requester
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notes / Comments (internal + public)
CREATE TABLE IF NOT EXISTS pqrs_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES pqrs_cases(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id),
  author_id UUID REFERENCES auth.users(id), -- null if from requester
  author_name TEXT,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- internal notes not visible to requester
  notify_requester BOOLEAN DEFAULT false, -- send email to requester
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Status history
CREATE TABLE IF NOT EXISTS pqrs_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES pqrs_cases(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id),
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Consecutive counter per brand
CREATE TABLE IF NOT EXISTS pqrs_counters (
  brand_id UUID PRIMARY KEY REFERENCES brands(id),
  last_number INT DEFAULT 0,
  prefix TEXT DEFAULT 'PQRS'
);

-- Function to assign next radicado
CREATE OR REPLACE FUNCTION assign_pqrs_radicado(p_brand_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_number INT;
  v_prefix TEXT;
  v_year TEXT;
BEGIN
  INSERT INTO pqrs_counters (brand_id, last_number, prefix)
  VALUES (p_brand_id, 0, 'PQRS')
  ON CONFLICT (brand_id) DO NOTHING;

  UPDATE pqrs_counters
  SET last_number = last_number + 1
  WHERE brand_id = p_brand_id
  RETURNING last_number, prefix INTO v_number, v_prefix;

  v_year := to_char(now(), 'YYYY');
  RETURN v_prefix || '-' || v_year || '-' || lpad(v_number::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE pqrs_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqrs_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqrs_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqrs_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqrs_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqrs_counters ENABLE ROW LEVEL SECURITY;

-- Policies: brand isolation
CREATE POLICY pqrs_configs_brand ON pqrs_configs USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY pqrs_cases_brand ON pqrs_cases USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY pqrs_attachments_brand ON pqrs_attachments USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY pqrs_notes_brand ON pqrs_notes USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY pqrs_status_history_brand ON pqrs_status_history USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY pqrs_counters_brand ON pqrs_counters USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));

-- Marketplace entry
INSERT INTO marketplace_modules (module_key, label, description, icon, color, price_monthly, features, trial_days, is_visible_to_brands, sort_order)
VALUES ('pqrs', 'PQRS', 'Gestión de Peticiones, Quejas, Reclamos y Sugerencias con formulario público, radicación automática y seguimiento de casos', 'MessageSquareWarning', 'orange', 39900,
  ARRAY['Formulario público de radicación', 'Radicado automático con notificación', 'Gestión de estados y SLA', 'Notas internas y adjuntos', 'Historial completo de cada caso'],
  14, true, 8)
ON CONFLICT (module_key) DO NOTHING;
