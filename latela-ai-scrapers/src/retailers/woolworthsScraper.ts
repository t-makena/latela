import { BaseScraper, ScrapedProduct } from '../base/baseScraper';
import { Page } from 'puppeteer';

export class WoolworthsScraper extends BaseScraper {
  private productGridSelectors = [
    '[data-testid="product-grid"]',
    '.product-grid',
    '.product-list',
    '[class*="ProductGrid"]',
    '[class*="product-grid"]',
    '.search-results',
    '[class*="SearchResults"]',
    '.product--grid',
    '[class*="product--grid"]',
    '.product-listing',
    '[class*="ProductListing"]',
    '.product-tile-list'
  ];

  constructor(maxPages: number = 10) {
    super('Woolworths', { maxPages });
  }

  protected getExtractionPrompt(): string {
    return `You are analyzing a Woolworths online shopping page screenshot. Extract ALL visible product information from the PRODUCT GRID only.

IMPORTANT: Only extract products from the main product listing/grid area. Do NOT extract:
- Promotional banners or carousel items
- Header/footer content
- Sidebar filters or recommendations
- "You might also like" sections

For each product in the main grid, extract:
1. Product name (full name including Woolworths branding if present)
2. Price in South African Rand (extract the number, e.g., "R 45.99" becomes 45.99)
3. Unit/size (e.g., "250g", "500ml", "per kg", "6 pack")
4. Category (if visible, e.g., "Fresh Food", "Pantry", "Health & Beauty")

Important Woolworths-specific rules:
- Look for "Smart Price" or promotional tags
- Extract "per kg" or "per 100g" pricing if shown
- Include product quality indicators (e.g., "Premium", "Organic", "Free Range")
- Watch for multi-buy deals (e.g., "2 for R50")
- Return ONLY a valid JSON array, no other text
- Each product must have: name, price (as number), unit (as string)

Example output format:
[
  {
    "name": "Woolworths Free Range Eggs Large",
    "price": 62.99,
    "unit": "18 pack",
    "category": "Fresh Food"
  },
  {
    "name": "Woolworths Ayrshire Milk Full Cream",
    "price": 24.99,
    "unit": "1L",
    "category": "Dairy"
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
        '.product--grid', 
        '[class*="ProductGrid"]', 
        '.search-results',
        '.product-listing',
        '.product-tile-list'
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
    console.log(`\n🛒 Starting Woolworths scraper for: ${url}`);
    
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

      // Woolworths may have additional loading time
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
          `woolworths-page${currentPage}-${Date.now()}.png`
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

      console.log(`\n✓ Total: Extracted ${allProducts.length} unique products from Woolworths`);

      return allProducts;

    } catch (error) {
      console.error('Woolworths scraping failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}
