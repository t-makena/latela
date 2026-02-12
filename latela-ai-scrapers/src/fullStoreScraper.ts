import puppeteer, { Browser } from 'puppeteer';
import { ScrapedProduct } from './base/baseScraper';
import { PnPScraper } from './retailers/pnpScraper';
import { CheckersScraper } from './retailers/checkersScraper';
import { WoolworthsScraper } from './retailers/woolworthsScraper';
import { MakroScraper } from './retailers/makroScraper';
import { 
  getURLDiscovery, 
  CategoryURL,
  WoolworthsURLDiscovery,
  PnPURLDiscovery,
  CheckersURLDiscovery,
  MakroURLDiscovery
} from './discovery/urlDiscovery';
import * as fs from 'fs/promises';

export interface FullScrapeOptions {
  maxPagesPerCategory?: number;
  maxCategories?: number;
  outputFile?: string;
  saveProgress?: boolean;
}

export interface ScrapeProgress {
  store: string;
  startedAt: Date;
  completedCategories: string[];
  failedCategories: string[];
  totalProducts: number;
}

export interface FullScrapeResult {
  store: string;
  categories: {
    name: string;
    url: string;
    productCount: number;
    success: boolean;
    error?: string;
  }[];
  totalProducts: number;
  products: ScrapedProduct[];
  duration: number;
}

/**
 * Full store scraper with automatic URL discovery
 */
export class FullStoreScraper {
  private browser: Browser | null = null;
  private options: Required<FullScrapeOptions>;

  constructor(options?: FullScrapeOptions) {
    this.options = {
      maxPagesPerCategory: options?.maxPagesPerCategory ?? 5,
      maxCategories: options?.maxCategories ?? 50,
      outputFile: options?.outputFile ?? 'scrape-results.json',
      saveProgress: options?.saveProgress ?? true
    };
  }

  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      });
    }
    return this.browser;
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private getScraperForStore(store: string, maxPages: number) {
    const storeLower = store.toLowerCase();
    
    if (storeLower.includes('woolworth')) {
      return new WoolworthsScraper(maxPages);
    }
    if (storeLower.includes('pnp') || storeLower.includes('pick')) {
      return new PnPScraper(maxPages);
    }
    if (storeLower.includes('checker') || storeLower.includes('shoprite')) {
      return new CheckersScraper(maxPages);
    }
    if (storeLower.includes('makro')) {
      return new MakroScraper(maxPages);
    }
    
    throw new Error(`No scraper available for store: ${store}`);
  }

  /**
   * Scrape an entire store by discovering categories first
   */
  async scrapeStore(store: string): Promise<FullScrapeResult> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏪 FULL STORE SCRAPE: ${store.toUpperCase()}`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();
    const result: FullScrapeResult = {
      store,
      categories: [],
      totalProducts: 0,
      products: [],
      duration: 0
    };

    try {
      // Step 1: Initialize browser
      const browser = await this.initBrowser();

      // Step 2: Discover category URLs
      console.log('📍 Step 1: Discovering category URLs...\n');
      const discovery = getURLDiscovery(store);
      const categories = await discovery.discoverCategories(browser);

      if (categories.length === 0) {
        throw new Error('No valid categories discovered');
      }

      console.log(`\n📋 Found ${categories.length} categories to scrape`);
      
      // Limit categories if needed
      const categoriesToScrape = categories.slice(0, this.options.maxCategories);
      console.log(`   Scraping ${categoriesToScrape.length} categories (max: ${this.options.maxCategories})\n`);

      // Step 3: Scrape each category
      console.log('📍 Step 2: Scraping categories...\n');
      
      const scraper = this.getScraperForStore(store, this.options.maxPagesPerCategory);
      const seenProducts = new Set<string>();

      for (let i = 0; i < categoriesToScrape.length; i++) {
        const category = categoriesToScrape[i];
        console.log(`\n[${i + 1}/${categoriesToScrape.length}] Scraping: ${category.name}`);
        console.log(`    URL: ${category.url}`);

        try {
          const products = await scraper.scrape(category.url);
          
          // Deduplicate across categories
          let newCount = 0;
          for (const product of products) {
            const key = `${product.name.toLowerCase()}-${product.price}`;
            if (!seenProducts.has(key)) {
              seenProducts.add(key);
              result.products.push(product);
              newCount++;
            }
          }

          result.categories.push({
            name: category.name,
            url: category.url,
            productCount: newCount,
            success: true
          });

          console.log(`    ✓ Found ${products.length} products (${newCount} new)`);
          result.totalProducts = result.products.length;

          // Save progress
          if (this.options.saveProgress) {
            await this.saveProgress(result);
          }

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.log(`    ✗ Failed: ${errorMsg}`);
          
          result.categories.push({
            name: category.name,
            url: category.url,
            productCount: 0,
            success: false,
            error: errorMsg
          });
        }

        // Small delay between categories
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error('Full store scrape failed:', error);
      throw error;
    } finally {
      await this.closeBrowser();
    }

    result.duration = (Date.now() - startTime) / 1000;

    // Final save
    await this.saveResults(result);

    // Print summary
    this.printSummary(result);

    return result;
  }

  private async saveProgress(result: FullScrapeResult): Promise<void> {
    const progressFile = `${this.options.outputFile.replace('.json', '')}-progress.json`;
    await fs.writeFile(progressFile, JSON.stringify(result, null, 2));
  }

  private async saveResults(result: FullScrapeResult): Promise<void> {
    await fs.writeFile(this.options.outputFile, JSON.stringify(result, null, 2));
    console.log(`\n💾 Results saved to: ${this.options.outputFile}`);
  }

  private printSummary(result: FullScrapeResult): void {
    const successfulCategories = result.categories.filter(c => c.success).length;
    const failedCategories = result.categories.filter(c => !c.success).length;

    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 SCRAPE SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Store:              ${result.store}`);
    console.log(`Duration:           ${result.duration.toFixed(1)} seconds`);
    console.log(`Categories scraped: ${successfulCategories}/${result.categories.length}`);
    console.log(`Categories failed:  ${failedCategories}`);
    console.log(`Total products:     ${result.totalProducts}`);
    console.log(`Output file:        ${this.options.outputFile}`);
    console.log(`${'='.repeat(60)}\n`);

    if (failedCategories > 0) {
      console.log('Failed categories:');
      result.categories
        .filter(c => !c.success)
        .forEach(c => console.log(`  - ${c.name}: ${c.error}`));
      console.log('');
    }
  }
}

/**
 * Convenience function to scrape a full store
 */
export async function scrapeFullStore(
  store: string, 
  options?: FullScrapeOptions
): Promise<FullScrapeResult> {
  const scraper = new FullStoreScraper(options);
  return await scraper.scrapeStore(store);
}
