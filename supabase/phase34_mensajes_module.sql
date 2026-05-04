-- ─── phase34: Add "mensajes" WhatsApp Templates as a paid marketplace module ──

-- Insert into marketplace_modules (skip if already exists)
INSERT INTO marketplace_modules (
  module_key, label, description, icon, color,
  price_monthly, price_per_user, price_per_user_amount,
  trial_days, is_visible_to_brands, is_coming_soon, sort_order,
  features
)
VALUES (
  'mensajes',
  'Mensajes WhatsApp',
  'Personaliza los mensajes automáticos de WhatsApp que se envían a tus clientes desde todos los módulos: citas, ventas, cotizaciones y reactivación de clientes.',
  'MessageSquare',
  'bg-green-500',
  49000,
  false,
  0,
  7,
  true,
  false,
  15,
  ARRAY[
    'Plantillas para confirmación y recordatorio de citas',
    'Mensajes de comprobante y cobro pendiente en ventas',
    'Envío y seguimiento de cotizaciones por WhatsApp',
    'Mensaje de reactivación para clientes inactivos',
    'Editor con variables dinámicas y vista previa tipo WhatsApp',
    'Plantillas base incluidas — personaliza a tu gusto'
  ]
)
ON CONFLICT (module_key) DO UPDATE SET
  label       = EXCLUDED.label,
  description = EXCLUDED.description,
  features    = EXCLUDED.features,
  price_monthly = EXCLUDED.price_monthly,
  sort_order  = EXCLUDED.sort_order;
