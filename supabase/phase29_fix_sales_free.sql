-- Fix: sales/ventas module should be free (price_monthly = 0)
-- Also normalize any 'ventas' module_key to 'sales'

UPDATE marketplace_modules
SET price_monthly = 0,
    trial_days = 0,
    label = 'Ventas e Inventario'
WHERE module_key IN ('sales', 'ventas');

-- If exists as 'ventas', rename to 'sales' for consistency
UPDATE marketplace_modules SET module_key = 'sales' WHERE module_key = 'ventas';

-- Also fix any stale module_subscriptions for sales/ventas with trial status
-- (they shouldn't have been created, mark as cancelled so they can be deleted)
UPDATE module_subscriptions
SET status = 'cancelled'
WHERE module_key IN ('sales', 'ventas')
  AND status IN ('trial', 'expired');
