import puppeteer, { Browser, Page, HTTPResponse } from 'puppeteer';
import { PnPProduct } from '../types';
import { DEFAULT_CONFIG, getRandomUserAgent, sleep } from '../config';

/**
 * Woolworths Price Scraper for Latela (API Interception Mode)
 */

export const WOOLWORTHS_URLS = {
  base: 'https://www.woolworths.co.za',
  allProducts: 'https://www.woolworths.co.za/cat/Food/_/N-1z13sk5',
  specials: 'https://www.woolworths.co.za/cat/Food/Promotion/_/N-1z13sk5Zlllvhm',
  search: (query: string) => `https://www.woolworths.co.za/cat?Ntt=${encodeURIComponent(query)}`,
  category: (slug: string) => `https://www.woolworths.co.za/cat/${slug}`,
};

export const WOOLWORTHS_CATEGORIES = [
  { slug: 'Food/Fruit-Vegetables-Salads/_/N-1z13s68', name: 'Fruit & Veg', latela_category: 'Groceries' },
  { slug: 'Food/Meat-Poultry-Fish/_/N-1z13ryj', name: 'Meat & Fish', latela_category: 'Groceries' },
  { slug: 'Food/Dairy-Eggs-Milk/_/N-1z13s3h', name: 'Dairy & Eggs', latela_category: 'Groceries' },
  { slug: 'Food/Bakery/_/N-1z13s29', name: 'Bakery', latela_category: 'Groceries' },
  { slug: 'Food/Frozen/_/N-lhp5z6', name: 'Frozen', latela_category: 'Groceries' },
  { slug: 'Food/Beverages/_/N-1z13s05', name: 'Beverages', latela_category: 'Groceries' },
  { slug: 'Food/Food-Cupboard/_/N-1z13ry3', name: 'Food Cupboard', latela_category: 'Groceries' },
  { slug: 'Food/Beer-Wine-Spirits/_/N-1z13s1f', name: 'Beer Wine Spirits', latela_category: 'Groceries' },
  { slug: 'Beauty/_/N-1z13s9i', name: 'Beauty', latela_category: 'Health & Beauty' },
  { slug: 'Homeware/_/N-1z13sbw', name: 'Homeware', latela_category: 'Home & Household' },
];

const API_PATTERNS = ['/api/', '/products', '/search', '/plp/', '/cat/', 'endeca'];

export class WoolworthsScraper {
  private browser: Browser | null = null;
  private config = DEFAULT_CONFIG;
  private capturedProducts: any[] = [];

  async init(): Promise<void> {
    console.log('🛒 Initializing Woolworths Scraper...');
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
    // Woolworths Endeca format
    if (data?.contents?.[0]?.mainContent?.[0]?.contents?.[0]?.records) {
      products.push(...data.contents[0].mainContent[0].contents[0].records);
    }
    if (data?.mainContent?.[0]?.records) products.push(...data.mainContent[0].records);
    return products;
  }

  private parseApiProduct(raw: any, categoryName: string): PnPProduct | null {
    try {
      let priceCents = 0, originalPriceCents: number | undefined;

      // Woolworths uses attributes object
      if (raw.price) priceCents = Math.round(parseFloat(raw.price) * 100);
      if (raw.attributes?.price?.[0]) priceCents = Math.round(parseFloat(raw.attributes.price[0]) * 100);
      if (raw.sellingPrice) priceCents = Math.round(parseFloat(raw.sellingPrice) * 100);

      if (raw.wasPrice) originalPriceCents = Math.round(parseFloat(raw.wasPrice) * 100);
      if (raw.attributes?.wasPrice?.[0]) originalPriceCents = Math.round(parseFloat(raw.attributes.wasPrice[0]) * 100);

      const name = raw.name || raw.attributes?.name?.[0] || raw.displayName || '';
      if (!name || priceCents === 0) return null;

      const code = raw.id || raw.productId || raw.attributes?.productId?.[0] || `woolworths_${Date.now()}`;

      let imageUrl = raw.image || raw.attributes?.image?.[0] || raw.attributes?.thumbnailImage?.[0] || '';
      if (imageUrl && !imageUrl.startsWith('http')) imageUrl = `https://www.woolworths.co.za${imageUrl}`;

      let productUrl = raw.url || raw.attributes?.url?.[0] || '';
      if (productUrl && !productUrl.startsWith('http')) productUrl = `https://www.woolworths.co.za${productUrl}`;

      return {
        code: String(code),
        name,
        brand: raw.brand || raw.attributes?.brand?.[0],
        price_cents: priceCents,
        original_price_cents: originalPriceCents && originalPriceCents > priceCents ? originalPriceCents : undefined,
        category: categoryName,
        on_sale: !!(raw.onPromotion || raw.attributes?.onPromotion?.[0] === 'true' || (originalPriceCents && originalPriceCents > priceCents)),
        promotion_text: raw.promotionText || raw.attributes?.promotionText?.[0],
        image_url: imageUrl,
        product_url: productUrl,
        in_stock: raw.inStock !== false && raw.attributes?.inStock?.[0] !== 'false',
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
      document.querySelectorAll('[class*="product-card"], [class*="ProductCard"], [data-product], .product--grid').forEach(card => {
        const name = card.querySelector('[class*="name"], [class*="title"], h3, .range--title')?.textContent?.trim();
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
      return { code: `woolworths_${Date.now()}_${Math.random().toString(36).substr(2,9)}`, name: r.name, price_cents: cents, category: categoryName, on_sale: false, image_url: r.img || '', product_url: r.link || '', in_stock: true, scraped_at: new Date() } as PnPProduct;
    }).filter(Boolean) as PnPProduct[];
  }

  async scrapeCategory(slug: string, categoryName: string, maxPages = 3): Promise<PnPProduct[]> {
    const page = await this.createPage();
    this.capturedProducts = [];
    try {
      const url = WOOLWORTHS_URLS.category(slug);
      console.log(`📂 Scraping Woolworths: ${categoryName}\n   URL: ${url}`);
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
      console.log('🏷️  Scraping Woolworths Specials...');
      this.setupApiInterception(page, 'Specials');
      await page.goto(WOOLWORTHS_URLS.specials, { waitUntil: 'networkidle2', timeout: this.config.timeout });
      await sleep(5000); await this.scrollPage(page);
      this.capturedProducts.forEach(p => p.on_sale = true);
      console.log(`✅ Found ${this.capturedProducts.length} specials`);
    } catch (e) { console.error(`❌ Error: ${e}`); } finally { await page.close(); }
    return [...this.capturedProducts];
  }

  async scrapeAllCategories(maxPagesPerCategory = 3): Promise<{ products: PnPProduct[]; errors: string[]; stats: { total: number; categories: number; duration_ms: number } }> {
    const start = Date.now(), all: PnPProduct[] = [], errors: string[] = [];
    console.log('\n🛒 Starting Woolworths full scrape...\n');
    for (const cat of WOOLWORTHS_CATEGORIES) {
      try {
        const prods = await this.scrapeCategory(cat.slug, cat.name, maxPagesPerCategory);
        prods.forEach(p => { p.category = cat.latela_category; (p as any).subcategory = cat.name; });
        all.push(...prods);
        await sleep(this.config.requestDelay * 2);
      } catch (e) { errors.push(`${cat.name}: ${e}`); }
    }
    return { products: all, errors, stats: { total: all.length, categories: WOOLWORTHS_CATEGORIES.length, duration_ms: Date.now() - start } };
  }
}

export default WoolworthsScraper;
