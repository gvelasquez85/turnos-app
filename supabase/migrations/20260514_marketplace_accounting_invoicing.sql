-- ============================================================================
-- Register both modules in marketplace
-- ============================================================================

-- Contabilidad NIIF
INSERT INTO marketplace_modules (module_key, label, description, icon, color, price_monthly, features, trial_days, is_visible_to_brands, sort_order)
VALUES (
  'contabilidad',
  'Contabilidad NIIF',
  'Sistema contable completo con Plan Único de Cuentas (PUC), partida doble, generación automática de asientos desde ventas y reportes financieros compatibles con DIAN.',
  'Calculator',
  'emerald',
  49900,
  ARRAY[
    'Plan Único de Cuentas (PUC) estándar',
    'Asientos contables en partida doble',
    'Generación automática desde ventas',
    'Balance General y Estado de Resultados',
    'Libro Mayor y Libro Diario',
    'Balance de Comprobación',
    'Centros de costo',
    'Cierre de períodos contables',
    'Compatible con NIIF para PYMES'
  ],
  14,
  true,
  10
)
ON CONFLICT (module_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features;

-- Facturación Electrónica
INSERT INTO marketplace_modules (module_key, label, description, icon, color, price_monthly, features, trial_days, is_visible_to_brands, sort_order)
VALUES (
  'facturacion',
  'Facturación Electrónica DIAN',
  'Emite facturas electrónicas de venta, notas crédito y débito directamente a la DIAN. Incluye firma digital, generación de CUFE y representación gráfica PDF.',
  'FileCheck',
  'blue',
  79900,
  ARRAY[
    'Factura electrónica de venta (UBL 2.1)',
    'Notas crédito y débito',
    'Firma digital XAdES integrada',
    'Transmisión directa a DIAN',
    'Generación automática de CUFE',
    'PDF con código QR',
    'Gestión de resoluciones de numeración',
    'Consecutivos automáticos',
    'Configuración fiscal completa',
    'Log de transmisiones DIAN',
    'Ambiente de habilitación incluido',
    'API para sistemas externos'
  ],
  14,
  true,
  11
)
ON CONFLICT (module_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features;
