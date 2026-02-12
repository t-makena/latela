import puppeteer, { Browser, Page } from 'puppeteer';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export interface ScrapedProduct {
  name: string;
  price: number;
  unit?: string;
  category?: string;
  store: string;
  url: string;
  scrapedAt: Date;
}

export interface URLValidationResult {
  isValid: boolean;
  statusCode?: number;
  error?: string;
  finalUrl?: string;
}

export interface PaginationConfig {
  maxPages: number;
  productsPerPage?: number;
}

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected anthropic: Anthropic;
  protected store: string;
  protected screenshotDir: string;
  protected paginationConfig: PaginationConfig;

  constructor(storeName: string, paginationConfig?: Partial<PaginationConfig>) {
    this.store = storeName;
    this.screenshotDir = path.join(process.cwd(), 'temp_screenshots');
    this.paginationConfig = {
      maxPages: paginationConfig?.maxPages ?? 10,
      productsPerPage: paginationConfig?.productsPerPage ?? 24
    };
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Initialize browser with stealth settings
   */
  protected async initBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      ]
    });

    return this.browser;
  }

  /**
   * Validate URL before scraping - checks if URL is accessible
   */
  protected async validateURL(url: string): Promise<URLValidationResult> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      console.log(`Validating URL: ${url}`);
      
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      if (!response) {
        return {
          isValid: false,
          error: 'No response received from URL'
        };
      }

      const statusCode = response.status();
      const finalUrl = response.url();

      if (statusCode >= 200 && statusCode < 300) {
        console.log(`✓ URL validated successfully (${statusCode})`);
        return {
          isValid: true,
          statusCode,
          finalUrl
        };
      }

      if (statusCode >= 300 && statusCode < 400) {
        console.log(`⚠ URL redirected (${statusCode}) to: ${finalUrl}`);
        return {
          isValid: true,
          statusCode,
          finalUrl
        };
      }

      return {
        isValid: false,
        statusCode,
        error: `URL returned status code ${statusCode}`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`✗ URL validation failed: ${errorMessage}`);
      
      return {
        isValid: false,
        error: errorMessage
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Take a screenshot and ensure directory exists
   */
  protected async takeScreenshot(page: Page, filename: string): Promise<string> {
    await fs.mkdir(this.screenshotDir, { recursive: true });
    
    const filepath = path.join(this.screenshotDir, filename);
    await page.screenshot({ 
      path: filepath, 
      fullPage: true 
    });
    
    console.log(`Screenshot saved: ${filepath}`);
    return filepath;
  }

  /**
   * Convert screenshot to base64 for Claude API, resizing if needed to fit within limits
   */
  protected async screenshotToBase64(screenshotPath: string): Promise<string> {
    // Read the image and resize to fit within Claude's 8000px limit
    const resizedBuffer = await sharp(screenshotPath)
      .resize({
        width: 1600,
        height: 7500,
        fit: 'inside',
        withoutEnlargement: true
      })
      .png()
      .toBuffer();
    
    return resizedBuffer.toString('base64');
  }

  /**
   * Delete screenshot file
   */
  protected async deleteScreenshot(screenshotPath: string): Promise<void> {
    try {
      await fs.unlink(screenshotPath);
      console.log(`Screenshot deleted: ${screenshotPath}`);
    } catch (error) {
      console.error(`Failed to delete screenshot: ${screenshotPath}`, error);
    }
  }

  /**
   * Delete all screenshots in the temp directory
   */
  protected async cleanupScreenshots(): Promise<void> {
    try {
      const files = await fs.readdir(this.screenshotDir);
      
      for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.jpg')) {
          await this.deleteScreenshot(path.join(this.screenshotDir, file));
        }
      }
      
      console.log(`Cleaned up ${files.length} screenshot(s)`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Failed to cleanup screenshots:', error);
      }
    }
  }

  /**
   * Extract product data using Claude Vision API
   */
  protected async extractWithAI(
    screenshotPath: string,
    extractionPrompt: string
  ): Promise<ScrapedProduct[]> {
    const base64Image = await this.screenshotToBase64(screenshotPath);

    try {
      console.log('Sending screenshot to Claude for analysis...');
      
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: extractionPrompt,
              },
            ],
          },
        ],
      });

      const responseText = message.content[0].type === 'text' 
        ? message.content[0].text 
        : '';

      console.log('Claude response received');
      console.log('Response preview:', responseText.substring(0, 500));

      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('Full Claude response:', responseText);
        
        if (responseText.toLowerCase().includes('no product') || 
            responseText.toLowerCase().includes('login') ||
            responseText.toLowerCase().includes('cookie consent') ||
            responseText.toLowerCase().includes('empty')) {
          console.log('⚠️ Claude detected no products on page');
          return [];
        }
        
        throw new Error('No valid JSON array found in Claude response');
      }

      const products: ScrapedProduct[] = JSON.parse(jsonMatch[0]);
      
      return products.map(product => ({
        ...product,
        store: this.store,
        scrapedAt: new Date()
      }));

    } catch (error) {
      console.error('AI extraction failed:', error);
      throw error;
    }
  }

  /**
   * Handle cookie consent and other popups
   */
  protected async handlePopups(page: Page): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Location/delivery address popups
      const locationDismissSelectors = [
        'button:has-text("Do this later")',
        'button:has-text("Skip")',
        'button:has-text("Maybe later")',
        'button:has-text("Not now")',
        '[aria-label="Close"]',
        'button[class*="close"]',
        'button[class*="dismiss"]',
        '[data-testid*="close"]',
        '[data-testid*="dismiss"]',
        '.modal-close',
        '[class*="modal"] button[class*="close"]',
      ];
      
      for (const selector of locationDismissSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            console.log(`Dismissing location/popup: ${selector}`);
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Cookie consent banners
      const cookieSelectors = [
        'button[id*="accept"]',
        'button[class*="accept"]',
        'button:has-text("Accept")',
        'button:has-text("I Accept")',
        'button:has-text("Accept All")',
        '[class*="cookie"] button',
        '#onetrust-accept-btn-handler',
        '.cookie-accept',
        '[data-testid*="accept"]',
      ];
      
      for (const selector of cookieSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            console.log(`Clicking cookie consent button: ${selector}`);
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
    } catch (error) {
      console.log('No popups found or already dismissed');
    }
  }

  /**
   * Wait for the product grid to be visible
   */
  protected async waitForProductGrid(page: Page, selectors: string[]): Promise<boolean> {
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        console.log(`✓ Found product grid with selector: ${selector}`);
        return true;
      } catch {
        // Try next selector
      }
    }

    // Fallback: wait for any product-like elements
    try {
      await page.waitForSelector('[class*="product"]', { timeout: 5000 });
      console.log('✓ Found products with generic selector');
      return true;
    } catch {
      console.log('⚠ Could not find product grid, proceeding anyway');
      return false;
    }
  }

  /**
   * Scroll through the page to load lazy-loaded products
   */
  protected async scrollToLoadAllProducts(page: Page): Promise<void> {
    console.log('Scrolling to load all products...');
    
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const totalHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      let currentPosition = 0;
      
      while (currentPosition < totalHeight) {
        window.scrollTo(0, currentPosition);
        await delay(300);
        currentPosition += viewportHeight * 0.8;
      }
      
      // Scroll back to top
      window.scrollTo(0, 0);
      await delay(500);
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Get total number of pages from pagination
   */
  protected async getTotalPages(page: Page): Promise<number> {
    try {
      const totalPages = await page.evaluate(() => {
        // Look for "Page X of Y" text
        const pageText = document.body.innerText.match(/Page\s*\d+\s*of\s*(\d+)/i);
        if (pageText) return parseInt(pageText[1]);

        // Look for "Showing X-Y of Z" text
        const showingText = document.body.innerText.match(/of\s*(\d+)\s*(?:results|products|items)/i);
        if (showingText) {
          const totalProducts = parseInt(showingText[1]);
          // Estimate pages (assuming ~24 products per page)
          return Math.ceil(totalProducts / 24);
        }

        // Look for pagination buttons
        const paginationButtons = document.querySelectorAll(
          '.pagination a, .pagination button, [class*="pagination"] a, [class*="Pagination"] button, nav[aria-label*="pagination"] a, [class*="pager"] a'
        );
        
        let maxPage = 1;
        paginationButtons.forEach((btn) => {
          const text = btn.textContent?.trim();
          const num = parseInt(text || '0');
          if (!isNaN(num) && num > maxPage) {
            maxPage = num;
          }
        });

        return maxPage;
      });

      return Math.min(totalPages, this.paginationConfig.maxPages);
    } catch {
      return 1;
    }
  }

  /**
   * Navigate to a specific page
   */
  protected async goToPage(page: Page, pageNum: number, baseUrl: string): Promise<boolean> {
    try {
      // Try clicking pagination button first
      const clicked = await page.evaluate((targetPage) => {
        const buttons = document.querySelectorAll(
          '.pagination a, .pagination button, [class*="pagination"] a, [class*="Pagination"] button, nav[aria-label*="pagination"] a, [class*="pager"] a'
        );
        
        for (const btn of buttons) {
          if (btn.textContent?.trim() === String(targetPage)) {
            (btn as HTMLElement).click();
            return true;
          }
        }
        return false;
      }, pageNum);

      if (clicked) {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      }

      // Fallback: modify URL with page parameter
      const url = new URL(baseUrl);
      url.searchParams.set('page', String(pageNum));
      
      await page.goto(url.toString(), {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      await this.handlePopups(page);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (error) {
      console.error(`Failed to navigate to page ${pageNum}:`, error);
      return false;
    }
  }

  /**
   * Navigate to URL and wait for content
   */
  protected async navigateToPage(page: Page, url: string): Promise<void> {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await this.handlePopups(page);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Close browser and cleanup
   */
  protected async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    await this.cleanupScreenshots();
  }

  /**
   * Deduplicate products based on name and price
   */
  protected deduplicateProducts(
    products: ScrapedProduct[],
    seenProducts: Set<string>
  ): { newProducts: ScrapedProduct[]; count: number } {
    const newProducts: ScrapedProduct[] = [];
    
    for (const product of products) {
      const key = `${product.name.toLowerCase()}-${product.price}`;
      if (!seenProducts.has(key)) {
        seenProducts.add(key);
        newProducts.push(product);
      }
    }
    
    return { newProducts, count: newProducts.length };
  }

  /**
   * Main scraping method - to be implemented by child classes
   */
  abstract scrape(url: string): Promise<ScrapedProduct[]>;

  /**
   * Get extraction prompt for AI - to be implemented by child classes
   */
  protected abstract getExtractionPrompt(): string;
}
