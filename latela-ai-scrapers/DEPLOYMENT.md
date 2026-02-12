# Deployment & Integration Guide

## Deploying to Vercel

### Step 1: Prepare Your Vercel Project

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

### Step 2: Create API Endpoint

Create a Vercel serverless function at `api/scrape.ts`:

```typescript
import { scrapeURL } from '../scrapers';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // 60 seconds max
};

export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { url } = await req.json();

    // Validate input
    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid URL provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Scrape the URL
    const products = await scrapeURL(url);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: products.length,
        products 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Scraping failed' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}
```

### Step 3: Configure Environment Variables

In your Vercel project dashboard:
1. Go to Settings → Environment Variables
2. Add: `ANTHROPIC_API_KEY` = your API key
3. Apply to: Production, Preview, Development

### Step 4: Update vercel.json

```json
{
  "functions": {
    "api/scrape.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic_api_key"
  }
}
```

### Step 5: Deploy

```bash
vercel --prod
```

## Integration with Lovable/React Frontend

### 1. Create Scraper Service

Create `src/services/scraperService.ts`:

```typescript
import { ScrapedProduct } from '../types/scraper';

const API_BASE = process.env.VITE_API_URL || 'https://your-vercel-app.vercel.app';

export async function scrapeStoreURL(url: string): Promise<ScrapedProduct[]> {
  try {
    const response = await fetch(`${API_BASE}/api/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Scraping failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Scraping failed');
    }

    return data.products;
  } catch (error) {
    console.error('Scraper service error:', error);
    throw error;
  }
}

export async function scrapeMultipleURLs(urls: string[]): Promise<{
  success: Array<{ url: string; products: ScrapedProduct[] }>;
  failed: Array<{ url: string; error: string }>;
}> {
  const success: Array<{ url: string; products: ScrapedProduct[] }> = [];
  const failed: Array<{ url: string; error: string }> = [];

  // Process in parallel with Promise.all
  const results = await Promise.allSettled(
    urls.map(url => scrapeStoreURL(url).then(products => ({ url, products })))
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      success.push(result.value);
    } else {
      failed.push({
        url: urls[index],
        error: result.reason?.message || 'Unknown error'
      });
    }
  });

  return { success, failed };
}
```

### 2. Create React Hook

Create `src/hooks/useScraper.ts`:

```typescript
import { useState } from 'react';
import { scrapeStoreURL } from '../services/scraperService';
import { ScrapedProduct } from '../types/scraper';

export function useScraper() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ScrapedProduct[]>([]);

  const scrape = async (url: string) => {
    setLoading(true);
    setError(null);
    setProducts([]);

    try {
      const scrapedProducts = await scrapeStoreURL(url);
      setProducts(scrapedProducts);
      return scrapedProducts;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Scraping failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    scrape,
    loading,
    error,
    products,
  };
}
```

### 3. Create UI Component

Create a component to use the scraper:

```typescript
import { useState } from 'react';
import { useScraper } from '../hooks/useScraper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function PriceScraper() {
  const [url, setUrl] = useState('');
  const { scrape, loading, error, products } = useScraper();

  const handleScrape = async () => {
    if (!url) return;
    
    try {
      await scrape(url);
    } catch (err) {
      console.error('Scraping failed:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter store URL (e.g., Pick n Pay search page)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />
        <Button onClick={handleScrape} disabled={loading || !url}>
          {loading ? 'Scraping...' : 'Scrape Prices'}
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-red-500 bg-red-50">
          <p className="text-red-700">Error: {error}</p>
        </Card>
      )}

      {products.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">
            Found {products.length} products
          </h3>
          <div className="grid gap-2">
            {products.map((product, index) => (
              <Card key={index} className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      {product.unit} • {product.store}
                    </p>
                  </div>
                  <p className="font-semibold text-lg">
                    R{product.price.toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Integration with Supabase

### Database Schema

Create a table for storing scraped prices:

```sql
-- Create grocery_prices table
CREATE TABLE grocery_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL, -- Store price in cents for precision
  unit TEXT,
  category TEXT,
  store TEXT NOT NULL,
  url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_grocery_prices_store ON grocery_prices(store);
CREATE INDEX idx_grocery_prices_product ON grocery_prices(product_name);
CREATE INDEX idx_grocery_prices_scraped_at ON grocery_prices(scraped_at DESC);

-- Create index for product search
CREATE INDEX idx_grocery_prices_product_name_trgm 
  ON grocery_prices USING gin (product_name gin_trgm_ops);
```

### Save Scraped Data to Supabase

Create `src/services/priceStorage.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { ScrapedProduct } from '../types/scraper';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export async function saveScrapedPrices(products: ScrapedProduct[]) {
  const { data, error } = await supabase
    .from('grocery_prices')
    .insert(
      products.map(p => ({
        product_name: p.name,
        price_cents: Math.round(p.price * 100), // Convert to cents
        unit: p.unit,
        category: p.category,
        store: p.store,
        url: p.url,
        scraped_at: p.scrapedAt
      }))
    );

  if (error) throw error;
  return data;
}

export async function getLatestPrices(
  productName?: string,
  store?: string,
  limit: number = 50
) {
  let query = supabase
    .from('grocery_prices')
    .select('*')
    .order('scraped_at', { ascending: false })
    .limit(limit);

  if (productName) {
    query = query.ilike('product_name', `%${productName}%`);
  }

  if (store) {
    query = query.eq('store', store);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Convert price back from cents to Rands
  return data?.map(item => ({
    ...item,
    price: item.price_cents / 100
  }));
}

export async function comparePrices(productName: string) {
  const { data, error } = await supabase
    .from('grocery_prices')
    .select('*')
    .ilike('product_name', `%${productName}%`)
    .order('price_cents', { ascending: true });

  if (error) throw error;

  return data?.map(item => ({
    ...item,
    price: item.price_cents / 100
  }));
}
```

## Scheduled Scraping (Cron Jobs)

### Using Vercel Cron

1. Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-prices",
      "schedule": "0 2 * * *"
    }
  ]
}
```

2. Create `api/cron/scrape-prices.ts`:

```typescript
import { scrapeMultipleURLs } from '../../scrapers';
import { createClient } from '@supabase/supabase-js';

const SCHEDULED_URLS = [
  'https://www.pnp.co.za/search?q=bread',
  'https://www.checkers.co.za/search?q=milk',
  'https://www.woolworths.co.za/search?q=eggs',
  // Add more URLs to scrape regularly
];

export default async function handler(req: Request) {
  // Verify cron secret for security
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const results = await scrapeMultipleURLs(SCHEDULED_URLS);
    
    // Store in database
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY! // Use service key for server-side
    );

    for (const result of results.success) {
      await supabase.from('grocery_prices').insert(
        result.products.map(p => ({
          product_name: p.name,
          price_cents: Math.round(p.price * 100),
          unit: p.unit,
          category: p.category,
          store: p.store,
          url: p.url,
          scraped_at: new Date()
        }))
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        scraped: results.success.length,
        failed: results.failed.length
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Cron job failed:', error);
    return new Response('Cron job failed', { status: 500 });
  }
}
```

## Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// utils/rateLimit.ts
const rateLimitMap = new Map<string, number[]>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  
  // Remove old timestamps
  const validTimestamps = timestamps.filter(
    time => now - time < windowMs
  );
  
  if (validTimestamps.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  validTimestamps.push(now);
  rateLimitMap.set(identifier, validTimestamps);
  
  return true; // Allow request
}
```

Use in your API:

```typescript
export default async function handler(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  
  if (!rateLimit(ip, 10, 60000)) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  // Continue with scraping...
}
```

## Monitoring and Logging

Consider adding:
1. **Sentry** for error tracking
2. **LogRocket** for session replay
3. **Custom analytics** to track scraping success rates

## Security Best Practices

1. **Never expose ANTHROPIC_API_KEY** in frontend code
2. **Use environment variables** for all secrets
3. **Implement rate limiting** on API endpoints
4. **Validate all inputs** before scraping
5. **Use HTTPS** for all API calls
6. **Monitor costs** - Claude API usage
7. **Set timeouts** to prevent hanging requests

## Cost Optimization

1. **Cache results** - avoid re-scraping same URLs
2. **Batch requests** - scrape multiple items per page
3. **Use lower quality screenshots** if accuracy allows
4. **Schedule scraping** during off-peak hours
5. **Monitor API usage** and set alerts

## Troubleshooting

### Vercel Deployment Issues

If Puppeteer fails on Vercel:
```bash
npm install @sparticuz/chromium puppeteer-core
```

Update baseScraper.ts:
```typescript
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
```

### Memory Issues

Increase function memory in vercel.json:
```json
{
  "functions": {
    "api/scrape.ts": {
      "memory": 3008
    }
  }
}
```

## Support

For deployment issues, check:
- Vercel documentation: https://vercel.com/docs
- Supabase documentation: https://supabase.com/docs
- Puppeteer documentation: https://pptr.dev
