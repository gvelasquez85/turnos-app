-- ─── phase35: Add "queue" as a paid marketplace module ───────────────────────

INSERT INTO marketplace_modules (
  module_key, label, description, icon, color,
  price_monthly, price_per_user, price_per_user_amount,
  trial_days, is_visible_to_brands, is_coming_soon, sort_order,
  features
)
VALUES (
  'queue',
  'Colas de espera',
  'Panel de asesores en tiempo real, pantalla TV de llamado por QR, reportes de tiempos de espera y gestión de turnos por sucursal.',
  'Clock',
  'bg-indigo-500',
  70000,
  false,
  0,
  7,
  true,
  false,
  1,
  ARRAY[
    'Cola virtual por QR — sin filas físicas',
    'Panel de asesores en tiempo real',
    'Pantalla TV de llamado incluida',
    'Reportes y analítica de tiempos de espera',
    'Control de colas por sucursal',
    'Campos personalizados por asesor'
  ]
)
ON CONFLICT (module_key) DO UPDATE SET
  label         = EXCLUDED.label,
  description   = EXCLUDED.description,
  features      = EXCLUDED.features,
  price_monthly = EXCLUDED.price_monthly,
  sort_order    = EXCLUDED.sort_order;
