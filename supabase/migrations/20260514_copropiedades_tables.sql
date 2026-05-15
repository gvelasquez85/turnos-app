-- ============================================================================
-- Copropiedades Module — Property Management
-- Gestión integral de copropiedades
-- ============================================================================

-- Configuration per brand (copropiedad = brand)
CREATE TABLE IF NOT EXISTS copropiedad_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) UNIQUE,
  -- General info
  copropiedad_name TEXT,
  nit TEXT,
  address TEXT,
  city TEXT,
  total_units INT DEFAULT 0,
  total_coef NUMERIC(10,6) DEFAULT 100, -- Total coeficiente (should be 100%)
  -- Admin fee config
  current_period TEXT, -- "2026-05" format
  fee_due_day INT DEFAULT 10, -- Day of month
  late_fee_percent NUMERIC(5,2) DEFAULT 1.5, -- Monthly late fee %
  -- Meeting config
  quorum_percent NUMERIC(5,2) DEFAULT 51.0, -- % of coef needed for quorum
  -- Contact
  admin_name TEXT,
  admin_email TEXT,
  admin_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Properties / Units ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS copropiedad_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  -- Unit identification
  unit_number TEXT NOT NULL, -- "Apto 101", "Local 3", "Bodega B2"
  unit_type TEXT DEFAULT 'apartamento', -- apartamento, casa, local, oficina, parqueadero, bodega
  tower TEXT, -- Torre A, Bloque 2, etc.
  floor INT,
  area_m2 NUMERIC(10,2),
  -- Ownership
  coeficiente NUMERIC(8,6) NOT NULL DEFAULT 0, -- Coeficiente de copropiedad (e.g., 1.234567%)
  -- Owner info
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  owner_id_type TEXT DEFAULT 'CC',
  owner_id_number TEXT,
  -- Tenant info (optional)
  tenant_name TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  -- Status
  is_active BOOLEAN DEFAULT true,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, unit_number)
);

CREATE INDEX idx_copropiedad_units_brand ON copropiedad_units(brand_id);

-- ─── Administration Fees (Cuotas) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS copropiedad_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  unit_id UUID NOT NULL REFERENCES copropiedad_units(id) ON DELETE CASCADE,
  -- Period
  period TEXT NOT NULL, -- "2026-05"
  -- Amounts
  base_amount NUMERIC(12,2) NOT NULL,
  extra_charges NUMERIC(12,2) DEFAULT 0, -- Cuotas extraordinarias
  late_fee NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  -- Payment
  status TEXT DEFAULT 'pending', -- pending, paid, partial, overdue
  paid_amount NUMERIC(12,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  payment_method TEXT, -- cash, transfer, pse, etc.
  payment_reference TEXT,
  -- Due date
  due_date DATE NOT NULL,
  -- Notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unit_id, period)
);

CREATE INDEX idx_copropiedad_fees_brand ON copropiedad_fees(brand_id, period);

-- ─── Common Spaces ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS copropiedad_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  name TEXT NOT NULL, -- "Salón comunal", "BBQ", "Piscina", "Gimnasio"
  description TEXT,
  capacity INT,
  -- Reservation rules
  requires_reservation BOOLEAN DEFAULT true,
  max_hours_per_booking INT DEFAULT 4,
  advance_days_min INT DEFAULT 1, -- Min days in advance to book
  advance_days_max INT DEFAULT 30, -- Max days in advance
  available_from TIME DEFAULT '06:00',
  available_to TIME DEFAULT '22:00',
  available_days INT[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=Sun, 6=Sat
  -- Cost
  reservation_fee NUMERIC(12,2) DEFAULT 0, -- Cost per reservation
  deposit_amount NUMERIC(12,2) DEFAULT 0,
  -- Status
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Space reservations
CREATE TABLE IF NOT EXISTS copropiedad_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  space_id UUID NOT NULL REFERENCES copropiedad_spaces(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES copropiedad_units(id),
  -- Booking details
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  -- Guest info
  guest_count INT DEFAULT 1,
  purpose TEXT,
  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, cancelled, completed
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  -- Payment
  fee_paid BOOLEAN DEFAULT false,
  deposit_paid BOOLEAN DEFAULT false,
  deposit_returned BOOLEAN DEFAULT false,
  -- Contact
  contact_name TEXT,
  contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_copropiedad_reservations_date ON copropiedad_reservations(brand_id, space_id, reservation_date);

-- ─── Meetings (Asambleas y Consejos) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS copropiedad_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id),
  -- Meeting info
  meeting_type TEXT NOT NULL, -- 'asamblea_ordinaria', 'asamblea_extraordinaria', 'consejo'
  title TEXT NOT NULL,
  description TEXT,
  -- Schedule
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  location TEXT,
  -- Quorum
  quorum_required NUMERIC(5,2) NOT NULL DEFAULT 51.0, -- % coeficiente needed
  quorum_present NUMERIC(8,6) DEFAULT 0, -- actual % present
  quorum_reached BOOLEAN DEFAULT false,
  quorum_reached_at TIMESTAMPTZ,
  -- Status
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, quorum_reached, completed, cancelled
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  -- Agenda
  agenda JSONB DEFAULT '[]', -- [{order: 1, title: "...", description: "..."}]
  -- Created
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Meeting attendees (for quorum tracking)
CREATE TABLE IF NOT EXISTS copropiedad_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES copropiedad_meetings(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id),
  unit_id UUID NOT NULL REFERENCES copropiedad_units(id),
  -- Attendance
  attendee_name TEXT NOT NULL,
  attendee_type TEXT DEFAULT 'owner', -- owner, tenant, delegate
  delegate_name TEXT, -- If represented by delegate
  delegate_id_number TEXT,
  power_of_attorney BOOLEAN DEFAULT false, -- Has poder/proxy
  -- Coeficiente for quorum
  coeficiente NUMERIC(8,6) NOT NULL,
  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(meeting_id, unit_id)
);

-- Meeting votes
CREATE TABLE IF NOT EXISTS copropiedad_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES copropiedad_meetings(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id),
  -- Vote topic
  topic_number INT NOT NULL,
  topic_title TEXT NOT NULL,
  topic_description TEXT,
  -- Vote type
  vote_type TEXT DEFAULT 'simple_majority', -- simple_majority, qualified_majority (70%), unanimous
  required_percent NUMERIC(5,2) DEFAULT 51.0,
  -- Status
  status TEXT DEFAULT 'pending', -- pending, open, closed
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  -- Results (calculated)
  votes_favor NUMERIC(8,6) DEFAULT 0, -- % coeficiente in favor
  votes_against NUMERIC(8,6) DEFAULT 0,
  votes_abstain NUMERIC(8,6) DEFAULT 0,
  total_voters INT DEFAULT 0,
  result TEXT, -- 'approved', 'rejected', 'pending'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual vote records
CREATE TABLE IF NOT EXISTS copropiedad_vote_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES copropiedad_votes(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES copropiedad_attendees(id),
  brand_id UUID NOT NULL REFERENCES brands(id),
  unit_id UUID NOT NULL REFERENCES copropiedad_units(id),
  -- Vote
  vote TEXT NOT NULL, -- 'favor', 'against', 'abstain'
  coeficiente NUMERIC(8,6) NOT NULL, -- Weight of this vote
  voted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vote_id, unit_id)
);

-- Meeting minutes (Actas)
CREATE TABLE IF NOT EXISTS copropiedad_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES copropiedad_meetings(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id),
  -- Acta info
  minute_number TEXT, -- "Acta 001 de 2026"
  content TEXT NOT NULL, -- Rich text / markdown content
  -- Approval
  status TEXT DEFAULT 'draft', -- draft, review, approved, signed
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  -- Signatures
  president_name TEXT,
  secretary_name TEXT,
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE copropiedad_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropiedad_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropiedad_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropiedad_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropiedad_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropiedad_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropiedad_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropiedad_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropiedad_vote_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE copropiedad_minutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY copropiedad_configs_brand ON copropiedad_configs USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY copropiedad_units_brand ON copropiedad_units USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY copropiedad_fees_brand ON copropiedad_fees USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY copropiedad_spaces_brand ON copropiedad_spaces USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY copropiedad_reservations_brand ON copropiedad_reservations USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY copropiedad_meetings_brand ON copropiedad_meetings USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY copropiedad_attendees_brand ON copropiedad_attendees USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY copropiedad_votes_brand ON copropiedad_votes USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY copropiedad_vote_records_brand ON copropiedad_vote_records USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY copropiedad_minutes_brand ON copropiedad_minutes USING (brand_id IN (SELECT brand_id FROM profiles WHERE id = auth.uid()));

-- Marketplace entry
INSERT INTO marketplace_modules (module_key, label, description, icon, color, price_monthly, features, trial_days, is_visible_to_brands, sort_order)
VALUES ('copropiedades', 'Copropiedades', 'Gestión integral de copropiedades: cuotas de administración, espacios comunes, asambleas con quorum y votaciones', 'Building', 'indigo', 89900,
  ARRAY['Gestión de inmuebles y coeficientes', 'Cuotas de administración con mora', 'Reserva de espacios comunes', 'Asambleas con validación de quorum', 'Sistema de votaciones por coeficiente', 'Actas de consejo y asamblea'],
  14, true, 9)
ON CONFLICT (module_key) DO NOTHING;
