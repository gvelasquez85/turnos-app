-- Phase 10: CRM customers + comms campaigns
-- Run in Supabase SQL editor

-- ── Customers table ──────────────────────────────────────────────────────────
-- Tracks unique customers per brand; linked to tickets via phone or document.
CREATE TABLE IF NOT EXISTS customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name            text NOT NULL,
  phone           text,
  email           text,
  document_id     text,                     -- cedula / passport / etc.
  notes           text,
  first_visit_at  timestamptz NOT NULL DEFAULT now(),
  last_visit_at   timestamptz NOT NULL DEFAULT now(),
  total_visits    int NOT NULL DEFAULT 1,
  establishment_ids uuid[] NOT NULL DEFAULT '{}',  -- distinct establishments visited
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Partial unique indexes so ON CONFLICT works with nullable columns
CREATE UNIQUE INDEX IF NOT EXISTS customers_brand_phone_idx
  ON customers (brand_id, phone) WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_brand_document_idx
  ON customers (brand_id, document_id) WHERE document_id IS NOT NULL;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand access" ON customers
  FOR ALL USING (
    brand_id IN (
      SELECT brand_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ── Update customer on ticket ─────────────────────────────────────────────────
-- When a ticket transitions to in_progress or done, upsert customer record.
CREATE OR REPLACE FUNCTION upsert_customer_from_ticket()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_brand_id uuid;
BEGIN
  -- Only trigger when status changes to in_progress or done
  IF NEW.status NOT IN ('in_progress', 'done') THEN
    RETURN NEW;
  END IF;
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get brand_id from establishment
  SELECT e.brand_id INTO v_brand_id
  FROM establishments e WHERE e.id = NEW.establishment_id;

  IF v_brand_id IS NULL THEN RETURN NEW; END IF;

  -- Try to match by phone (if ticket has phone field), else by name
  INSERT INTO customers (brand_id, name, phone, first_visit_at, last_visit_at, total_visits, establishment_ids)
  VALUES (
    v_brand_id,
    NEW.customer_name,
    NEW.customer_phone,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.created_at, now()),
    1,
    ARRAY[NEW.establishment_id]
  )
  ON CONFLICT (brand_id, phone) WHERE phone IS NOT NULL
  DO UPDATE SET
    last_visit_at = EXCLUDED.last_visit_at,
    total_visits  = customers.total_visits + 1,
    establishment_ids = (
      SELECT ARRAY(SELECT DISTINCT unnest(customers.establishment_ids || EXCLUDED.establishment_ids))
    ),
    name = CASE WHEN customers.name = customers.name THEN EXCLUDED.name ELSE customers.name END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_upsert_customer ON tickets;
CREATE TRIGGER trg_upsert_customer
  AFTER UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION upsert_customer_from_ticket();

-- ── Comms campaigns log ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comms_campaigns (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   uuid REFERENCES brands(id) ON DELETE CASCADE,
  subject    text NOT NULL,
  sent_to    int NOT NULL DEFAULT 0,
  failed     int NOT NULL DEFAULT 0,
  sent_by    uuid REFERENCES profiles(id),
  sent_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comms_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin only" ON comms_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- Add customer_phone to tickets if not present
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS customer_phone text;
