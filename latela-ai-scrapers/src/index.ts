import { PnPScraper } from './retailers/pnpScraper';
import { CheckersScraper } from './retailers/checkersScraper';
import { WoolworthsScraper } from './retailers/woolworthsScraper';
import { MakroScraper } from './retailers/makroScraper';
import { BaseScraper, ScrapedProduct } from './base/baseScraper';

export { ScrapedProduct } from './base/baseScraper';

export enum StoreType {
  PICK_N_PAY = 'pnp',
  CHECKERS = 'checkers',
  SHOPRITE = 'shoprite',
  WOOLWORTHS = 'woolworths',
  MAKRO = 'makro'
}

export interface ScraperOptions {
  maxPages?: number;
}

/**
 * Factory function to get the appropriate scraper based on URL
 */
export function getScraperForURL(url: string, options?: ScraperOptions): BaseScraper {
  const lowerUrl = url.toLowerCase();
  const maxPages = options?.maxPages ?? 10;

  if (lowerUrl.includes('pnp.co.za') || lowerUrl.includes('picknpay')) {
    return new PnPScraper(maxPages);
  }

  if (lowerUrl.includes('checkers.co.za') || lowerUrl.includes('checkers')) {
    return new CheckersScraper(maxPages);
  }

  if (lowerUrl.includes('shoprite.co.za') || lowerUrl.includes('shoprite')) {
    return new CheckersScraper(maxPages); // Shoprite uses same scraper as Checkers
  }

  if (lowerUrl.includes('woolworths.co.za') || lowerUrl.includes('woolworths')) {
    return new WoolworthsScraper(maxPages);
  }

  if (lowerUrl.includes('makro.co.za') || lowerUrl.includes('makro')) {
    return new MakroScraper(maxPages);
  }

  throw new Error(`No scraper available for URL: ${url}`);
}

/**
 * Get scraper by store type enum
 */
export function getScraperByStore(storeType: StoreType, options?: ScraperOptions): BaseScraper {
  const maxPages = options?.maxPages ?? 10;

  switch (storeType) {
    case StoreType.PICK_N_PAY:
      return new PnPScraper(maxPages);
    
    case StoreType.CHECKERS:
    case StoreType.SHOPRITE:
      return new CheckersScraper(maxPages);
    
    case StoreType.WOOLWORTHS:
      return new WoolworthsScraper(maxPages);
    
    case StoreType.MAKRO:
      return new MakroScraper(maxPages);
    
    default:
      throw new Error(`Unknown store type: ${storeType}`);
  }
}

/**
 * Scrape a single URL - convenience function
 */
export async function scrapeURL(url: string, options?: ScraperOptions): Promise<ScrapedProduct[]> {
  const scraper = getScraperForURL(url, options);
  return await scraper.scrape(url);
}

/**
 * Scrape multiple URLs in sequence
 */
export async function scrapeMultipleURLs(
  urls: string[],
  options?: ScraperOptions
): Promise<{
  success: Array<{ url: string; products: ScrapedProduct[] }>;
  failed: Array<{ url: string; error: string }>;
}> {
  const success: Array<{ url: string; products: ScrapedProduct[] }> = [];
  const failed: Array<{ url: string; error: string }> = [];

  for (const url of urls) {
    try {
      console.log(`\n📦 Processing: ${url}`);
      const products = await scrapeURL(url, options);
      success.push({ url, products });
      console.log(`✓ Successfully scraped ${products.length} products`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`✗ Failed to scrape ${url}: ${errorMessage}`);
      failed.push({ url, error: errorMessage });
    }
  }

  return { success, failed };
}

/**
 * Get list of supported stores
 */
export function getSupportedStores(): string[] {
  return [
    'Pick n Pay',
    'Checkers',
    'Shoprite',
    'Woolworths',
    'Makro'
  ];
}

// Export individual scrapers
export {
  PnPScraper,
  CheckersScraper,
  WoolworthsScraper,
  MakroScraper,
  BaseScraper
};
