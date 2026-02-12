import { BaseScraper, ScrapedProduct } from '../base/baseScraper';
import { Page } from 'puppeteer';

export class PnPScraper extends BaseScraper {
  private productGridSelectors = [
    '[data-testid="product-grid"]',
    '.product-grid',
    '.product-list',
    '[class*="ProductGrid"]',
    '[class*="product-grid"]',
    '.search-results',
    '[class*="SearchResults"]',
    '.plp-product-list',
    '[class*="plp-product"]',
    '.product-card',
    '[class*="ProductCard"]',
    '[class*="productList"]'
  ];

  constructor(maxPages: number = 10) {
    super('Pick n Pay', { maxPages });
  }

  protected getExtractionPrompt(): string {
    return `You are analyzing a Pick n Pay online shopping page screenshot. Extract ALL visible product information from the PRODUCT GRID only.

IMPORTANT: Only extract products from the main product listing/grid area. Do NOT extract:
- Promotional banners or carousel items at the top
- Header/footer content
- Sidebar recommendations
- "Customers also bought" sections
- Advertisement banners

For each product in the main grid, extract:
1. Product name (full name as shown on the product card)
2. Price in South African Rand (the main price shown, e.g., "R94.99" becomes 94.99)
3. Unit/size (e.g., "500g", "1L", "6 x 1L", "2L", "each")
4. Category (if visible, e.g., "Dairy", "Milk", "Fresh Produce")

Important rules:
- Extract the CURRENT price (sale prices are usually in red/bold, original prices may be crossed out)
- Look for unit size in the product name or below it
- Include ALL products visible in the main product grid
- Return ONLY a valid JSON array, no other text
- Each product must have: name, price (as number), unit (as string)
- Category is optional but include if you can determine it

Example output format:
[
  {
    "name": "PnP UHT Full Cream Milk 6 x 1L",
    "price": 94.99,
    "unit": "6 x 1L",
    "category": "Dairy"
  },
  {
    "name": "Clover Full Cream Fresh Milk",
    "price": 32.99,
    "unit": "2L",
    "category": "Dairy"
  }
]

Return ONLY the JSON array, nothing else. If no products are visible in the grid, return: []`;
  }

  /**
   * Take a screenshot focused on the product grid area
   */
  private async takeProductGridScreenshot(page: Page, filename: string): Promise<string> {
    // Scroll to load all lazy-loaded products
    await this.scrollToLoadAllProducts(page);
    
    // Scroll to show the product grid (skip promotional banners at top)
    await page.evaluate(() => {
      const gridSelectors = [
        '.product-grid', 
        '.plp-product-list', 
        '[class*="ProductGrid"]', 
        '.search-results',
        '[class*="productList"]',
        '[class*="product-list"]'
      ];
      
      for (const selector of gridSelectors) {
        const grid = document.querySelector(selector);
        if (grid) {
          grid.scrollIntoView({ behavior: 'instant', block: 'start' });
          window.scrollBy(0, -100); // Small offset for context
          return;
        }
      }
      
      // Fallback: scroll past typical header/banner area
      window.scrollTo(0, 250);
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return await this.takeScreenshot(page, filename);
  }

  async scrape(url: string): Promise<ScrapedProduct[]> {
    console.log(`\n🛒 Starting Pick n Pay scraper for: ${url}`);
    
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
        }

        // Take screenshot of product grid
        const screenshotPath = await this.takeProductGridScreenshot(
          page,
          `pnp-page${currentPage}-${Date.now()}.png`
        );

        // Extract data using AI
        try {
          const products = await this.extractWithAI(
            screenshotPath,
            this.getExtractionPrompt()
          );

          // Deduplicate and add URL
          const { newProducts, count } = this.deduplicateProducts(products, seenProducts);
          
          for (const product of newProducts) {
            allProducts.push({
              ...product,
              url: baseUrl
            });
          }

          console.log(`✓ Page ${currentPage}: Found ${products.length} products (${count} new)`);

          // Stop if no new products found (probably reached end)
          if (count === 0 && currentPage > 1) {
            console.log('⚠ No new products found, stopping pagination');
            break;
          }

        } catch (extractError) {
          console.error(`⚠ Failed to extract from page ${currentPage}:`, extractError);
        }

        // Clean up screenshot
        await this.deleteScreenshot(screenshotPath);

        // Respectful delay between pages
        if (currentPage < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      await page.close();

      console.log(`\n✓ Total: Extracted ${allProducts.length} unique products from Pick n Pay`);

      return allProducts;

    } catch (error) {
      console.error('Pick n Pay scraping failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}
