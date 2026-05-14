-- ============================================================================
-- MODULE: Contabilidad NIIF
-- Independent accounting module — reads from sales/customers but never writes to them
-- ============================================================================

-- ── Chart of Accounts (PUC) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  code TEXT NOT NULL,                     -- e.g. '110505' (hierarchical PUC code)
  parent_code TEXT,                       -- e.g. '1105' (null for top-level classes)
  name TEXT NOT NULL,                     -- e.g. 'Caja General'
  class INTEGER NOT NULL CHECK (class BETWEEN 1 AND 9),
  -- 1=Activos, 2=Pasivos, 3=Patrimonio, 4=Ingresos, 5=Gastos, 6=Costos de venta
  nature TEXT NOT NULL CHECK (nature IN ('debit', 'credit')),
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 6),
  -- 1=clase, 2=grupo, 3=cuenta, 4=subcuenta, 5=auxiliar, 6=sub-auxiliar
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false,   -- PUC seed accounts cannot be deleted
  allows_movement BOOLEAN NOT NULL DEFAULT true, -- only leaf accounts allow journal lines
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_id, code)
);

CREATE INDEX IF NOT EXISTS idx_accounts_brand ON public.accounts(brand_id);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON public.accounts(brand_id, parent_code);

-- ── Accounting Periods ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.accounting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_id, year, month)
);

-- ── Cost Centers (optional) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brand_id, code)
);

-- ── Journal Entries (header) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.accounting_periods(id),
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  -- Source traceability (reads from other modules, never writes)
  source_type TEXT,                       -- 'sale', 'purchase', 'manual', 'adjustment', 'invoice'
  source_id UUID,                         -- FK to originating record (informational only)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'voided')),
  created_by UUID REFERENCES auth.users(id),
  posted_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  voided_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_brand ON public.journal_entries(brand_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_period ON public.journal_entries(period_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(brand_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON public.journal_entries(source_type, source_id);

-- ── Journal Entry Lines (double-entry) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL,
  account_code TEXT NOT NULL,
  debit NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  description TEXT,
  cost_center_id UUID REFERENCES public.cost_centers(id),
  third_party_nit TEXT,                   -- NIT/CC of the third party (customer/supplier)
  third_party_name TEXT,
  CHECK (NOT (debit > 0 AND credit > 0)), -- a line is debit XOR credit
  CHECK (debit > 0 OR credit > 0),        -- at least one must be > 0
  FOREIGN KEY (brand_id, account_code) REFERENCES public.accounts(brand_id, code)
);

CREATE INDEX IF NOT EXISTS idx_jel_entry ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_jel_account ON public.journal_entry_lines(brand_id, account_code);

-- ── Tax Configuration ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.accounting_tax_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  tax_type TEXT NOT NULL,                 -- 'iva_19', 'iva_5', 'iva_0', 'retefuente', 'reteica', 'reteiva'
  rate NUMERIC(5,2) NOT NULL,
  debit_account_code TEXT NOT NULL,       -- account code for this tax (debit side)
  credit_account_code TEXT NOT NULL,      -- account code for this tax (credit side)
  applies_to TEXT DEFAULT 'all',          -- 'all', 'services', 'goods'
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(brand_id, tax_type, rate)
);

-- ── Accounting Module Settings ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.accounting_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
  auto_entries_on_sale BOOLEAN NOT NULL DEFAULT false,  -- auto-generate journal from sales
  auto_entries_on_invoice BOOLEAN NOT NULL DEFAULT false, -- auto-generate from e-invoices
  default_sales_account TEXT DEFAULT '4135',             -- Comercio al por mayor y menor
  default_cost_account TEXT DEFAULT '6135',              -- Costos de mercancía
  default_cash_account TEXT DEFAULT '1105',              -- Caja
  default_bank_account TEXT DEFAULT '1110',              -- Bancos
  default_ar_account TEXT DEFAULT '1305',                -- Clientes (cuentas por cobrar)
  default_tax_account TEXT DEFAULT '2408',               -- IVA por pagar
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Balance enforcement trigger ──────────────────────────────────────────────
-- Prevents posting unbalanced journal entries
CREATE OR REPLACE FUNCTION check_journal_balance()
RETURNS TRIGGER AS $$
DECLARE
  total_debit NUMERIC(15,2);
  total_credit NUMERIC(15,2);
  entry_status TEXT;
BEGIN
  -- Only enforce on posted entries
  SELECT status INTO entry_status FROM public.journal_entries WHERE id = NEW.id;
  IF entry_status != 'posted' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
  INTO total_debit, total_credit
  FROM public.journal_entry_lines
  WHERE journal_entry_id = NEW.id;

  IF ABS(total_debit - total_credit) > 0.01 THEN
    RAISE EXCEPTION 'El asiento contable no está balanceado. Débitos: %, Créditos: %', total_debit, total_credit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_check_journal_balance
  AFTER UPDATE OF status ON public.journal_entries
  FOR EACH ROW
  WHEN (NEW.status = 'posted')
  EXECUTE FUNCTION check_journal_balance();

-- ── RLS Policies ─────────────────────────────────────────────────────────────
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_tax_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_settings ENABLE ROW LEVEL SECURITY;

-- Accounts
CREATE POLICY "accounts_brand_read" ON public.accounts FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "accounts_brand_write" ON public.accounts FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Periods
CREATE POLICY "periods_brand_read" ON public.accounting_periods FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "periods_brand_write" ON public.accounting_periods FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Cost Centers
CREATE POLICY "cost_centers_brand_read" ON public.cost_centers FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "cost_centers_brand_write" ON public.cost_centers FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Journal Entries
CREATE POLICY "je_brand_read" ON public.journal_entries FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "je_brand_write" ON public.journal_entries FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Journal Entry Lines
CREATE POLICY "jel_brand_read" ON public.journal_entry_lines FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "jel_brand_write" ON public.journal_entry_lines FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Tax Configs
CREATE POLICY "tax_configs_brand_read" ON public.accounting_tax_configs FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "tax_configs_brand_write" ON public.accounting_tax_configs FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

-- Settings
CREATE POLICY "acct_settings_brand_read" ON public.accounting_settings FOR SELECT
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));

CREATE POLICY "acct_settings_brand_write" ON public.accounting_settings FOR ALL
  USING (brand_id IN (
    SELECT brand_id FROM public.profiles WHERE id = auth.uid() AND role IN ('brand_admin', 'manager')
  ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin'));
