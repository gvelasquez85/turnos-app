-- Phase 31: Brand alerts table for home dashboard action suggestions

CREATE TABLE IF NOT EXISTS public.brand_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,  -- 'inactive_clients', 'open_quotes', 'low_stock'
  data JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, alert_type)
);

-- Index for fast lookups by brand
CREATE INDEX IF NOT EXISTS brand_alerts_brand_id_idx ON public.brand_alerts(brand_id);
CREATE INDEX IF NOT EXISTS brand_alerts_unresolved_idx ON public.brand_alerts(brand_id, resolved) WHERE resolved = FALSE;

-- RLS
ALTER TABLE public.brand_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_alerts: brand members read own"
  ON public.brand_alerts FOR SELECT
  USING (
    brand_id IN (
      SELECT brand_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "brand_alerts: service role all"
  ON public.brand_alerts FOR ALL
  USING (auth.role() = 'service_role');
