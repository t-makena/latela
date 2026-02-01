import puppeteer, { Browser, Page, HTTPResponse } from 'puppeteer';
import { PnPProduct } from '../types';
import { DEFAULT_CONFIG, getRandomUserAgent, sleep } from '../config';

/**
 * Shoprite Price Scraper for Latela (API Interception Mode)
 * 
 * Shoprite uses the same SAP Commerce (Hybris) platform as Checkers.
 * Products are loaded via XHR/fetch calls, NOT rendered in static DOM.
 * This scraper intercepts those API responses to extract product data.
 */

export const SHOPRITE_URLS = {
  base: 'https://www.shoprite.co.za',
  allProducts: 'https://www.shoprite.co.za/c-2256/All-Products',
  specials: 'https://www.shoprite.co.za/c-2256/All-Products?q=%3Arelevance%3AisOnPromotion%3AOn%2BPromotion',
  search: (query: string) => `https://www.shoprite.co.za/search/all?q=${encodeURIComponent(query)}`,
  category: (slug: string) => `https://www.shoprite.co.za/${slug}`,
};

export const SHOPRITE_CATEGORIES = [
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

// API URL patterns to intercept
const API_PATTERNS = [
  '/products',
  '/search',
  '/productSearch',
  '/occ/',
  '/api/',
  'graphql',
  '/plp/',
  '/category/',
];

export class ShopriteScraper {
  private browser: Browser | null = null;
  private config = DEFAULT_CONFIG;
  private capturedProducts: any[] = [];

  async init(): Promise<void> {
    console.log('🛒 Initializing Shoprite Scraper (API Interception Mode)...');
    
    this.browser = await puppeteer.launch({
      headless: true,
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

    return page;
  }

  private isProductApiResponse(url: string): boolean {
    return API_PATTERNS.some(pattern => url.includes(pattern));
  }

  private extractProductsFromResponse(data: any): any[] {
    const products: any[] = [];

    // SAP Hybris OCC typically returns { products: [...] }
    if (data?.products && Array.isArray(data.products)) {
      products.push(...data.products);
    }
    
    // GraphQL responses
    if (data?.data?.products) {
      products.push(...data.data.products);
    }
    if (data?.data?.productSearch?.products) {
      products.push(...data.data.productSearch.products);
    }
    
    // Search results
    if (data?.results && Array.isArray(data.results)) {
      products.push(...data.results);
    }
    
    // Nested in searchResult
    if (data?.searchResult?.products) {
      products.push(...data.searchResult.products);
    }

    // Items array
    if (data?.items && Array.isArray(data.items)) {
      products.push(...data.items);
    }

    return products;
  }

  private parseApiProduct(raw: any, categoryName: string): PnPProduct | null {
    try {
      let priceCents = 0;
      let originalPriceCents: number | undefined;

      // Handle various price structures
      if (raw.price?.value) {
        priceCents = Math.round(raw.price.value * 100);
      } else if (raw.price?.current?.value) {
        priceCents = Math.round(raw.price.current.value * 100);
      } else if (raw.sellingPrice?.value) {
        priceCents = Math.round(raw.sellingPrice.value * 100);
      } else if (raw.priceValue) {
        priceCents = Math.round(raw.priceValue * 100);
      } else if (typeof raw.price === 'number') {
        priceCents = Math.round(raw.price * 100);
      }

      // Original/Was price
      if (raw.price?.was?.value) {
        originalPriceCents = Math.round(raw.price.was.value * 100);
      } else if (raw.wasPrice?.value) {
        originalPriceCents = Math.round(raw.wasPrice.value * 100);
      } else if (raw.originalPrice?.value) {
        originalPriceCents = Math.round(raw.originalPrice.value * 100);
      }

      const name = raw.name || raw.title || raw.productName || '';
      if (!name || priceCents === 0) return null;

      const code = raw.code || raw.id || raw.productCode || raw.sku || `shoprite_${Date.now()}`;

      let imageUrl = '';
      if (raw.images && raw.images.length > 0) {
        const primaryImage = raw.images.find((img: any) => img.imageType === 'PRIMARY') || raw.images[0];
        imageUrl = primaryImage?.url || primaryImage?.src || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://www.shoprite.co.za${imageUrl}`;
        }
      } else if (raw.image) {
        imageUrl = raw.image.url || raw.image;
      } else if (raw.imageUrl) {
        imageUrl = raw.imageUrl;
      }

      let productUrl = raw.url || raw.productUrl || '';
      if (productUrl && !productUrl.startsWith('http')) {
        productUrl = `https://www.shoprite.co.za${productUrl}`;
      }

      const onSale = !!(
        raw.onPromotion || 
        raw.isOnPromotion || 
        raw.promotion || 
        (originalPriceCents && originalPriceCents > priceCents)
      );

      const promotionText = raw.promotionText || raw.promotion?.description || raw.promotionDescription || undefined;

      const inStock = raw.stock?.stockLevelStatus !== 'outOfStock' && 
                     raw.inStock !== false && 
                     raw.availableForPurchase !== false;

      return {
        code: String(code),
        name,
        brand: raw.brand?.name || raw.brandName || undefined,
        price_cents: priceCents,
        original_price_cents: originalPriceCents && originalPriceCents > priceCents ? originalPriceCents : undefined,
        category: categoryName,
        on_sale: onSale,
        promotion_text: promotionText,
        image_url: imageUrl,
        product_url: productUrl,
        in_stock: inStock,
        scraped_at: new Date(),
      };
    } catch (error) {
      console.error(`   Failed to parse API product: ${error}`);
      return null;
    }
  }

  private setupApiInterception(page: Page, categoryName: string): void {
    this.capturedProducts = [];

    page.on('response', async (response: HTTPResponse) => {
      const url = response.url();
      
      if (this.isProductApiResponse(url) && response.status() === 200) {
        try {
          const contentType = response.headers()['content-type'] || '';
          if (contentType.includes('application/json')) {
            const json = await response.json();
            const products = this.extractProductsFromResponse(json);
            
            if (products.length > 0) {
              console.log(`   📡 Intercepted ${products.length} products from API`);
              
              for (const rawProduct of products) {
                const parsed = this.parseApiProduct(rawProduct, categoryName);
                if (parsed) {
                  this.capturedProducts.push(parsed);
                }
              }
            }
          }
        } catch (e) {
          // Not all responses are JSON
        }
      }
    });
  }

  private async scrollPage(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight || totalHeight > 10000) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });
  }

  private async extractFromDOM(page: Page, categoryName: string): Promise<PnPProduct[]> {
    const rawProducts = await page.evaluate(() => {
      const items: any[] = [];
      
      const selectors = [
        '[data-testid*="product"]',
        '[class*="product-card"]',
        '[class*="ProductCard"]',
        '[class*="item-card"]',
        '.product',
        '[data-product-id]',
      ];

      for (const selector of selectors) {
        const cards = document.querySelectorAll(selector);
        if (cards.length > 0) {
          cards.forEach((card) => {
            try {
              const name = card.querySelector('[class*="name"], [class*="title"], h3, h4')?.textContent?.trim();
              const priceEl = card.querySelector('[class*="price"]');
              const priceText = priceEl?.textContent?.trim();
              const imgEl = card.querySelector('img') as HTMLImageElement;
              const linkEl = card.querySelector('a') as HTMLAnchorElement;

              if (name && priceText) {
                items.push({
                  name,
                  priceText,
                  imageUrl: imgEl?.src || '',
                  productUrl: linkEl?.href || '',
                });
              }
            } catch (e) {}
          });
          break;
        }
      }

      return items;
    });

    return rawProducts.map((raw: any) => {
      const priceMatch = raw.priceText?.match(/R?\s*(\d+(?:[.,]\d{2})?)/);
      const priceCents = priceMatch ? Math.round(parseFloat(priceMatch[1].replace(',', '.')) * 100) : 0;

      if (!raw.name || priceCents === 0) return null;

      return {
        code: `shoprite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: raw.name,
        price_cents: priceCents,
        category: categoryName,
        on_sale: false,
        image_url: raw.imageUrl,
        product_url: raw.productUrl,
        in_stock: true,
        scraped_at: new Date(),
      } as PnPProduct;
    }).filter(Boolean) as PnPProduct[];
  }

  async scrapeCategory(slug: string, categoryName: string, maxPages: number = 3): Promise<PnPProduct[]> {
    const page = await this.createPage();
    this.capturedProducts = [];

    try {
      const url = SHOPRITE_URLS.category(slug);
      console.log(`📂 Scraping Shoprite: ${categoryName}`);
      console.log(`   URL: ${url}`);

      this.setupApiInterception(page, categoryName);

      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      await sleep(5000);
      await this.scrollPage(page);
      await sleep(3000);

      if (this.capturedProducts.length === 0) {
        console.log(`   ⚠️ No API products captured, trying DOM fallback...`);
        const domProducts = await this.extractFromDOM(page, categoryName);
        this.capturedProducts.push(...domProducts);
      }

      console.log(`   ✅ Total: ${this.capturedProducts.length} products from ${categoryName}`);

    } catch (error) {
      console.error(`   ❌ Error scraping ${categoryName}: ${error}`);
      
      await page.screenshot({ 
        path: `error_shoprite_${slug.replace(/\//g, '_')}_${Date.now()}.png`,
        fullPage: true 
      });
    } finally {
      await page.close();
    }

    return [...this.capturedProducts];
  }

  async scrapeSpecials(maxPages: number = 5): Promise<PnPProduct[]> {
    const page = await this.createPage();
    this.capturedProducts = [];

    try {
      console.log('🏷️  Scraping Shoprite Specials...');
      
      this.setupApiInterception(page, 'Specials');

      await page.goto(SHOPRITE_URLS.specials, { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      await sleep(5000);
      await this.scrollPage(page);
      await sleep(3000);

      this.capturedProducts.forEach(p => p.on_sale = true);

      console.log(`✅ Found ${this.capturedProducts.length} specials`);

    } catch (error) {
      console.error(`❌ Specials error: ${error}`);
    } finally {
      await page.close();
    }

    return [...this.capturedProducts];
  }

  async scrapeSearch(searchTerm: string, maxPages: number = 3): Promise<PnPProduct[]> {
    const page = await this.createPage();
    this.capturedProducts = [];

    try {
      console.log(`🔍 Searching Shoprite: "${searchTerm}"`);
      
      this.setupApiInterception(page, 'Search Results');

      await page.goto(SHOPRITE_URLS.search(searchTerm), { 
        waitUntil: 'networkidle2',
        timeout: this.config.timeout 
      });

      await sleep(5000);

      console.log(`✅ Found ${this.capturedProducts.length} products for "${searchTerm}"`);

    } catch (error) {
      console.error(`❌ Search error: ${error}`);
    } finally {
      await page.close();
    }

    return [...this.capturedProducts];
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

    console.log('\n🛒 Starting Shoprite full scrape (API Mode)...\n');
    console.log(`Categories to process: ${SHOPRITE_CATEGORIES.length}`);

    for (const category of SHOPRITE_CATEGORIES) {
      try {
        const products = await this.scrapeCategory(
          category.slug,
          category.name,
          maxPagesPerCategory
        );
        
        products.forEach(p => {
          p.category = category.latela_category;
          (p as any).subcategory = category.name;
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

export default ShopriteScraper;
