import { Browser, Page } from 'puppeteer';

export interface CategoryURL {
  name: string;
  url: string;
  productCount?: number;
}

export interface StoreNavigation {
  store: string;
  baseUrl: string;
  categories: CategoryURL[];
  discoveredAt: Date;
}

/**
 * Base class for discovering category URLs from store navigation
 */
export abstract class URLDiscovery {
  protected browser: Browser | null = null;
  protected store: string;
  protected baseUrl: string;

  constructor(store: string, baseUrl: string) {
    this.store = store;
    this.baseUrl = baseUrl;
  }

  /**
   * Discover all category URLs from the store's navigation
   */
  abstract discoverCategories(browser: Browser): Promise<CategoryURL[]>;

  /**
   * Validate that a URL returns products (not a 404 or empty page)
   */
  async validateCategoryURL(page: Page, url: string): Promise<boolean> {
    try {
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      if (!response || response.status() >= 400) {
        console.log(`  ✗ Invalid URL (${response?.status() || 'no response'}): ${url}`);
        return false;
      }

      // Check if page has products
      const hasProducts = await page.evaluate(`(() => {
        var indicators = ['[class*="product"]', '[class*="Product"]', '[data-testid*="product"]', '.item-grid', '.search-results'];
        for (var i = 0; i < indicators.length; i++) {
          if (document.querySelectorAll(indicators[i]).length > 0) return true;
        }
        var pageText = document.body.innerText.toLowerCase();
        if (pageText.includes('no results') || pageText.includes('no products') || pageText.includes("page can't be found") || pageText.includes('page not found')) return false;
        return true;
      })()`);

      if (!hasProducts) {
        console.log(`  ✗ No products found: ${url}`);
        return false;
      }

      console.log(`  ✓ Valid: ${url}`);
      return true;
    } catch (error) {
      console.log(`  ✗ Error validating: ${url}`);
      return false;
    }
  }

  /**
   * Get product count from a category page (if visible)
   */
  async getProductCount(page: Page): Promise<number | undefined> {
    try {
      const count = await page.evaluate(`(() => {
        var patterns = [/(\\d+)\\s*results/i, /(\\d+)\\s*products/i, /(\\d+)\\s*items/i, /showing\\s*\\d+\\s*-\\s*\\d+\\s*of\\s*(\\d+)/i];
        var text = document.body.innerText;
        for (var i = 0; i < patterns.length; i++) {
          var match = text.match(patterns[i]);
          if (match) return parseInt(match[1]);
        }
        return undefined;
      })()`);
      
      return count as number | undefined;
    } catch {
      return undefined;
    }
  }
}

/**
 * Woolworths URL Discovery
 */
export class WoolworthsURLDiscovery extends URLDiscovery {
  constructor() {
    super('Woolworths', 'https://www.woolworths.co.za');
  }

  async discoverCategories(browser: Browser): Promise<CategoryURL[]> {
    console.log(`\n🔍 Discovering Woolworths category URLs...`);
    
    const page = await browser.newPage();
    const categories: CategoryURL[] = [];

    try {
      // Navigate to the Food section
      await page.goto(`${this.baseUrl}/cat/Food/_/N-1z13sk5`, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Wait for navigation to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Extract category links from the navigation/sidebar
      const discoveredUrls = await page.evaluate(`(() => {
        var baseUrl = "${this.baseUrl}";
        var categories = [];
        var linkSelectors = [
          'nav a[href*="/cat/Food/"]',
          '[class*="nav"] a[href*="/cat/Food/"]',
          '[class*="category"] a[href*="/cat/Food/"]',
          '[class*="sidebar"] a[href*="/cat/Food/"]',
          '[class*="menu"] a[href*="/cat/Food/"]',
          'a[href*="/cat/Food/"][href*="/_/N-"]'
        ];
        var seenUrls = {};
        for (var s = 0; s < linkSelectors.length; s++) {
          var links = document.querySelectorAll(linkSelectors[s]);
          for (var i = 0; i < links.length; i++) {
            var href = links[i].href;
            var text = links[i].textContent ? links[i].textContent.trim() : "";
            if (href && text && !seenUrls[href]) {
              if (href.includes('/cat/Food/') && !href.includes('javascript:') && href.startsWith(baseUrl)) {
                seenUrls[href] = true;
                categories.push({ name: text, url: href });
              }
            }
          }
        }
        return categories;
      })()`) as { name: string; url: string }[];

      console.log(`  Found ${discoveredUrls.length} potential category URLs`);

      // Validate each URL
      console.log(`  Validating URLs...`);
      for (const cat of discoveredUrls) {
        const isValid = await this.validateCategoryURL(page, cat.url);
        if (isValid) {
          const productCount = await this.getProductCount(page);
          categories.push({
            name: cat.name,
            url: cat.url,
            productCount
          });
        }
      }

      // If no categories found from navigation, use known working categories
      if (categories.length === 0) {
        console.log(`  ⚠ No categories discovered from navigation, using fallback discovery...`);
        
        // Try to discover from the main food page's content
        await page.goto(`${this.baseUrl}/cat/Food/_/N-1z13sk5`, {
          waitUntil: 'networkidle2',
          timeout: 60000
        });

        const fallbackUrls = await page.evaluate(`(() => {
          var baseUrl = "${this.baseUrl}";
          var categories = [];
          var links = document.querySelectorAll('a[href*="/cat/Food/"]');
          var seenUrls = {};
          for (var i = 0; i < links.length; i++) {
            var href = links[i].href;
            var text = links[i].textContent ? links[i].textContent.trim() : "";
            if (href && text && text.length > 2 && text.length < 50 && !seenUrls[href]) {
              if (href.includes('/_/N-') && href.startsWith(baseUrl)) {
                seenUrls[href] = true;
                categories.push({ name: text, url: href });
              }
            }
          }
          return categories;
        })()`) as { name: string; url: string }[];

        for (const cat of fallbackUrls.slice(0, 20)) { // Limit to first 20
          const isValid = await this.validateCategoryURL(page, cat.url);
          if (isValid) {
            categories.push({
              name: cat.name,
              url: cat.url
            });
          }
        }
      }

    } catch (error) {
      console.error('Failed to discover Woolworths categories:', error);
    } finally {
      await page.close();
    }

    console.log(`✓ Discovered ${categories.length} valid Woolworths categories\n`);
    return categories;
  }
}

/**
 * Pick n Pay URL Discovery
 */
export class PnPURLDiscovery extends URLDiscovery {
  constructor() {
    super('Pick n Pay', 'https://www.pnp.co.za');
  }

  async discoverCategories(browser: Browser): Promise<CategoryURL[]> {
    console.log(`\n🔍 Discovering Pick n Pay category URLs...`);
    
    const page = await browser.newPage();
    const categories: CategoryURL[] = [];

    try {
      await page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try to open the shop menu/navigation
      try {
        const menuButton = await page.$('[class*="menu"], [class*="nav"] button, [aria-label*="menu"]');
        if (menuButton) {
          await menuButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch {
        // Menu might already be visible
      }

      const discoveredUrls = await page.evaluate(`(() => {
        var baseUrl = "${this.baseUrl}";
        var categories = [];
        var seenUrls = {};
        var linkSelectors = ['a[href*="/c/"]', 'a[href*="/category/"]', 'nav a', '[class*="nav"] a', '[class*="menu"] a', '[class*="category"] a'];
        for (var s = 0; s < linkSelectors.length; s++) {
          var links = document.querySelectorAll(linkSelectors[s]);
          for (var i = 0; i < links.length; i++) {
            var href = links[i].href;
            var text = links[i].textContent ? links[i].textContent.trim() : "";
            if (href && text && text.length > 2 && text.length < 50 && !seenUrls[href]) {
              if ((href.includes('/c/') || href.includes('/category/') || href.includes('/search')) && href.startsWith(baseUrl) && !href.includes('javascript:')) {
                seenUrls[href] = true;
                categories.push({ name: text, url: href });
              }
            }
          }
        }
        return categories;
      })()`) as { name: string; url: string }[];

      console.log(`  Found ${discoveredUrls.length} potential category URLs`);

      // Validate URLs
      console.log(`  Validating URLs...`);
      for (const cat of discoveredUrls.slice(0, 30)) { // Limit validation
        const isValid = await this.validateCategoryURL(page, cat.url);
        if (isValid) {
          const productCount = await this.getProductCount(page);
          categories.push({
            name: cat.name,
            url: cat.url,
            productCount
          });
        }
      }

    } catch (error) {
      console.error('Failed to discover PnP categories:', error);
    } finally {
      await page.close();
    }

    console.log(`✓ Discovered ${categories.length} valid Pick n Pay categories\n`);
    return categories;
  }
}

/**
 * Checkers URL Discovery
 */
export class CheckersURLDiscovery extends URLDiscovery {
  constructor() {
    super('Checkers', 'https://www.checkers.co.za');
  }

  async discoverCategories(browser: Browser): Promise<CategoryURL[]> {
    console.log(`\n🔍 Discovering Checkers category URLs...`);
    
    const page = await browser.newPage();
    const categories: CategoryURL[] = [];

    try {
      await page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const discoveredUrls = await page.evaluate(`(() => {
        var baseUrl = "${this.baseUrl}";
        var categories = [];
        var seenUrls = {};
        var linkSelectors = ['a[href*="/c-"]', 'a[href*="/category"]', 'nav a', '[class*="nav"] a', '[class*="menu"] a', '[class*="category"] a'];
        for (var s = 0; s < linkSelectors.length; s++) {
          var links = document.querySelectorAll(linkSelectors[s]);
          for (var i = 0; i < links.length; i++) {
            var href = links[i].href;
            var text = links[i].textContent ? links[i].textContent.trim() : "";
            if (href && text && text.length > 2 && text.length < 50 && !seenUrls[href]) {
              if (href.startsWith(baseUrl) && !href.includes('javascript:')) {
                seenUrls[href] = true;
                categories.push({ name: text, url: href });
              }
            }
          }
        }
        return categories;
      })()`) as { name: string; url: string }[];

      console.log(`  Found ${discoveredUrls.length} potential category URLs`);

      console.log(`  Validating URLs...`);
      for (const cat of discoveredUrls.slice(0, 30)) {
        const isValid = await this.validateCategoryURL(page, cat.url);
        if (isValid) {
          const productCount = await this.getProductCount(page);
          categories.push({
            name: cat.name,
            url: cat.url,
            productCount
          });
        }
      }

    } catch (error) {
      console.error('Failed to discover Checkers categories:', error);
    } finally {
      await page.close();
    }

    console.log(`✓ Discovered ${categories.length} valid Checkers categories\n`);
    return categories;
  }
}

/**
 * Makro URL Discovery
 */
export class MakroURLDiscovery extends URLDiscovery {
  constructor() {
    super('Makro', 'https://www.makro.co.za');
  }

  async discoverCategories(browser: Browser): Promise<CategoryURL[]> {
    console.log(`\n🔍 Discovering Makro category URLs...`);
    
    const page = await browser.newPage();
    const categories: CategoryURL[] = [];

    try {
      await page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const discoveredUrls = await page.evaluate(`(() => {
        var baseUrl = "${this.baseUrl}";
        var categories = [];
        var seenUrls = {};
        var linkSelectors = ['a[href*="/c/"]', 'a[href*="/category"]', 'nav a', '[class*="nav"] a', '[class*="menu"] a', '[class*="category"] a'];
        for (var s = 0; s < linkSelectors.length; s++) {
          var links = document.querySelectorAll(linkSelectors[s]);
          for (var i = 0; i < links.length; i++) {
            var href = links[i].href;
            var text = links[i].textContent ? links[i].textContent.trim() : "";
            if (href && text && text.length > 2 && text.length < 50 && !seenUrls[href]) {
              if (href.startsWith(baseUrl) && !href.includes('javascript:')) {
                seenUrls[href] = true;
                categories.push({ name: text, url: href });
              }
            }
          }
        }
        return categories;
      })()`) as { name: string; url: string }[];

      console.log(`  Found ${discoveredUrls.length} potential category URLs`);

      console.log(`  Validating URLs...`);
      for (const cat of discoveredUrls.slice(0, 30)) {
        const isValid = await this.validateCategoryURL(page, cat.url);
        if (isValid) {
          const productCount = await this.getProductCount(page);
          categories.push({
            name: cat.name,
            url: cat.url,
            productCount
          });
        }
      }

    } catch (error) {
      console.error('Failed to discover Makro categories:', error);
    } finally {
      await page.close();
    }

    console.log(`✓ Discovered ${categories.length} valid Makro categories\n`);
    return categories;
  }
}

/**
 * Factory function to get URL discovery for a store
 */
export function getURLDiscovery(store: string): URLDiscovery {
  const storeLower = store.toLowerCase();
  
  if (storeLower.includes('woolworth')) {
    return new WoolworthsURLDiscovery();
  }
  if (storeLower.includes('pnp') || storeLower.includes('pick')) {
    return new PnPURLDiscovery();
  }
  if (storeLower.includes('checker') || storeLower.includes('shoprite')) {
    return new CheckersURLDiscovery();
  }
  if (storeLower.includes('makro')) {
    return new MakroURLDiscovery();
  }
  
  throw new Error(`No URL discovery available for store: ${store}`);
}
