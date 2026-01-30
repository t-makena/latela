-- ============================================
-- Latela: Product Offers Table
-- Stores scraped product prices from SA retailers
-- ============================================

-- Create product_offers table
CREATE TABLE IF NOT EXISTS product_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Store identification
  store TEXT NOT NULL,                          -- 'Checkers', 'Pick n Pay', etc.
  store_product_code TEXT NOT NULL,             -- Store's internal product code
  
  -- Product details
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Pricing (stored in cents for precision)
  price_cents INTEGER NOT NULL,
  original_price_cents INTEGER,                 -- Original price if on sale
  on_sale BOOLEAN DEFAULT FALSE,
  promotion_text TEXT,                          -- e.g., "Buy 2 for R50"
  
  -- Availability
  in_stock BOOLEAN DEFAULT TRUE,
  
  -- Media
  image_url TEXT,
  product_url TEXT,
  
  -- Timestamps
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint for upserts
  CONSTRAINT unique_store_product UNIQUE (store, store_product_code)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_offers_store ON product_offers(store);
CREATE INDEX IF NOT EXISTS idx_product_offers_category ON product_offers(category);
CREATE INDEX IF NOT EXISTS idx_product_offers_on_sale ON product_offers(on_sale) WHERE on_sale = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_offers_name_search ON product_offers USING gin(to_tsvector('english', product_name));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_product_offers_updated_at
  BEFORE UPDATE ON product_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Price History Table (tracks price changes)
-- ============================================

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_offer_id UUID NOT NULL REFERENCES product_offers(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL,
  original_price_cents INTEGER,
  on_sale BOOLEAN DEFAULT FALSE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_offer_id);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(recorded_at);

-- ============================================
-- RLS Policies (public read, service write)
-- ============================================

ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Anyone can read product offers
CREATE POLICY "Public read access" ON product_offers
  FOR SELECT USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role write access" ON product_offers
  FOR ALL USING (auth.role() = 'service_role');

-- Price history policies
CREATE POLICY "Public read access" ON price_history
  FOR SELECT USING (true);

CREATE POLICY "Service role write access" ON price_history
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- Helpful Views
-- ============================================

-- View: Current specials
CREATE OR REPLACE VIEW current_specials AS
SELECT 
  store,
  product_name,
  brand,
  category,
  price_cents / 100.0 AS price_rands,
  original_price_cents / 100.0 AS original_price_rands,
  ROUND((1 - (price_cents::NUMERIC / NULLIF(original_price_cents, 0))) * 100) AS discount_percent,
  promotion_text,
  image_url,
  product_url,
  last_seen_at
FROM product_offers
WHERE on_sale = TRUE
  AND last_seen_at > NOW() - INTERVAL '7 days'
ORDER BY discount_percent DESC NULLS LAST;

-- View: Price comparison across stores
CREATE OR REPLACE VIEW price_comparison AS
SELECT 
  product_name,
  brand,
  category,
  jsonb_agg(
    jsonb_build_object(
      'store', store,
      'price_rands', price_cents / 100.0,
      'on_sale', on_sale,
      'url', product_url
    ) ORDER BY price_cents
  ) AS store_prices,
  MIN(price_cents) / 100.0 AS lowest_price,
  MAX(price_cents) / 100.0 AS highest_price
FROM product_offers
WHERE last_seen_at > NOW() - INTERVAL '7 days'
GROUP BY product_name, brand, category
HAVING COUNT(DISTINCT store) > 1;
