-- Phase 8: Public API keys + Webhook endpoints
-- Run in Supabase SQL editor

-- ─── API Keys ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name          text NOT NULL DEFAULT 'Clave principal',
  key_prefix    text NOT NULL,          -- first 16 chars for display  (e.g. "ta_a1b2c3d4e5f6g7h")
  key_hash      text NOT NULL UNIQUE,   -- sha256(full_key) – never stored in plain text
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_used_at  timestamptz
);

-- ─── Webhook endpoints ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  event      text NOT NULL CHECK (event IN ('ticket.created','ticket.attended','ticket.done','ticket.cancelled')),
  url        text NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, event)
);

-- ─── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE api_keys          ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- brand_admin + manager can manage their own brand's keys/webhooks
CREATE POLICY "brand can manage api_keys"
  ON api_keys FOR ALL
  USING (
    brand_id IN (
      SELECT brand_id FROM profiles
      WHERE id = auth.uid() AND role IN ('brand_admin','manager','superadmin')
    )
  );

CREATE POLICY "brand can manage webhook_endpoints"
  ON webhook_endpoints FOR ALL
  USING (
    brand_id IN (
      SELECT brand_id FROM profiles
      WHERE id = auth.uid() AND role IN ('brand_admin','manager','superadmin')
    )
  );

-- service role bypasses RLS automatically — used by /api/v1/* routes
