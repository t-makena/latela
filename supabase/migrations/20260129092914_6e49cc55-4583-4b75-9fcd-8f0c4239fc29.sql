-- Create canonical_products table
CREATE TABLE canonical_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  quantity_value NUMERIC,
  quantity_unit TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create product_offers table
CREATE TABLE product_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_product_id UUID REFERENCES canonical_products(id) ON DELETE CASCADE,
  store TEXT NOT NULL CHECK (store IN ('pnp', 'checkers', 'shoprite', 'woolworths')),
  price_cents INTEGER NOT NULL,
  unit_price_cents INTEGER,
  product_url TEXT,
  in_stock BOOLEAN DEFAULT true,
  on_sale BOOLEAN DEFAULT false,
  promotion_text TEXT,
  scraped_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(canonical_product_id, store)
);

-- Create price_history table
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_product_id UUID REFERENCES canonical_products(id) ON DELETE CASCADE,
  store TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS with public read access
ALTER TABLE canonical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON canonical_products FOR SELECT USING (true);
CREATE POLICY "Public read access" ON product_offers FOR SELECT USING (true);
CREATE POLICY "Public read access" ON price_history FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_canonical_products_name ON canonical_products USING gin(to_tsvector('english', name));
CREATE INDEX idx_canonical_products_brand ON canonical_products(brand);
CREATE INDEX idx_canonical_products_category ON canonical_products(category);
CREATE INDEX idx_product_offers_store ON product_offers(store);
CREATE INDEX idx_product_offers_price ON product_offers(price_cents);
CREATE INDEX idx_price_history_product ON price_history(canonical_product_id);
CREATE INDEX idx_price_history_recorded ON price_history(recorded_at);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_canonical_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_canonical_products_timestamp
  BEFORE UPDATE ON canonical_products
  FOR EACH ROW
  EXECUTE FUNCTION update_canonical_products_updated_at();

-- Search function for products
CREATE OR REPLACE FUNCTION search_products(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  name TEXT,
  brand TEXT,
  category TEXT,
  quantity_value NUMERIC,
  quantity_unit TEXT,
  image_url TEXT,
  offers JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.name,
    cp.brand,
    cp.category,
    cp.quantity_value,
    cp.quantity_unit,
    cp.image_url,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'store', po.store,
          'price_cents', po.price_cents,
          'unit_price_cents', po.unit_price_cents,
          'in_stock', po.in_stock,
          'on_sale', po.on_sale,
          'promotion_text', po.promotion_text,
          'product_url', po.product_url
        ) ORDER BY po.price_cents ASC
      ) FILTER (WHERE po.id IS NOT NULL),
      '[]'::jsonb
    ) as offers
  FROM canonical_products cp
  LEFT JOIN product_offers po ON po.canonical_product_id = cp.id
  WHERE 
    cp.name ILIKE '%' || search_query || '%' OR
    cp.brand ILIKE '%' || search_query || '%'
  GROUP BY cp.id
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;