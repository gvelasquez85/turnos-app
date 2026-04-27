-- ============================================================
-- Phase 25: Sales Module (Products, Quotes, Sales)
-- ============================================================

-- ── Products / Inventory ───────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id         UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
  name             VARCHAR(200) NOT NULL,
  sku              VARCHAR(100),
  description      TEXT,
  category         VARCHAR(100),
  price            NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost             NUMERIC(12,2) DEFAULT 0,
  stock            INT NOT NULL DEFAULT 0,
  min_stock        INT NOT NULL DEFAULT 0,
  unit             VARCHAR(50) NOT NULL DEFAULT 'unidad',
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS products_brand_id_idx ON products(brand_id);
CREATE INDEX IF NOT EXISTS products_sku_idx ON products(brand_id, sku) WHERE sku IS NOT NULL;

-- ── Sales / Quotes ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sales (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id         UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,
  type             VARCHAR(20) NOT NULL DEFAULT 'sale', -- 'sale' | 'quote'
  status           VARCHAR(30) NOT NULL DEFAULT 'completed',
  -- sale:  'completed' | 'cancelled'
  -- quote: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted'
  subtotal         NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total            NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sales_brand_id_idx    ON sales(brand_id);
CREATE INDEX IF NOT EXISTS sales_customer_id_idx ON sales(customer_id);
CREATE INDEX IF NOT EXISTS sales_type_idx        ON sales(brand_id, type);
CREATE INDEX IF NOT EXISTS sales_created_at_idx  ON sales(brand_id, created_at);

-- ── Sale Items ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sale_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id      UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(200) NOT NULL,        -- snapshot at time of sale
  product_sku  VARCHAR(100),
  qty          NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price   NUMERIC(12,2) NOT NULL,
  discount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total   NUMERIC(12,2) NOT NULL DEFAULT 0, -- qty * unit_price - discount
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx    ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_id_idx ON sale_items(product_id);

-- ── Stock movements ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stock_movements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  brand_id     UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type         VARCHAR(30) NOT NULL, -- 'sale' | 'purchase' | 'adjustment' | 'return'
  qty_change   INT NOT NULL,         -- negative = decrease, positive = increase
  qty_after    INT NOT NULL,
  reference_id UUID,                 -- sale_id or null
  notes        TEXT,
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stock_movements_product_idx ON stock_movements(product_id);

-- ── Add module to marketplace ──────────────────────────────

INSERT INTO marketplace_modules (
  module_key, label, description, icon, color,
  price_monthly, features, trial_days,
  is_visible_to_brands, is_coming_soon, sort_order
) VALUES (
  'sales',
  'Ventas e Inventario',
  'Gestiona tu inventario, crea cotizaciones y registra ventas. Controla el stock y el flujo de caja de tu negocio.',
  'ShoppingCart',
  'bg-emerald-500',
  80000,
  ARRAY[
    'Catálogo de productos con stock',
    'Cotizaciones que se convierten en ventas',
    'Control de inventario en tiempo real',
    'Reportes de ventas por período y sucursal'
  ],
  7,
  true,
  false,
  2
) ON CONFLICT (module_key) DO NOTHING;

-- ── RLS Policies ───────────────────────────────────────────

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Products: brand members can read; brand_admin/manager can write
CREATE POLICY "products_brand_read" ON products
  FOR SELECT USING (
    brand_id IN (
      SELECT brand_id FROM profiles WHERE id = auth.uid() AND brand_id IS NOT NULL
    )
  );

CREATE POLICY "products_brand_write" ON products
  FOR ALL USING (
    brand_id IN (
      SELECT brand_id FROM profiles
      WHERE id = auth.uid()
        AND role IN ('brand_admin', 'manager', 'superadmin')
    )
  );

-- Sales: same pattern
CREATE POLICY "sales_brand_read" ON sales
  FOR SELECT USING (
    brand_id IN (
      SELECT brand_id FROM profiles WHERE id = auth.uid() AND brand_id IS NOT NULL
    )
  );

CREATE POLICY "sales_brand_write" ON sales
  FOR ALL USING (
    brand_id IN (
      SELECT brand_id FROM profiles
      WHERE id = auth.uid()
        AND role IN ('brand_admin', 'manager', 'superadmin', 'advisor')
    )
  );

CREATE POLICY "sale_items_read" ON sale_items
  FOR SELECT USING (
    sale_id IN (SELECT id FROM sales WHERE brand_id IN (
      SELECT brand_id FROM profiles WHERE id = auth.uid() AND brand_id IS NOT NULL
    ))
  );

CREATE POLICY "sale_items_write" ON sale_items
  FOR ALL USING (
    sale_id IN (SELECT id FROM sales WHERE brand_id IN (
      SELECT brand_id FROM profiles
      WHERE id = auth.uid() AND role IN ('brand_admin', 'manager', 'superadmin', 'advisor')
    ))
  );

CREATE POLICY "stock_movements_read" ON stock_movements
  FOR SELECT USING (
    brand_id IN (
      SELECT brand_id FROM profiles WHERE id = auth.uid() AND brand_id IS NOT NULL
    )
  );

CREATE POLICY "stock_movements_write" ON stock_movements
  FOR ALL USING (
    brand_id IN (
      SELECT brand_id FROM profiles
      WHERE id = auth.uid() AND role IN ('brand_admin', 'manager', 'superadmin', 'advisor')
    )
  );

-- ── Trigger: updated_at ────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS sales_updated_at ON sales;
CREATE TRIGGER sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
