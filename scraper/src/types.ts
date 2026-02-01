/**
 * Latela Price Scraper - Type Definitions
 */

// Base product interface used by all scrapers
export interface PnPProduct {
  code: string;
  name: string;
  brand?: string;
  price_cents: number;
  original_price_cents?: number;
  unit_price_cents?: number;
  category: string;
  subcategory?: string;
  on_sale: boolean;
  promotion_text?: string;
  image_url?: string;
  product_url?: string;
  in_stock: boolean;
  scraped_at: Date;
}

// Supabase product_offers table format
export interface SupabaseProductOffer {
  id?: string;
  store: string;
  store_product_code: string;
  product_name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  price_cents: number;
  original_price_cents?: number;
  unit_price_cents?: number;
  on_sale: boolean;
  promotion_text?: string;
  image_url?: string;
  product_url?: string;
  in_stock: boolean;
  scraped_at: string;
  last_seen_at: string;
  created_at?: string;
  updated_at?: string;
}

// Scrape result from a single store
export interface ScrapeResult {
  store: string;
  products: PnPProduct[];
  errors: string[];
  stats: {
    total: number;
    categories: number;
    duration_ms: number;
  };
}

// Category configuration
export interface CategoryConfig {
  slug: string;
  name: string;
  latela_category: string;
}

// Store configuration
export interface StoreConfig {
  name: string;
  enabled: boolean;
  baseUrl?: string;
}

// Price history record
export interface PriceHistory {
  id?: string;
  canonical_product_id?: string;
  product_offer_id?: string;
  price_cents: number;
  original_price_cents?: number;
  recorded_at: string;
}

// Canonical product (for matching across stores)
export interface CanonicalProduct {
  id?: string;
  name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  barcode?: string;
  created_at?: string;
  updated_at?: string;
}

// API response types for different stores

// SAP Hybris OCC format (Checkers, Shoprite, PnP, Makro)
export interface HybrisProduct {
  code: string;
  name: string;
  price?: {
    value: number;
    currencyIso?: string;
    formattedValue?: string;
    was?: {
      value: number;
    };
    current?: {
      value: number;
    };
  };
  wasPrice?: {
    value: number;
  };
  images?: Array<{
    url: string;
    imageType?: string;
    format?: string;
  }>;
  url?: string;
  brand?: {
    name: string;
  };
  stock?: {
    stockLevelStatus: string;
    stockLevel?: number;
  };
  onPromotion?: boolean;
  isOnPromotion?: boolean;
  promotionText?: string;
  promotion?: {
    description?: string;
  };
}

// Woolworths Endeca format
export interface WoolworthsProduct {
  id?: string;
  productId?: string;
  name?: string;
  displayName?: string;
  price?: string | number;
  sellingPrice?: string | number;
  wasPrice?: string | number;
  image?: string;
  url?: string;
  brand?: string;
  inStock?: boolean;
  onPromotion?: boolean;
  promotionText?: string;
  attributes?: {
    name?: string[];
    price?: string[];
    wasPrice?: string[];
    image?: string[];
    thumbnailImage?: string[];
    url?: string[];
    brand?: string[];
    productId?: string[];
    inStock?: string[];
    onPromotion?: string[];
    promotionText?: string[];
  };
}

// Scraper interface
export interface IScraper {
  init(): Promise<void>;
  close(): Promise<void>;
  scrapeCategory(slug: string, categoryName: string, maxPages?: number): Promise<PnPProduct[]>;
  scrapeSpecials(maxPages?: number): Promise<PnPProduct[]>;
  scrapeSearch?(searchTerm: string, maxPages?: number): Promise<PnPProduct[]>;
  scrapeAllCategories(maxPagesPerCategory?: number): Promise<{
    products: PnPProduct[];
    errors: string[];
    stats: {
      total: number;
      categories: number;
      duration_ms: number;
    };
  }>;
}

// Environment variables
export interface ScraperEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  SCRAPE_STORES?: string;
  SCRAPE_TYPE?: string;
}

// GitHub Actions summary
export interface ScrapeSummary {
  date: string;
  stores: number;
  totalProducts: number;
  totalUploaded: number;
  results: Array<{
    store: string;
    products: number;
    errors: number;
  }>;
}
