# Latela AI-First Price Scrapers

AI-powered web scrapers for South African grocery stores, built for the Latela budgeting app.

## Overview

This scraping system uses Claude Haiku's vision capabilities to extract product and pricing data from South African grocery retailer websites. The AI-first approach provides reliability across different website layouts and updates.

## Supported Stores

- **Pick n Pay** (pnp.co.za)
- **Checkers** (checkers.co.za)
- **Shoprite** (shoprite.co.za)
- **Woolworths** (woolworths.co.za)
- **Makro** (makro.co.za)

## Architecture

### Key Features

1. **AI-First Extraction**: Uses Claude Haiku Vision API to analyze page screenshots
2. **URL Validation Layer**: Validates URLs before scraping to ensure they're accessible
3. **Automatic Cleanup**: Screenshots are automatically deleted after processing
4. **Store Detection**: Automatically selects the right scraper based on URL
5. **Error Handling**: Comprehensive error handling and logging
6. **Batch Processing**: Support for scraping multiple URLs

### How It Works

```
URL Input → Validate URL → Navigate & Screenshot → AI Extraction → Cleanup → Return Data
```

Each scraper follows this workflow:
1. **URL Validation**: Checks if URL is accessible (HTTP status, redirects, etc.)
2. **Browser Navigation**: Uses Puppeteer with stealth settings to load the page
3. **Screenshot Capture**: Takes full-page screenshot for AI analysis
4. **AI Processing**: Sends screenshot to Claude Haiku with store-specific prompts
5. **Data Parsing**: Extracts structured product data (name, price, unit, category)
6. **Cleanup**: Deletes screenshots to free up disk space

## Installation

```bash
npm install puppeteer @anthropic-ai/sdk
```

## Environment Setup

Create a `.env` file:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

## Usage

### Basic Usage

```typescript
import { scrapeURL } from './scrapers';

// Scrape a single URL
const products = await scrapeURL('https://www.pnp.co.za/search?q=milk');

console.log(`Found ${products.length} products`);
products.forEach(product => {
  console.log(`${product.name}: R${product.price} (${product.unit})`);
});
```

### Using Specific Scrapers

```typescript
import { PnPScraper, WoolworthsScraper } from './scrapers';

// Pick n Pay
const pnpScraper = new PnPScraper();
const pnpProducts = await pnpScraper.scrape('https://www.pnp.co.za/...');

// Woolworths
const woolworthsScraper = new WoolworthsScraper();
const woolworthsProducts = await woolworthsScraper.scrape('https://www.woolworths.co.za/...');
```

### Batch Scraping

```typescript
import { scrapeMultipleURLs } from './scrapers';

const urls = [
  'https://www.pnp.co.za/search?q=bread',
  'https://www.checkers.co.za/search?q=milk',
  'https://www.woolworths.co.za/search?q=eggs'
];

const results = await scrapeMultipleURLs(urls);

console.log(`Successfully scraped: ${results.success.length}`);
console.log(`Failed: ${results.failed.length}`);

// Process successful results
results.success.forEach(({ url, products }) => {
  console.log(`\n${url}: ${products.length} products`);
});

// Handle failures
results.failed.forEach(({ url, error }) => {
  console.error(`Failed ${url}: ${error}`);
});
```

### Using Store Type Enum

```typescript
import { getScraperByStore, StoreType } from './scrapers';

const scraper = getScraperByStore(StoreType.PICK_N_PAY);
const products = await scraper.scrape('https://www.pnp.co.za/...');
```

## Data Structure

### ScrapedProduct

```typescript
interface ScrapedProduct {
  name: string;          // "Albany Superior Low GI Brown Bread"
  price: number;         // 18.99 (always in Rands)
  unit?: string;         // "700g"
  category?: string;     // "Bakery"
  store: string;         // "Pick n Pay"
  url: string;           // URL where product was found
  scrapedAt: Date;       // Timestamp of scraping
}
```

## Store-Specific Notes

### Pick n Pay
- Handles both Rand and cent pricing formats
- Extracts sale/promotional prices
- Full product names with variants

### Checkers/Shoprite
- Shared scraper (same parent company)
- Detects store name from URL
- Handles promotional offers
- Price per unit extraction

### Woolworths
- Includes quality indicators (Premium, Organic, Free Range)
- Smart Price detection
- Multi-buy deals
- Per kg/100g pricing

### Makro
- Wholesale/bulk pricing
- Case and multi-unit products
- Member vs non-member prices
- Minimum order quantities

## API Costs

Using Claude Haiku 4 (claude-haiku-4-20250514):
- **Input**: ~$0.80 per million tokens
- **Output**: ~$4.00 per million tokens
- **Average cost per screenshot**: ~$0.01-0.03 per page
- **Estimated monthly cost** (1000 scrapes): ~$10-30

## Error Handling

```typescript
try {
  const products = await scrapeURL(url);
} catch (error) {
  if (error.message.includes('URL validation failed')) {
    console.error('Invalid or inaccessible URL');
  } else if (error.message.includes('No valid JSON')) {
    console.error('Failed to parse AI response');
  } else {
    console.error('Scraping failed:', error);
  }
}
```

## Extending the System

### Adding a New Store

1. Create a new scraper class extending `BaseScraper`:

```typescript
import { BaseScraper, ScrapedProduct } from './baseScraper';

export class NewStoreScraper extends BaseScraper {
  constructor() {
    super('New Store Name');
  }

  protected getExtractionPrompt(): string {
    return `Your store-specific extraction prompt...`;
  }

  async scrape(url: string): Promise<ScrapedProduct[]> {
    // Follow the standard workflow:
    // 1. Validate URL
    // 2. Navigate and screenshot
    // 3. Extract with AI
    // 4. Cleanup
    // 5. Return products
  }
}
```

2. Add to `index.ts`:
   - Export the scraper
   - Add to `getScraperForURL()` function
   - Add to `StoreType` enum
   - Update `getScraperByStore()` switch statement

## Performance Tips

1. **Rate Limiting**: Add delays between requests to avoid being blocked
2. **Parallel Scraping**: Use `Promise.all()` carefully to avoid overwhelming servers
3. **Caching**: Cache results for frequently accessed pages
4. **Screenshot Quality**: Adjust screenshot settings if AI accuracy is low

## Troubleshooting

### "URL validation failed"
- Check if URL is accessible in a browser
- Verify internet connection
- Store website may be down

### "No valid JSON array found"
- AI response parsing failed
- Screenshot may be unclear
- Store layout may have changed significantly

### Screenshots not deleted
- Check permissions on temp_screenshots directory
- Ensure cleanup() is called in finally block
- Manual cleanup: delete temp_screenshots folder

## Best Practices

1. **Always validate URLs** before scraping
2. **Handle errors gracefully** - stores may be temporarily unavailable
3. **Clean up resources** - use try/finally blocks
4. **Monitor API costs** - Claude API usage
5. **Test regularly** - store websites change frequently
6. **Rate limit requests** - be respectful to store servers

## Integration with Latela

### Storing in Supabase

```typescript
import { scrapeURL } from './scrapers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function saveProductPrices(url: string) {
  const products = await scrapeURL(url);
  
  const { data, error } = await supabase
    .from('grocery_prices')
    .insert(
      products.map(p => ({
        product_name: p.name,
        price_cents: Math.round(p.price * 100), // Store in cents
        unit: p.unit,
        store: p.store,
        category: p.category,
        scraped_at: p.scrapedAt
      }))
    );
    
  if (error) throw error;
  return data;
}
```

### Vercel Edge Function Example

```typescript
// api/scrape-prices.ts
import { scrapeURL } from '../scrapers';

export default async function handler(req: Request) {
  const { url } = await req.json();
  
  try {
    const products = await scrapeURL(url);
    
    return new Response(
      JSON.stringify({ success: true, products }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500 }
    );
  }
}
```

## License

Part of the Latela budgeting app project.

## Support

For issues or questions, contact the Latela development team.
