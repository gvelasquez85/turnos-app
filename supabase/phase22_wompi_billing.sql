-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 22: Wompi billing integration
-- Run this in the Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Wompi payment + billing state on memberships
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS wompi_payment_source_id  text,
  ADD COLUMN IF NOT EXISTS wompi_customer_email      text,
  ADD COLUMN IF NOT EXISTS billing_currency          text        NOT NULL DEFAULT 'COP',
  ADD COLUMN IF NOT EXISTS billing_anchor_day        smallint    DEFAULT 1,
  ADD COLUMN IF NOT EXISTS next_billing_at           timestamptz,
  ADD COLUMN IF NOT EXISTS last_billed_at            timestamptz,
  ADD COLUMN IF NOT EXISTS last_billing_amount       bigint,        -- en centavos
  ADD COLUMN IF NOT EXISTS billing_status            text        NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS past_due_since            timestamptz,
  ADD COLUMN IF NOT EXISTS past_due_attempts         smallint    NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS past_due_last_attempt_at  timestamptz;

ALTER TABLE public.memberships
  DROP CONSTRAINT IF EXISTS memberships_billing_status_check;
ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_billing_status_check
    CHECK (billing_status IN ('none','active','past_due','suspended'));

ALTER TABLE public.memberships
  DROP CONSTRAINT IF EXISTS memberships_billing_currency_check;
ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_billing_currency_check
    CHECK (billing_currency IN ('COP','USD'));

-- ─────────────────────────────────────────────────────────────────────────────
-- Registro de transacciones de facturación
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.billing_transactions (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id              uuid        NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  membership_id         uuid        REFERENCES public.memberships(id),
  wompi_transaction_id  text,
  wompi_reference       text        UNIQUE,
  amount                bigint      NOT NULL,   -- centavos (COP×100 | USD×100)
  currency              text        NOT NULL DEFAULT 'COP',
  status                text        NOT NULL DEFAULT 'pending',
  --  pending | approved | declined | voided | error
  payment_source_id     integer,
  customer_email        text,
  error_reason          text,
  period_start          date,
  period_end            date,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE public.billing_transactions
  DROP CONSTRAINT IF EXISTS billing_txn_status_check;
ALTER TABLE public.billing_transactions
  ADD CONSTRAINT billing_txn_status_check
    CHECK (status IN ('pending','approved','declined','voided','error'));

CREATE UNIQUE INDEX IF NOT EXISTS billing_txn_wompi_id_idx
  ON public.billing_transactions(wompi_transaction_id)
  WHERE wompi_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS billing_txn_brand_id_idx  ON public.billing_transactions(brand_id);
CREATE INDEX IF NOT EXISTS billing_txn_status_idx    ON public.billing_transactions(status);
CREATE INDEX IF NOT EXISTS billing_txn_created_idx   ON public.billing_transactions(created_at DESC);

-- RLS: solo service_role (nunca desde el cliente)
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_only_billing_txn" ON public.billing_transactions;
CREATE POLICY "service_only_billing_txn" ON public.billing_transactions
  USING (false) WITH CHECK (false);
