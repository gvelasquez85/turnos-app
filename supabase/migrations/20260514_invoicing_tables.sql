-- ============================================================================
-- MODULE: Facturación Electrónica DIAN
-- Independent invoicing module — reads from sales/customers but never writes to them
-- ============================================================================

-- ── Customer Fiscal Data (extends customer info without touching customers table) ──
CREATE TABLE IF NOT EXISTS public.customer_fiscal_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  -- Identification
  document_type_code TEXT NOT NULL DEFAULT '13' REFERENCES public.dian_document_types(code),
  document_number TEXT NOT NULL,
  dv INTEGER CHECK (dv BETWEEN 0 AND 9),            -- only for NIT
  -- Fiscal info
  tipo_persona TEXT NOT NULL DEFAULT 'natural' CHECK (tipo_persona IN ('juridica', 'natural')),
  razon_social TEXT,                                  -- for juridica, formal name
  regimen_fiscal TEXT,                                -- '48' = Resp IVA, '49' = No resp
  tax_responsibilities TEXT[] DEFAULT '{}',           -- codes from dian_tax_responsibilities
  -- Address (DIAN format)
  department_code TEXT REFERENCES public.dian_departments(code),
  municipality_code TEXT REFERENCES public.dian_municipalities(code),
  direccion TEXT,
  -- Contact (may differ from customers table)
  fiscal_email TEXT,
  fiscal_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(customer_id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_cfd_customer ON public.customer_fiscal_data(customer_id);
CREATE INDEX IF NOT EXISTS idx_cfd_brand ON public.customer_fiscal_data(brand_id);

-- ── Fiscal Configuration per Brand ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fiscal_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
  -- Company identification
  nit TEXT NOT NULL,
  dv INTEGER NOT NULL CHECK (dv BETWEEN 0 AND 9),
  razon_social TEXT NOT NULL,
  nombre_comercial TEXT,
  tipo_persona TEXT NOT NULL CHECK (tipo_persona IN ('juridica', 'natural')),
  -- Tax profile
  regimen_fiscal TEXT NOT NULL,                       -- '48', '49', 'O-47'
  tax_responsibilities TEXT[] NOT NULL DEFAULT '{}',
  ciiu_code TEXT NOT NULL,
  -- Fiscal address
  department_code TEXT NOT NULL REFERENCES public.dian_departments(code),
  municipality_code TEXT NOT NULL REFERENCES public.dian_municipalities(code),
  direccion TEXT NOT NULL,
  -- Contact
  email TEXT NOT NULL,
  phone TEXT,
  -- DIAN software registration
  software_id TEXT,
  software_pin TEXT,
  test_set_id TEXT,
  -- Digital certificate
  certificate_storage_path TEXT,                      -- path in Supabase Storage (private bucket)
  certificate_password_encrypted TEXT,                -- AES-encrypted password
  certificate_expires_at TIMESTAMPTZ,
  certificate_issuer TEXT,                            -- e.g. 'Certicámara', 'Andes SCD'
  -- Environment
  environment TEXT NOT NULL DEFAULT 'habilitacion' CHECK (environment IN ('habilitacion', 'produccion')),
  -- Status
  habilitacion_status TEXT DEFAULT 'pending' CHECK (habilitacion_status IN ('pending', 'in_progress', 'approved', 'rejected')),
  habilitacion_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Invoice Resolutions (Resoluciones de numeración) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  resolution_number TEXT NOT NULL,
  resolution_date DATE NOT NULL,
  prefix TEXT NOT NULL DEFAULT '',
  range_from BIGINT NOT NULL,
  range_to BIGINT NOT NULL,
  current_number BIGINT NOT NULL,                     -- next number to assign
  technical_key TEXT NOT NULL,                        -- clave técnica DIAN
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'invoice' CHECK (document_type IN ('invoice', 'credit_note', 'debit_note', 'support_document')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  exhausted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (range_from <= range_to),
  CHECK (current_number >= range_from AND current_number <= range_to + 1)
);

CREATE INDEX IF NOT EXISTS idx_resolutions_brand ON public.invoice_resolutions(brand_id);
CREATE INDEX IF NOT EXISTS idx_resolutions_active ON public.invoice_resolutions(brand_id, document_type, is_active);

-- ── Electronic Documents ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.electronic_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  -- Document identification
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'credit_note', 'debit_note', 'support_document')),
  resolution_id UUID REFERENCES public.invoice_resolutions(id),
  prefix TEXT NOT NULL DEFAULT '',
  number BIGINT NOT NULL,
  full_number TEXT GENERATED ALWAYS AS (prefix || number::TEXT) STORED,
  -- Dates
  issue_date DATE NOT NULL,
  issue_time TIME NOT NULL DEFAULT LOCALTIME,
  due_date DATE,
  -- Customer
  customer_id UUID REFERENCES public.customers(id),
  customer_fiscal_id UUID REFERENCES public.customer_fiscal_data(id),
  customer_document_type TEXT NOT NULL,
  customer_document_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  -- Amounts
  subtotal NUMERIC(15,2) NOT NULL,
  total_discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_tax NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_withholdings NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  exchange_rate NUMERIC(10,4) DEFAULT 1.0000,
  -- Payment
  payment_method_code TEXT REFERENCES public.dian_payment_methods(code),
  payment_means_code TEXT REFERENCES public.dian_payment_means(code),
  payment_due_date DATE,
  -- References (for credit/debit notes)
  referenced_document_id UUID REFERENCES public.electronic_documents(id),
  correction_concept_code TEXT,                       -- DIAN correction concept
  correction_reason TEXT,
  -- DIAN validation
  cufe TEXT,                                          -- CUFE for invoices, CUDE for notes
  qr_data TEXT,                                       -- QR code content
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'generated', 'signed', 'sent', 'accepted', 'rejected', 'error'
  )),
  dian_track_id TEXT,                                 -- ZipKey / trackId
  dian_response_code TEXT,
  dian_response_message TEXT,
  dian_validated_at TIMESTAMPTZ,
  -- File references (Supabase Storage)
  xml_unsigned_path TEXT,
  xml_signed_path TEXT,
  pdf_path TEXT,
  attached_document_path TEXT,                        -- AttachedDocument XML
  -- Relations to other modules (informational, read-only)
  sale_id UUID,                                       -- from sales table (no FK to keep independence)
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_id, prefix, number)
);

CREATE INDEX IF NOT EXISTS idx_edocs_brand ON public.electronic_documents(brand_id);
CREATE INDEX IF NOT EXISTS idx_edocs_status ON public.electronic_documents(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_edocs_date ON public.electronic_documents(brand_id, issue_date);
CREATE INDEX IF NOT EXISTS idx_edocs_customer ON public.electronic_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_edocs_cufe ON public.electronic_documents(cufe);
CREATE INDEX IF NOT EXISTS idx_edocs_sale ON public.electronic_documents(sale_id);

-- ── Document Line Items ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.electronic_document_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.electronic_documents(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  -- Product reference (informational)
  product_id UUID,                                    -- from products table (no FK)
  -- Item details
  description TEXT NOT NULL,
  code TEXT,                                          -- product code / SKU
  quantity NUMERIC(10,3) NOT NULL,
  unit_code TEXT NOT NULL DEFAULT 'NAR' REFERENCES public.dian_units_of_measure(code),
  unit_price NUMERIC(15,2) NOT NULL,
  -- Discounts
  discount_rate NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  -- Taxes per line
  tax_type_code TEXT REFERENCES public.dian_tax_types(code),
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_base NUMERIC(15,2) DEFAULT 0,
  tax_amount NUMERIC(15,2) DEFAULT 0,
  -- Withholdings per line (retenciones)
  withholding_type_code TEXT,
  withholding_rate NUMERIC(5,2) DEFAULT 0,
  withholding_amount NUMERIC(15,2) DEFAULT 0,
  -- Total
  line_total NUMERIC(15,2) NOT NULL,
  UNIQUE(document_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_edi_document ON public.electronic_document_items(document_id);

-- ── Document Tax Summary ─────────────────────────────────────────────────────
-- Aggregated tax per type per document (required by UBL 2.1)
CREATE TABLE IF NOT EXISTS public.electronic_document_taxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.electronic_documents(id) ON DELETE CASCADE,
  tax_type_code TEXT NOT NULL REFERENCES public.dian_tax_types(code),
  tax_rate NUMERIC(5,2) NOT NULL,
  taxable_base NUMERIC(15,2) NOT NULL,
  tax_amount NUMERIC(15,2) NOT NULL,
  is_withholding BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(document_id, tax_type_code, tax_rate, is_withholding)
);

-- ── DIAN Transmission Log ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dian_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.electronic_documents(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id),
  direction TEXT NOT NULL CHECK (direction IN ('send', 'query', 'test_set')),
  method TEXT NOT NULL,                               -- 'SendBillSync', 'GetStatus', etc.
  endpoint TEXT NOT NULL,
  request_xml TEXT,
  response_xml TEXT,
  http_status INTEGER,
  success BOOLEAN,
  track_id TEXT,
  error_code TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transmissions_doc ON public.dian_transmissions(document_id);
CREATE INDEX IF NOT EXISTS idx_transmissions_brand ON public.dian_transmissions(brand_id, created_at DESC);

-- ── Consecutive Number Assignment (atomic) ───────────────────────────────────
-- Function to safely assign next consecutive number
CREATE OR REPLACE FUNCTION assign_next_consecutive(p_resolution_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_number BIGINT;
BEGIN
  UPDATE public.invoice_resolutions
  SET current_number = current_number + 1,
      exhausted = CASE WHEN current_number >= range_to THEN true ELSE false END
  WHERE id = p_resolution_id
    AND current_number <= range_to
    AND is_active = true
  RETURNING current_number - 1 INTO v_number;

  IF v_number IS NULL THEN
    RAISE EXCEPTION 'No hay consecutivos disponibles en esta resolución. Verifique que la resolución esté activa y tenga números disponibles.';
  END IF;

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- ── RLS Policies ─────────────────────────────────────────────────────────────
ALTER TABLE public.customer_fiscal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electronic_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electronic_document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electronic_document_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dian_transmissions ENABLE ROW LEVEL SECURITY;

-- Customer fiscal data
CREATE POLICY "cfd_brand_read" ON public.customer_fiscal_data FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "cfd_brand_write" ON public.customer_fiscal_data FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Fiscal configs
CREATE POLICY "fc_brand_read" ON public.fiscal_configs FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "fc_brand_write" ON public.fiscal_configs FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Resolutions
CREATE POLICY "res_brand_read" ON public.invoice_resolutions FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "res_brand_write" ON public.invoice_resolutions FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Electronic documents
CREATE POLICY "edoc_brand_read" ON public.electronic_documents FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "edoc_brand_write" ON public.electronic_documents FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Document items
CREATE POLICY "edi_read" ON public.electronic_document_items FOR SELECT
  USING (document_id IN (
    SELECT id FROM public.electronic_documents WHERE brand_id IN (
      SELECT brand_id FROM public.profiles WHERE id = auth.uid()
    )
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "edi_write" ON public.electronic_document_items FOR ALL
  USING (document_id IN (
    SELECT id FROM public.electronic_documents WHERE brand_id IN (
      SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
    )
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Document taxes
CREATE POLICY "edt_read" ON public.electronic_document_taxes FOR SELECT
  USING (document_id IN (
    SELECT id FROM public.electronic_documents WHERE brand_id IN (
      SELECT brand_id FROM public.profiles WHERE id = auth.uid()
    )
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "edt_write" ON public.electronic_document_taxes FOR ALL
  USING (document_id IN (
    SELECT id FROM public.electronic_documents WHERE brand_id IN (
      SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
    )
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Transmissions
CREATE POLICY "tx_brand_read" ON public.dian_transmissions FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "tx_brand_write" ON public.dian_transmissions FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));
