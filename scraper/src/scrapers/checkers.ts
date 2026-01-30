import puppeteer, { Browser, Page } from 'puppeteer';
import { PnPProduct } from '../types';
import { DEFAULT_CONFIG, getRandomUserAgent, sleep } from '../config';

export { CheckersScraper };

/**
 * Checkers/Sixty60 Price Scraper for Latela
 * 
 * Checkers uses a React-based SPA with their Sixty60 delivery platform.
 * Products are loaded dynamically via API calls.
 */

// Checkers-specific URLs
export const CHECKERS_URLS = {
  base: 'https://www.checkers.co.za',
  allProducts: 'https://www.checkers.co.za/c-2256/All-Products',
  specials: 'https://www.checkers.co.za/c-2256/All-Products?q=%3Arelevance%3AisOnPromotion%3AOn%2BPromotion',
  search: (query: string) => `https://www.checkers.co.za/search/all?q=${encodeURIComponent(query)}`,
  category: (slug: string) => `https://www.checkers.co.za/${slug}`,
};

// Checkers category configuration mapped to Latela categories
export const CHECKERS_CATEGORIES = [
  { slug: 'c-2569/Food', name: 'Food', latela_category: 'Groceries' },
  { slug: 'c-2604/Fruit-Vegetables', name: 'Fruit & Vegetables', latela_category: 'Groceries' },
  { slug: 'c-2645/Meat-Poultry-Fish', name: 'Meat, Poultry & Fish', latela_category: 'Groceries' },
  { slug: 'c-2686/Deli-Bakery', name: 'Deli & Bakery', latela_category: 'Groceries' },
  { slug: 'c-2709/Dairy-Eggs-Fridge', name: 'Dairy, Eggs & Fridge', latela_category: 'Groceries' },
  { slug: 'c-2752/Frozen', name: 'Frozen', latela_category: 'Groceries' },
  { slug: 'c-2783/Drinks', name: 'Drinks', latela_category: 'Groceries' },
  { slug: 'c-2821/Beer-Wine-Spirits', name: 'Beer, Wine & Spirits', latela_category: 'Groceries' },
  { slug: 'c-2850/Baby', name: 'Baby', latela_category: 'Baby & Child' },
  { slug: 'c-2878/Health-Beauty', name: 'Health & Beauty', latela_category: 'Health & Beauty' },
  { slug: 'c-2917/Household', name: 'Household', latela_category: 'Home & Household' },
  { slug: 'c-2948/Pet', name: 'Pet', latela_category: 'Pet Care' },
];

// CSS Selectors for Checkers website
const CHECKERS_SELECTORS = {
  // Product grid
  productCard: '[class*="product-card"], [class*="ProductCard"], [data-testid="product-card"], .product-item',
  
  // Product details
  productName: '[class*="product-name"], [class*="ProductName"], h3, .product-title',
  productPrice: '[class*="price"]:not([class*="was"]):not([class*="original"]), .special-price, .current-price',
  originalPrice: '[class*="was-price"], [class*="original-price"], [class*="WasPrice"], .was-price',
  productImage: 'img[class*="product"], img[src*="product"], .product-image img',
  productLink: 'a[href*="/p/"], a[href*="productId"]',
  
  // Promotion badges
  promoBadge: '[class*="promo"], [class*="special"], [class*="saving"], .promotion-badge',
  
  // Pagination
  nextPage: '[class*="next"]:not([disabled]), [aria-label="Next"], .pagination-next',
  loadMore: '[class*="load-more"], button[class*="LoadMore"]',
  
  // Loading states
  spinner: '[class*="loading"], [class*="spinner"], .loader',
  
  // Popups
  cookieAccept: '#onetrust-accept-btn-handler, [class*="cookie-accept"], .accept-cookies',
  locationModal: '[class*="location-modal"], [class*="store-selector"]',
  closeModal: '[class*="close"], [aria-label="Close"], .modal-close',
};

export class CheckersScraper {
  private browser: Browser | null = null;
  private config = DEFAULT_CONFIG;

  async init(): Promise<void> {
    console.log('🏪 Initializing Checkers Scraper...');
    
    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });

    console.log('✅ Browser initialized');
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Browser closed');
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(getRandomUserAgent());
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-ZA,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    // Block heavy resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    return page;
  }

  private async handlePopups(page: Page): Promise<void> {
    try {
      await sleep(1500);

      // Accept cookies
      const cookieBtn = await page.$(CHECKERS_SELECTORS.cookieAccept);
      if (cookieBtn) {
        await cookieBtn.click();
        console.log('🍪 Accepted cookies');
        await sleep(500);
      }

      // Close location modal if present
      const closeBtn = await page.$(CHECKERS_SELECTORS.closeModal);
      if (closeBtn) {
        await closeBtn.click();
        await sleep(500);
      }
    } catch (e) {
      // Popups are optional
    }
  }

  private async waitForContent(page: Page): Promise<void> {
    try {
      await page.waitForNetworkIdle({ timeout: 15000 });
    } catch {
      await page.waitForSelector('body', { timeout: 10000 });
    }

    await sleep(2000);

    // Wait for spinners to disappear
    try {
      await page.waitForFunction(
        (selector) => !document.querySelector(selector),
        { timeout: 10000 },
        CHECKERS_SELECTORS.spinner
      );
    } catch {
      // Spinner might not exist
    }
  }

  private async extractProducts(page: Page, categoryName: string): Promise<PnPProduct[]> {
    const rawProducts = await page.evaluate((selectors) => {
      const items: any[] = [];
      
      // Try multiple selector strategies for product cards
      const productCards = document.querySelectorAll(
        '[class*="product-card"], [class*="ProductCard"], [data-testid*="product"], .product-item, [class*="product-listing"] > div'
      );

      productCards.forEach((card) => {
        try {
          // Get link and extract product code
          const linkEl = card.querySelector('a[href*="/p/"]') as HTMLAnchorElement;
          const href = linkEl?.href || '';
          const codeMatch = href.match(/\/p\/(\d+)/) || href.match(/productId[=:](\d+)/);
          const code = codeMatch ? codeMatch[1] : `checkers_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Get name
          const nameEl = card.querySelector('[class*="product-name"], [class*="ProductName"], h3, h4, .product-title');
          const name = nameEl?.textContent?.trim() || '';

          // Get prices
          const priceEl = card.querySelector('[class*="price"]:not([class*="was"]):not([class*="original"])');
          const priceText = priceEl?.textContent?.trim() || '';
          
          const wasPriceEl = card.querySelector('[class*="was"], [class*="original"], [class*="Was"]');
          const wasPriceText = wasPriceEl?.textContent?.trim() || '';

          // Get image
          const imgEl = card.querySelector('img') as HTMLImageElement;
          const imageUrl = imgEl?.src || imgEl?.dataset?.src || '';

          // Check for promotions
          const promoEl = card.querySelector('[class*="promo"], [class*="saving"], [class*="special"]');
          const promotionText = promoEl?.textContent?.trim() || '';

          if (name && priceText) {
            items.push({
              code,
              name,
              priceText,
              wasPriceText,
              imageUrl,
              productUrl: href || window.location.href,
              promotionText,
              inStock: !card.textContent?.toLowerCase().includes('out of stock'),
            });
          }
        } catch (e) {
          // Skip problematic cards
        }
      });

      return items;
    }, CHECKERS_SELECTORS);

    // Parse into PnPProduct format (reusing the type for consistency)
    return rawProducts.map(raw => this.parseProduct(raw, categoryName)).filter(Boolean) as PnPProduct[];
  }

  private parseProduct(raw: any, categoryName: string): PnPProduct | null {
    try {
      const parsePrice = (text: string): number => {
        if (!text) return 0;
        const cleaned = text.replace(/[R\s,]/g, '').replace(',', '.');
        const match = cleaned.match(/(\d+\.?\d*)/);
        return match ? Math.round(parseFloat(match[1]) * 100) : 0;
      };

      const priceCents = parsePrice(raw.priceText);
      const originalPriceCents = parsePrice(raw.wasPriceText);

      // Extract brand (first word(s) before main product name pattern)
      const brandMatch = raw.name.match(/^([\w\s&']+?)\s+(?=\d|[A-Z]{2,}|\w+\s+\d)/);
      const brand = brandMatch ? brandMatch[1].trim() : undefined;

      return {
        code: raw.code,
        name: raw.name,
        brand,
        price_cents: priceCents,
        original_price_cents: originalPriceCents > priceCents ? originalPriceCents : undefined,
        category: categoryName,
        on_sale: originalPriceCents > priceCents || !!raw.promotionText,
        promotion_text: raw.promotionText || undefined,
        image_url: raw.imageUrl,
        product_url: raw.productUrl,
        in_stock: raw.inStock,
        scraped_at: new Date(),
      };
    } catch (error) {
      console.error(`Failed to parse product: ${error}`);
      return null;
    }
  }

  async scrapeCategory(slug: string, categoryName: string, maxPages: number = 5): Promise<PnPProduct[]> {
    const allProducts: PnPProduct[] = [];
    const page = await this.createPage();

    try {
      const url = CHECKERS_URLS.category(slug);
      console.log(`📂 Scraping Checkers: ${categoryName}`);
      console.log(`   URL: ${url}`);

      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout 
      });

      await this.handlePopups(page);
      await this.waitForContent(page);

      let currentPage = 1;
      let hasMore = true;

      while (hasMore && currentPage <= maxPages) {
        console.log(`   📄 Page ${currentPage}...`);

        const products = await this.extractProducts(page, categoryName);
        console.log(`   Found ${products.length} products`);
        allProducts.push(...products);

        // Try to load more or go to next page
        const nextBtn = await page.$(CHECKERS_SELECTORS.nextPage);
        const loadMoreBtn = await page.$(CHECKERS_SELECTORS.loadMore);

        if (loadMoreBtn && currentPage < maxPages) {
          try {
            await loadMoreBtn.click();
            await this.waitForContent(page);
            currentPage++;
            await sleep(this.config.requestDelay);
          } catch {
            hasMore = false;
          }
        } else if (nextBtn && currentPage < maxPages) {
          try {
            await nextBtn.click();
            await this.waitForContent(page);
            currentPage++;
            await sleep(this.config.requestDelay);
          } catch {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`   ✅ Total: ${allProducts.length} products from ${categoryName}`);
    } catch (error) {
      console.error(`   ❌ Error scraping ${categoryName}: ${error}`);
      
      if (this.config.screenshotOnError) {
        await page.screenshot({ 
          path: `error_checkers_${slug.replace(/\//g, '_')}_${Date.now()}.png`,
          fullPage: true 
        });
      }
    } finally {
      await page.close();
    }

    return allProducts;
  }

  async scrapeSearch(searchTerm: string, maxPages: number = 3): Promise<PnPProduct[]> {
    const allProducts: PnPProduct[] = [];
    const page = await this.createPage();

    try {
      console.log(`🔍 Searching Checkers: "${searchTerm}"`);
      
      await page.goto(CHECKERS_URLS.search(searchTerm), { 
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout 
      });

      await this.handlePopups(page);
      await this.waitForContent(page);

      const products = await this.extractProducts(page, 'Search Results');
      allProducts.push(...products);

      console.log(`✅ Found ${allProducts.length} products for "${searchTerm}"`);
    } catch (error) {
      console.error(`❌ Search error: ${error}`);
    } finally {
      await page.close();
    }

    return allProducts;
  }

  async scrapeSpecials(maxPages: number = 5): Promise<PnPProduct[]> {
    const allProducts: PnPProduct[] = [];
    const page = await this.createPage();

    try {
      console.log('🏷️  Scraping Checkers Specials...');

      await page.goto(CHECKERS_URLS.specials, { 
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout 
      });

      await this.handlePopups(page);
      await this.waitForContent(page);

      let currentPage = 1;
      let hasMore = true;

      while (hasMore && currentPage <= maxPages) {
        console.log(`   📄 Specials page ${currentPage}...`);

        const products = await this.extractProducts(page, 'Specials');
        products.forEach(p => p.on_sale = true);
        allProducts.push(...products);

        const nextBtn = await page.$(CHECKERS_SELECTORS.nextPage);
        
        if (nextBtn && currentPage < maxPages) {
          try {
            await nextBtn.click();
            await this.waitForContent(page);
            currentPage++;
            await sleep(this.config.requestDelay);
          } catch {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Found ${allProducts.length} specials`);
    } catch (error) {
      console.error(`❌ Specials error: ${error}`);
    } finally {
      await page.close();
    }

    return allProducts;
  }

  async scrapeAllCategories(maxPagesPerCategory: number = 3): Promise<{
    products: PnPProduct[];
    errors: string[];
    stats: { total: number; categories: number; duration_ms: number };
  }> {
    const startTime = Date.now();
    const allProducts: PnPProduct[] = [];
    const errors: string[] = [];
    let categoriesProcessed = 0;

    console.log('\n🏪 Starting Checkers full scrape...\n');
    console.log(`Categories to process: ${CHECKERS_CATEGORIES.length}`);

    for (const category of CHECKERS_CATEGORIES) {
      try {
        const products = await this.scrapeCategory(
          category.slug,
          category.name,
          maxPagesPerCategory
        );
        
        // Map to Latela category
        products.forEach(p => {
          p.category = category.latela_category;
          p.subcategory = category.name;
        });

        allProducts.push(...products);
        categoriesProcessed++;

        await sleep(this.config.requestDelay * 2);
      } catch (error) {
        errors.push(`${category.name}: ${error}`);
      }
    }

    return {
      products: allProducts,
      errors,
      stats: {
        total: allProducts.length,
        categories: categoriesProcessed,
        duration_ms: Date.now() - startTime,
      },
    };
  }
}

export default CheckersScraper;
