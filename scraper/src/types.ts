/**
 * Latela Price Scraper - Type Definitions
 */

export interface PnPProduct {
  code: string;
  name: string;
  brand?: string;
  price_cents: number;
  original_price_cents?: number;
  category: string;
  subcategory?: string;
  on_sale: boolean;
  promotion_text?: string;
  image_url?: string;
  product_url: string;
  in_stock: boolean;
  scraped_at: Date;
}

export interface ScraperConfig {
  baseUrl: string;
  userAgent: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  requestDelay: number;
  maxConcurrent: number;
  headless: boolean;
  screenshotOnError: boolean;
}

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

export interface SupabaseProductOffer {
  id?: string;
  canonical_product_id?: string;
  store: string;
  store_product_code: string;
  product_name: string;
  brand?: string;
  price_cents: number;
  original_price_cents?: number;
  category: string;
  subcategory?: string;
  on_sale: boolean;
  promotion_text?: string;
  image_url?: string;
  product_url: string;
  in_stock: boolean;
  last_seen_at: string;
  created_at?: string;
  updated_at?: string;
}
