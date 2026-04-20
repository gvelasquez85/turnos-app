-- ============================================================
-- FASE 23: Migrar membresías en USD a COP
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Actualizar membresías que quedaron con billing_currency = 'USD'
UPDATE public.memberships
SET
  billing_currency       = 'COP',
  -- Limpiar montos históricos en USD para que el próximo ciclo recalcule en COP
  last_billing_amount    = NULL,
  -- Recalcular la próxima fecha si ya venció (dejarla como hoy + 1 mes)
  next_billing_at        = CASE
    WHEN next_billing_at IS NOT NULL AND next_billing_at < now()
    THEN now() + INTERVAL '1 month'
    ELSE next_billing_at
  END
WHERE billing_currency = 'USD'
   OR billing_currency IS NULL;

-- Verificar resultado
SELECT id, brand_id, billing_currency, billing_status, last_billing_amount, next_billing_at
FROM public.memberships
ORDER BY created_at DESC;
