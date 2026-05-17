-- ============================================================================
-- AI Copilot Module
-- ============================================================================

-- Config per brand: provider, BYOK key, preferences
CREATE TABLE IF NOT EXISTS ai_configs (
  brand_id          UUID PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
  provider          VARCHAR(20)  NOT NULL DEFAULT 'turnflow', -- 'turnflow' | 'openai' | 'anthropic'
  api_key_encrypted TEXT,                                      -- only for BYOK plans
  model_preference  VARCHAR(60)  NOT NULL DEFAULT 'claude-haiku-3-5', -- or 'gpt-4o-mini', 'gpt-4o', etc.
  daily_limit       INT          NOT NULL DEFAULT 5,           -- 5 free | 50 managed | 500 byok
  plan              VARCHAR(20)  NOT NULL DEFAULT 'free',      -- 'free' | 'managed' | 'byok'
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Daily usage counter for throttling (atomic upsert)
CREATE TABLE IF NOT EXISTS ai_usage (
  brand_id    UUID  NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  usage_date  DATE  NOT NULL DEFAULT CURRENT_DATE,
  query_count INT   NOT NULL DEFAULT 0,
  token_count INT   NOT NULL DEFAULT 0,
  PRIMARY KEY (brand_id, usage_date)
);

CREATE INDEX IF NOT EXISTS ai_usage_brand_date ON ai_usage (brand_id, usage_date);

-- RLS
ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_own_ai_config" ON ai_configs
  USING (brand_id IN (
    SELECT brand_id FROM profiles WHERE id = auth.uid()
    UNION SELECT id FROM brands WHERE id IN (
      SELECT brand_id FROM profiles WHERE id = auth.uid() AND role = 'superadmin'
    )
  ));

CREATE POLICY "brand_own_ai_usage" ON ai_usage
  USING (brand_id IN (
    SELECT brand_id FROM profiles WHERE id = auth.uid()
  ));

-- Service role bypass for API routes
CREATE POLICY "service_ai_config"  ON ai_configs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_ai_usage"   ON ai_usage   FOR ALL USING (auth.role() = 'service_role');

-- Marketplace entry
INSERT INTO marketplace_modules (
  module_key, label, description, icon, color,
  price_monthly, features, trial_days, is_visible_to_brands, sort_order
) VALUES (
  'ai_copilot',
  'Copilot IA',
  'Tu asistente de inteligencia artificial que entiende tu negocio. Obtén insights accionables según el módulo donde estés trabajando.',
  'Bot',
  'purple',
  39900,
  ARRAY[
    '50 consultas diarias',
    'Insights contextuales por módulo',
    'Historial de conversación (10 turnos)',
    'Powered by Claude Haiku / GPT-4o-mini',
    'Modo BYOK: usa tu propia API key por $19.900'
  ],
  7,
  true,
  0
) ON CONFLICT (module_key) DO NOTHING;

-- Atomic usage increment (avoids race conditions on concurrent requests)
CREATE OR REPLACE FUNCTION increment_ai_usage(p_brand_id UUID, p_date DATE)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO ai_usage (brand_id, usage_date, query_count)
  VALUES (p_brand_id, p_date, 1)
  ON CONFLICT (brand_id, usage_date)
  DO UPDATE SET query_count = ai_usage.query_count + 1
  RETURNING query_count INTO v_count;
  RETURN v_count;
END;
$$;
