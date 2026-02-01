import puppeteer, { Browser, Page, HTTPResponse } from 'puppeteer';
import { PnPProduct } from '../types';
import { DEFAULT_CONFIG, getRandomUserAgent, sleep } from '../config';

/**
 * Pick n Pay Price Scraper for Latela (API Interception Mode)
 */

export const PNP_URLS = {
  base: 'https://www.pnp.co.za',
  allProducts: 'https://www.pnp.co.za/pnpstorefront/pnp/en/All-Products/c/pnpbase',
  specials: 'https://www.pnp.co.za/pnpstorefront/pnp/en/All-Products/c/pnpbase?q=%3Arelevance%3AisOnPromotion%3Atrue',
  search: (query: string) => `https://www.pnp.co.za/pnpstorefront/pnp/en/search?text=${encodeURIComponent(query)}`,
  category: (slug: string) => `https://www.pnp.co.za/pnpstorefront/pnp/en/${slug}`,
};

export const PNP_CATEGORIES = [
  { slug: 'Food-Cupboard/c/food-702702702', name: 'Food Cupboard', latela_category: 'Groceries' },
  { slug: 'Fruit-Vegetables/c/fruit-vegetables-702702700', name: 'Fruit & Vegetables', latela_category: 'Groceries' },
  { slug: 'Meat-Fish/c/meat-702702703', name: 'Meat & Fish', latela_category: 'Groceries' },
  { slug: 'Bakery/c/bakery-702702705', name: 'Bakery', latela_category: 'Groceries' },
  { slug: 'Dairy-Eggs-Fridge/c/dairy-702702701', name: 'Dairy, Eggs & Fridge', latela_category: 'Groceries' },
  { slug: 'Frozen/c/frozen-702702704', name: 'Frozen', latela_category: 'Groceries' },
  { slug: 'Beverages/c/702702706', name: 'Beverages', latela_category: 'Groceries' },
  { slug: 'Beer-Wine-Spirits/c/702702707', name: 'Beer, Wine & Spirits', latela_category: 'Groceries' },
  { slug: 'Baby/c/702702713', name: 'Baby', latela_category: 'Baby & Child' },
  { slug: 'Health-Beauty/c/702702712', name: 'Health & Beauty', latela_category: 'Health & Beauty' },
  { slug: 'Household-Cleaning/c/702702710', name: 'Household', latela_category: 'Home & Household' },
  { slug: 'Pet/c/702702714', name: 'Pet', latela_category: 'Pet Care' },
];

const API_PATTERNS = ['/products', '/search', '/occ/', '/api/', '/pnpstorefront/'];

export class PnPScraper {
  private browser: Browser | null = null;
  private config = DEFAULT_CONFIG;
  private capturedProducts: any[] = [];

  async init(): Promise<void> {
    console.log('🛒 Initializing Pick n Pay Scraper...');
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
    return API_PATTERNS.some(p => url.includes(p)) && (url.includes('json') || url.includes('products'));
  }

  private extractProductsFromResponse(data: any): any[] {
    const products: any[] = [];
    if (data?.products) products.push(...data.products);
    if (data?.data?.products) products.push(...data.data.products);
    if (data?.results) products.push(...data.results);
    if (data?.searchResult?.products) products.push(...data.searchResult.products);
    return products;
  }

  private parseApiProduct(raw: any, categoryName: string): PnPProduct | null {
    try {
      let priceCents = 0, originalPriceCents: number | undefined;

      if (raw.price?.value) priceCents = Math.round(raw.price.value * 100);
      else if (typeof raw.price === 'number') priceCents = Math.round(raw.price * 100);

      if (raw.price?.was?.value) originalPriceCents = Math.round(raw.price.was.value * 100);
      else if (raw.wasPrice?.value) originalPriceCents = Math.round(raw.wasPrice.value * 100);

      const name = raw.name || raw.title || '';
      if (!name || priceCents === 0) return null;

      let imageUrl = raw.images?.[0]?.url || '';
      if (imageUrl && !imageUrl.startsWith('http')) imageUrl = `https://www.pnp.co.za${imageUrl}`;

      let productUrl = raw.url || '';
      if (productUrl && !productUrl.startsWith('http')) productUrl = `https://www.pnp.co.za${productUrl}`;

      return {
        code: String(raw.code || raw.id || `pnp_${Date.now()}`),
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
      document.querySelectorAll('[class*="product"], [data-product-id]').forEach(card => {
        const name = card.querySelector('[class*="name"], h3, h4')?.textContent?.trim();
        const price = card.querySelector('[class*="price"]')?.textContent?.trim();
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
      return { code: `pnp_${Date.now()}_${Math.random().toString(36).substr(2,9)}`, name: r.name, price_cents: cents, category: categoryName, on_sale: false, image_url: r.img || '', product_url: r.link || '', in_stock: true, scraped_at: new Date() } as PnPProduct;
    }).filter(Boolean) as PnPProduct[];
  }

  async scrapeCategory(slug: string, categoryName: string, maxPages = 3): Promise<PnPProduct[]> {
    const page = await this.createPage();
    this.capturedProducts = [];
    try {
      const url = PNP_URLS.category(slug);
      console.log(`📂 Scraping PnP: ${categoryName}\n   URL: ${url}`);
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
      console.log('🏷️  Scraping PnP Specials...');
      this.setupApiInterception(page, 'Specials');
      await page.goto(PNP_URLS.specials, { waitUntil: 'networkidle2', timeout: this.config.timeout });
      await sleep(5000); await this.scrollPage(page);
      this.capturedProducts.forEach(p => p.on_sale = true);
      console.log(`✅ Found ${this.capturedProducts.length} specials`);
    } catch (e) { console.error(`❌ Error: ${e}`); } finally { await page.close(); }
    return [...this.capturedProducts];
  }

  async scrapeAllCategories(maxPagesPerCategory = 3): Promise<{ products: PnPProduct[]; errors: string[]; stats: { total: number; categories: number; duration_ms: number } }> {
    const start = Date.now(), all: PnPProduct[] = [], errors: string[] = [];
    console.log('\n🛒 Starting PnP full scrape...\n');
    for (const cat of PNP_CATEGORIES) {
      try {
        const prods = await this.scrapeCategory(cat.slug, cat.name, maxPagesPerCategory);
        prods.forEach(p => { p.category = cat.latela_category; (p as any).subcategory = cat.name; });
        all.push(...prods);
        await sleep(this.config.requestDelay * 2);
      } catch (e) { errors.push(`${cat.name}: ${e}`); }
    }
    return { products: all, errors, stats: { total: all.length, categories: PNP_CATEGORIES.length, duration_ms: Date.now() - start } };
  }
}

export default PnPScraper;
