import { BaseScraper, ScrapedProduct } from '../base/baseScraper';
import { Page } from 'puppeteer';

export class MakroScraper extends BaseScraper {
  private productGridSelectors = [
    '[data-testid="product-grid"]',
    '.product-grid',
    '.product-list',
    '[class*="ProductGrid"]',
    '[class*="product-grid"]',
    '.search-results',
    '[class*="SearchResults"]',
    '.product-listing',
    '[class*="productListing"]',
    '.plp-grid',
    '[class*="plp-grid"]',
    '.product-tile-grid'
  ];

  constructor(maxPages: number = 10) {
    super('Makro', { maxPages });
  }

  protected getExtractionPrompt(): string {
    return `You are analyzing a Makro (wholesale) online shopping page screenshot. Extract ALL visible product information from the PRODUCT GRID only.

IMPORTANT: Only extract products from the main product listing/grid area. Do NOT extract:
- Promotional banners or carousel items
- Header/footer content
- Sidebar filters or recommendations
- "Related products" sections

For each product in the main grid, extract:
1. Product name (full name as displayed)
2. Price in South African Rand (extract the number, e.g., "R 299.99" becomes 299.99)
3. Unit/size (bulk sizes common: "5kg", "2L", "case of 12", "6 x 330ml")
4. Category (if visible, e.g., "Groceries", "Liquor", "Electronics")

Important Makro-specific rules:
- Makro often shows bulk/wholesale pricing - capture the correct unit
- Look for "per unit" or "per case" pricing
- Member vs non-member prices may be shown - extract the member price if both present
- Watch for quantity requirements (e.g., "Min order: 2")
- Some prices may be ex-VAT - extract what's displayed
- Return ONLY a valid JSON array, no other text
- Each product must have: name, price (as number), unit (as string)

Example output format:
[
  {
    "name": "Coca-Cola Original Soft Drink",
    "price": 189.99,
    "unit": "case of 24 x 330ml",
    "category": "Beverages"
  },
  {
    "name": "Tastic Rice Long Grain",
    "price": 179.99,
    "unit": "10kg",
    "category": "Groceries"
  }
]

Return ONLY the JSON array, nothing else. If no products are visible, return: []`;
  }

  /**
   * Take a screenshot focused on the product grid area
   */
  private async takeProductGridScreenshot(page: Page, filename: string): Promise<string> {
    await this.scrollToLoadAllProducts(page);
    
    await page.evaluate(() => {
      const gridSelectors = [
        '.product-grid', 
        '.plp-grid', 
        '[class*="ProductGrid"]', 
        '.search-results',
        '.product-listing',
        '.product-tile-grid'
      ];
      
      for (const selector of gridSelectors) {
        const grid = document.querySelector(selector);
        if (grid) {
          grid.scrollIntoView({ behavior: 'instant', block: 'start' });
          window.scrollBy(0, -100);
          return;
        }
      }
      
      window.scrollTo(0, 250);
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return await this.takeScreenshot(page, filename);
  }

  async scrape(url: string): Promise<ScrapedProduct[]> {
    console.log(`\n🛒 Starting Makro scraper for: ${url}`);
    
    try {
      // Step 1: Validate URL
      const validation = await this.validateURL(url);
      if (!validation.isValid) {
        throw new Error(`URL validation failed: ${validation.error}`);
      }

      const baseUrl = validation.finalUrl || url;

      // Step 2: Initialize browser and navigate
      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setViewport({ width: 1920, height: 1080 });
      await this.navigateToPage(page, baseUrl);

      // Makro pages may load slowly - extra wait time
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Wait for product grid
      await this.waitForProductGrid(page, this.productGridSelectors);

      // Step 4: Get total pages
      const totalPages = await this.getTotalPages(page);
      console.log(`📄 Found ${totalPages} page(s) to scrape`);

      const allProducts: ScrapedProduct[] = [];
      const seenProducts = new Set<string>();

      // Step 5: Scrape each page
      for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        console.log(`\n📄 Scraping page ${currentPage} of ${totalPages}...`);

        if (currentPage > 1) {
          const navigated = await this.goToPage(page, currentPage, baseUrl);
          if (!navigated) {
            console.log(`⚠ Could not navigate to page ${currentPage}, stopping pagination`);
            break;
          }
          await this.waitForProductGrid(page, this.productGridSelectors);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const screenshotPath = await this.takeProductGridScreenshot(
          page,
          `makro-page${currentPage}-${Date.now()}.png`
        );

        try {
          const products = await this.extractWithAI(
            screenshotPath,
            this.getExtractionPrompt()
          );

          const { newProducts, count } = this.deduplicateProducts(products, seenProducts);
          
          for (const product of newProducts) {
            allProducts.push({
              ...product,
              url: baseUrl
            });
          }

          console.log(`✓ Page ${currentPage}: Found ${products.length} products (${count} new)`);

          if (count === 0 && currentPage > 1) {
            console.log('⚠ No new products found, stopping pagination');
            break;
          }

        } catch (extractError) {
          console.error(`⚠ Failed to extract from page ${currentPage}:`, extractError);
        }

        await this.deleteScreenshot(screenshotPath);

        if (currentPage < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      await page.close();

      console.log(`\n✓ Total: Extracted ${allProducts.length} unique products from Makro`);

      return allProducts;

    } catch (error) {
      console.error('Makro scraping failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}
