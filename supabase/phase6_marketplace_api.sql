-- Module subscriptions (marketplace)
CREATE TABLE IF NOT EXISTS public.module_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial','active','expired','cancelled')),
  trial_started_at timestamptz DEFAULT now(),
  trial_expires_at timestamptz DEFAULT (now() + interval '7 days'),
  activated_at timestamptz,
  expires_at timestamptz,
  price_monthly numeric(10,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, module_key)
);
ALTER TABLE public.module_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "module_subscriptions: superadmin all" ON public.module_subscriptions
  FOR ALL USING (get_my_role() = 'superadmin');
CREATE POLICY "module_subscriptions: brand admin read own" ON public.module_subscriptions
  FOR SELECT USING (brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "module_subscriptions: brand admin insert own" ON public.module_subscriptions
  FOR INSERT WITH CHECK (brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "module_subscriptions: brand admin update own" ON public.module_subscriptions
  FOR UPDATE USING (brand_id IN (SELECT brand_id FROM public.profiles WHERE id = auth.uid()));

-- API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  key_prefix text NOT NULL,
  scopes text[] DEFAULT ARRAY['read'],
  last_used_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys: admin all" ON public.api_keys
  FOR ALL USING (get_my_role() IN ('superadmin','brand_admin','manager'));

-- Webhooks
CREATE TABLE IF NOT EXISTS public.webhooks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Mi webhook',
  url text NOT NULL,
  events text[] NOT NULL DEFAULT ARRAY['ticket.completed'],
  secret text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks: admin all" ON public.webhooks
  FOR ALL USING (get_my_role() IN ('superadmin','brand_admin','manager'));

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id uuid REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status_code int,
  success boolean DEFAULT false,
  delivered_at timestamptz DEFAULT now()
);
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_deliveries: admin read" ON public.webhook_deliveries
  FOR SELECT USING (get_my_role() IN ('superadmin','brand_admin','manager'));
CREATE POLICY "webhook_deliveries: service insert" ON public.webhook_deliveries
  FOR INSERT WITH CHECK (true);
