import puppeteer, { Browser, Page, HTTPResponse } from 'puppeteer';
import { PnPProduct } from '../types';
import { DEFAULT_CONFIG, getRandomUserAgent, sleep } from '../config';

/**
 * Makro Price Scraper for Latela (API Interception Mode)
 */

export const MAKRO_URLS = {
  base: 'https://www.makro.co.za',
  allProducts: 'https://www.makro.co.za/food/c/F',
  specials: 'https://www.makro.co.za/deals/c/deals',
  search: (query: string) => `https://www.makro.co.za/search/?text=${encodeURIComponent(query)}`,
  category: (slug: string) => `https://www.makro.co.za/${slug}`,
};

export const MAKRO_CATEGORIES = [
  { slug: 'food/c/F', name: 'Food', latela_category: 'Groceries' },
  { slug: 'food/fresh-food/fruit-vegetables/c/FFV', name: 'Fruit & Veg', latela_category: 'Groceries' },
  { slug: 'food/fresh-food/meat-seafood/c/FMS', name: 'Meat & Seafood', latela_category: 'Groceries' },
  { slug: 'food/fresh-food/dairy-eggs/c/FDE', name: 'Dairy & Eggs', latela_category: 'Groceries' },
  { slug: 'food/fresh-food/bakery/c/FB', name: 'Bakery', latela_category: 'Groceries' },
  { slug: 'food/frozen/c/FF', name: 'Frozen', latela_category: 'Groceries' },
  { slug: 'food/beverages/c/FBV', name: 'Beverages', latela_category: 'Groceries' },
  { slug: 'liquor/c/L', name: 'Liquor', latela_category: 'Groceries' },
  { slug: 'health-beauty/c/HB', name: 'Health & Beauty', latela_category: 'Health & Beauty' },
  { slug: 'cleaning-household/c/CH', name: 'Household', latela_category: 'Home & Household' },
  { slug: 'baby/c/BB', name: 'Baby', latela_category: 'Baby & Child' },
  { slug: 'pet/c/P', name: 'Pet', latela_category: 'Pet Care' },
];

const API_PATTERNS = ['/api/', '/products', '/search', '/plp/', '/occ/'];

export class MakroScraper {
  private browser: Browser | null = null;
  private config = DEFAULT_CONFIG;
  private capturedProducts: any[] = [];

  async init(): Promise<void> {
    console.log('🛒 Initializing Makro Scraper...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080'],
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
    if (!this.browser) throw new Error('Browser not initialized');
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(getRandomUserAgent());
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-ZA,en;q=0.9' });
    return page;
  }

  private isProductApiResponse(url: string): boolean {
    return API_PATTERNS.some(p => url.includes(p));
  }

  private extractProductsFromResponse(data: any): any[] {
    const products: any[] = [];
    if (data?.products) products.push(...data.products);
    if (data?.data?.products) products.push(...data.data.products);
    if (data?.results) products.push(...data.results);
    if (data?.searchResult?.products) products.push(...data.searchResult.products);
    if (data?.items) products.push(...data.items);
    return products;
  }

  private parseApiProduct(raw: any, categoryName: string): PnPProduct | null {
    try {
      let priceCents = 0, originalPriceCents: number | undefined;

      if (raw.price?.value) priceCents = Math.round(raw.price.value * 100);
      else if (typeof raw.price === 'number') priceCents = Math.round(raw.price * 100);
      else if (raw.sellingPrice) priceCents = Math.round(parseFloat(raw.sellingPrice) * 100);

      if (raw.wasPrice?.value) originalPriceCents = Math.round(raw.wasPrice.value * 100);
      else if (raw.originalPrice?.value) originalPriceCents = Math.round(raw.originalPrice.value * 100);

      const name = raw.name || raw.title || '';
      if (!name || priceCents === 0) return null;

      const code = raw.code || raw.id || `makro_${Date.now()}`;

      let imageUrl = raw.images?.[0]?.url || raw.image || '';
      if (imageUrl && !imageUrl.startsWith('http')) imageUrl = `https://www.makro.co.za${imageUrl}`;

      let productUrl = raw.url || '';
      if (productUrl && !productUrl.startsWith('http')) productUrl = `https://www.makro.co.za${productUrl}`;

      return {
        code: String(code),
        name,
        brand: raw.brand?.name,
        price_cents: priceCents,
        original_price_cents: originalPriceCents && originalPriceCents > priceCents ? originalPriceCents : undefined,
        category: categoryName,
        on_sale: !!(raw.onPromotion || (originalPriceCents && originalPriceCents > priceCents)),
        promotion_text: raw.promotionText,
        image_url: imageUrl,
        product_url: productUrl,
        in_stock: raw.stock?.stockLevelStatus !== 'outOfStock',
        scraped_at: new Date(),
      };
    } catch { return null; }
  }

  private setupApiInterception(page: Page, categoryName: string): void {
    this.capturedProducts = [];
    page.on('response', async (response: HTTPResponse) => {
      const url = response.url();
      if (this.isProductApiResponse(url) && response.status() === 200) {
        try {
          const ct = response.headers()['content-type'] || '';
          if (ct.includes('application/json')) {
            const json = await response.json();
            const products = this.extractProductsFromResponse(json);
            if (products.length > 0) {
              console.log(`   📡 Intercepted ${products.length} products`);
              products.forEach(r => { const p = this.parseApiProduct(r, categoryName); if (p) this.capturedProducts.push(p); });
            }
          }
        } catch {}
      }
    });
  }

  private async scrollPage(page: Page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>(r => {
        let h = 0; const t = setInterval(() => { window.scrollBy(0, 500); h += 500; if (h >= document.body.scrollHeight || h > 10000) { clearInterval(t); r(); } }, 200);
      });
    });
  }

  private async extractFromDOM(page: Page, categoryName: string): Promise<PnPProduct[]> {
    const raw = await page.evaluate(() => {
      const items: any[] = [];
      document.querySelectorAll('[class*="product-card"], [class*="ProductCard"], [data-product], .product-tile, .product__item').forEach(card => {
        const name = card.querySelector('[class*="name"], [class*="title"], h3, h4, .product__name')?.textContent?.trim();
        const price = card.querySelector('[class*="price"], .price')?.textContent?.trim();
        const img = (card.querySelector('img') as HTMLImageElement)?.src;
        const link = (card.querySelector('a') as HTMLAnchorElement)?.href;
        if (name && price) items.push({ name, price, img, link });
      });
      return items;
    });
    return raw.map((r: any) => {
      const m = r.price?.match(/R?\s*(\d+(?:[.,]\d{2})?)/);
      const cents = m ? Math.round(parseFloat(m[1].replace(',', '.')) * 100) : 0;
      if (!r.name || !cents) return null;
      return { code: `makro_${Date.now()}_${Math.random().toString(36).substr(2,9)}`, name: r.name, price_cents: cents, category: categoryName, on_sale: false, image_url: r.img || '', product_url: r.link || '', in_stock: true, scraped_at: new Date() } as PnPProduct;
    }).filter(Boolean) as PnPProduct[];
  }

  async scrapeCategory(slug: string, categoryName: string, maxPages = 3): Promise<PnPProduct[]> {
    const page = await this.createPage();
    this.capturedProducts = [];
    try {
      const url = MAKRO_URLS.category(slug);
      console.log(`📂 Scraping Makro: ${categoryName}\n   URL: ${url}`);
      this.setupApiInterception(page, categoryName);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeout });
      await sleep(5000); await this.scrollPage(page); await sleep(3000);
      if (!this.capturedProducts.length) { console.log('   ⚠️ Trying DOM...'); this.capturedProducts.push(...await this.extractFromDOM(page, categoryName)); }
      console.log(`   ✅ Total: ${this.capturedProducts.length}`);
    } catch (e) { console.error(`   ❌ Error: ${e}`); } finally { await page.close(); }
    return [...this.capturedProducts];
  }

  async scrapeSpecials(maxPages = 5): Promise<PnPProduct[]> {
    const page = await this.createPage();
    this.capturedProducts = [];
    try {
      console.log('🏷️  Scraping Makro Specials...');
      this.setupApiInterception(page, 'Specials');
      await page.goto(MAKRO_URLS.specials, { waitUntil: 'networkidle2', timeout: this.config.timeout });
      await sleep(5000); await this.scrollPage(page);
      this.capturedProducts.forEach(p => p.on_sale = true);
      console.log(`✅ Found ${this.capturedProducts.length} specials`);
    } catch (e) { console.error(`❌ Error: ${e}`); } finally { await page.close(); }
    return [...this.capturedProducts];
  }

  async scrapeAllCategories(maxPagesPerCategory = 3): Promise<{ products: PnPProduct[]; errors: string[]; stats: { total: number; categories: number; duration_ms: number } }> {
    const start = Date.now(), all: PnPProduct[] = [], errors: string[] = [];
    console.log('\n🛒 Starting Makro full scrape...\n');
    for (const cat of MAKRO_CATEGORIES) {
      try {
        const prods = await this.scrapeCategory(cat.slug, cat.name, maxPagesPerCategory);
        prods.forEach(p => { p.category = cat.latela_category; (p as any).subcategory = cat.name; });
        all.push(...prods);
        await sleep(this.config.requestDelay * 2);
      } catch (e) { errors.push(`${cat.name}: ${e}`); }
    }
    return { products: all, errors, stats: { total: all.length, categories: MAKRO_CATEGORIES.length, duration_ms: Date.now() - start } };
  }
}

export default MakroScraper;
