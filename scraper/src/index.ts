import { CheckersScraper } from './scrapers/checkers';
import { ShopriteScraper } from './scrapers/shoprite';
import { PnPScraper } from './scrapers/pnp';
import { WoolworthsScraper } from './scrapers/woolworths';
import { MakroScraper } from './scrapers/makro';
import { PnPProduct, ScrapeResult, SupabaseProductOffer } from './types';
import { STORES, StoreKey } from './config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Get environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SCRAPE_STORES = process.env.SCRAPE_STORES || 'all';
const SCRAPE_TYPE = process.env.SCRAPE_TYPE || 'specials';

// Initialize Supabase client
const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

if (supabase) {
  console.log('✅ Supabase client initialized');
} else {
  console.log('⚠️  Supabase credentials not found. Results will only be saved locally.');
}

function mapToSupabaseFormat(product: PnPProduct, store: string): SupabaseProductOffer {
  return {
    store: store.toLowerCase(),
    store_product_code: product.code,
    product_name: product.name,
    brand: product.brand,
    category: product.category,
    subcategory: (product as any).subcategory,
    price_cents: product.price_cents,
    original_price_cents: product.original_price_cents,
    unit_price_cents: undefined,
    on_sale: product.on_sale,
    promotion_text: product.promotion_text,
    image_url: product.image_url,
    product_url: product.product_url,
    in_stock: product.in_stock,
    scraped_at: product.scraped_at.toISOString(),
    last_seen_at: new Date().toISOString(),
  };
}

async function uploadToSupabase(products: SupabaseProductOffer[]): Promise<number> {
  if (!supabase || products.length === 0) return 0;

  try {
    const { data, error } = await supabase
      .from('product_offers')
      .upsert(products, {
        onConflict: 'store,store_product_code',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', error.message);
      return 0;
    }

    return products.length;
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return 0;
  }
}

async function scrapeStore(
  storeKey: StoreKey,
  scrapeType: string
): Promise<ScrapeResult | null> {
  let result: ScrapeResult | null = null;

  switch (storeKey) {
    case 'checkers': {
      const scraper = new CheckersScraper();
      await scraper.init();
      try {
        if (scrapeType === 'specials') {
          const products = await scraper.scrapeSpecials(5);
          result = { store: 'Checkers', products, errors: [], stats: { total: products.length, categories: 1, duration_ms: 0 } };
        } else {
          const data = await scraper.scrapeAllCategories(3);
          result = { store: 'Checkers', ...data };
        }
      } finally {
        await scraper.close();
      }
      break;
    }

    case 'shoprite': {
      const scraper = new ShopriteScraper();
      await scraper.init();
      try {
        if (scrapeType === 'specials') {
          const products = await scraper.scrapeSpecials(5);
          result = { store: 'Shoprite', products, errors: [], stats: { total: products.length, categories: 1, duration_ms: 0 } };
        } else {
          const data = await scraper.scrapeAllCategories(3);
          result = { store: 'Shoprite', ...data };
        }
      } finally {
        await scraper.close();
      }
      break;
    }

    case 'pnp': {
      const scraper = new PnPScraper();
      await scraper.init();
      try {
        if (scrapeType === 'specials') {
          const products = await scraper.scrapeSpecials(5);
          result = { store: 'Pick n Pay', products, errors: [], stats: { total: products.length, categories: 1, duration_ms: 0 } };
        } else {
          const data = await scraper.scrapeAllCategories(3);
          result = { store: 'Pick n Pay', ...data };
        }
      } finally {
        await scraper.close();
      }
      break;
    }

    case 'woolworths': {
      const scraper = new WoolworthsScraper();
      await scraper.init();
      try {
        if (scrapeType === 'specials') {
          const products = await scraper.scrapeSpecials(5);
          result = { store: 'Woolworths', products, errors: [], stats: { total: products.length, categories: 1, duration_ms: 0 } };
        } else {
          const data = await scraper.scrapeAllCategories(3);
          result = { store: 'Woolworths', ...data };
        }
      } finally {
        await scraper.close();
      }
      break;
    }

    case 'makro': {
      const scraper = new MakroScraper();
      await scraper.init();
      try {
        if (scrapeType === 'specials') {
          const products = await scraper.scrapeSpecials(5);
          result = { store: 'Makro', products, errors: [], stats: { total: products.length, categories: 1, duration_ms: 0 } };
        } else {
          const data = await scraper.scrapeAllCategories(3);
          result = { store: 'Makro', ...data };
        }
      } finally {
        await scraper.close();
      }
      break;
    }
  }

  return result;
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         🛒 LATELA PRICE SCRAPER                           ║
║         South African Grocery Price Monitor               ║
╚═══════════════════════════════════════════════════════════╝
`);

  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🏪 Stores: ${SCRAPE_STORES}`);
  console.log(`📋 Type: ${SCRAPE_TYPE}`);
  console.log('');

  // Determine which stores to scrape
  const storesToScrape: StoreKey[] = SCRAPE_STORES === 'all'
    ? (Object.keys(STORES) as StoreKey[]).filter(k => STORES[k].enabled)
    : SCRAPE_STORES.split(',').map(s => s.trim().toLowerCase()) as StoreKey[];

  console.log(`📋 Will scrape: ${storesToScrape.join(', ')}\n`);

  const allResults: ScrapeResult[] = [];
  let totalProducts = 0;
  let totalUploaded = 0;

  for (const storeKey of storesToScrape) {
    if (!STORES[storeKey]) {
      console.log(`⚠️  Unknown store: ${storeKey}`);
      continue;
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`🏪 Scraping: ${STORES[storeKey].name}`);
    console.log('='.repeat(50) + '\n');

    const result = await scrapeStore(storeKey, SCRAPE_TYPE);

    if (result) {
      allResults.push(result);
      totalProducts += result.products.length;

      // Upload to Supabase
      if (result.products.length > 0) {
        const supabaseProducts = result.products.map(p => mapToSupabaseFormat(p, result.store));
        const uploaded = await uploadToSupabase(supabaseProducts);
        totalUploaded += uploaded;
        console.log(`\n📤 Uploaded ${uploaded} products to Supabase`);
      }

      // Save to local file
      const outputDir = path.join(__dirname, '..', 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = `${storeKey}_${SCRAPE_TYPE}_${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(
        path.join(outputDir, filename),
        JSON.stringify(result, null, 2)
      );
      console.log(`💾 Saved to output/${filename}`);
    }
  }

  // Summary
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                      📊 SUMMARY                           ║
╠═══════════════════════════════════════════════════════════╣
║  Stores scraped: ${storesToScrape.length.toString().padEnd(38)}║
║  Total products: ${totalProducts.toString().padEnd(38)}║
║  Uploaded to DB: ${totalUploaded.toString().padEnd(38)}║
╚═══════════════════════════════════════════════════════════╝
`);

  // Write summary for GitHub Actions
  const summary = {
    date: new Date().toISOString(),
    stores: storesToScrape.length,
    totalProducts,
    totalUploaded,
    results: allResults.map(r => ({
      store: r.store,
      products: r.products.length,
      errors: r.errors.length,
    })),
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'output', 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
}

main().catch(console.error);
