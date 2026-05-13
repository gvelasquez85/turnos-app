-- Add lead_forms as a paid marketplace module
INSERT INTO marketplace_modules (module_key, label, description, icon, color, price_monthly, features, trial_days, is_visible_to_brands, sort_order)
VALUES (
  'lead_forms',
  'Formularios de captura',
  'Crea formularios personalizados para capturar leads desde pautas, redes sociales o tu pagina web. Los contactos se agregan automaticamente a tu base de clientes.',
  'FileText',
  'indigo',
  19900,
  ARRAY['Formularios ilimitados', 'Campos personalizables', 'Enlace directo para pautas', 'Codigo embed para sitios web', 'Leads directo a tu CRM'],
  7,
  true,
  8
)
ON CONFLICT (module_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features;
