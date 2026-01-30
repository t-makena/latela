#!/usr/bin/env ts-node
/**
 * 🛒 Latela Price Scraper - Main Entry Point
 * 
 * Orchestrates scraping from multiple SA grocery stores
 * and uploads results to Supabase.
 * 
 * Usage:
 *   npm run scrape                    # Scrape all stores (specials)
 *   npm run scrape -- --store=checkers
 *   npm run scrape -- --type=all_categories
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CheckersScraper } from './scrapers/checkers';
import { PnPProduct, ScrapeResult, SupabaseProductOffer } from './types';
import { STORES, StoreKey } from './config';

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const SCRAPE_STORES = process.env.SCRAPE_STORES || 'all';
const SCRAPE_TYPE = process.env.SCRAPE_TYPE || 'specials';

// Output directory for results
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// ============================================
// SUPABASE CLIENT
// ============================================

let supabase: SupabaseClient;

function initSupabase(): void {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('⚠️  Supabase credentials not found. Results will only be saved locally.');
    return;
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('✅ Supabase client initialized');
}

// ============================================
// UPLOAD TO SUPABASE
// ============================================

async function uploadToSupabase(products: PnPProduct[], store: string): Promise<{ inserted: number; updated: number; errors: number }> {
  if (!supabase) {
    console.log('⚠️  Skipping Supabase upload (no client)');
    return { inserted: 0, updated: 0, errors: 0 };
  }

  const stats = { inserted: 0, updated: 0, errors: 0 };
  const batchSize = 100;

  console.log(`📤 Uploading ${products.length} products to Supabase...`);

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    const offers: SupabaseProductOffer[] = batch.map(p => ({
      store: store,
      store_product_code: p.code,
      product_name: p.name,
      brand: p.brand,
      price_cents: p.price_cents,
      original_price_cents: p.original_price_cents,
      category: p.category,
      subcategory: p.subcategory,
      on_sale: p.on_sale,
      promotion_text: p.promotion_text,
      image_url: p.image_url,
      product_url: p.product_url,
      in_stock: p.in_stock,
      last_seen_at: new Date().toISOString(),
    }));

    // Upsert based on store + product code
    const { data, error } = await supabase
      .from('product_offers')
      .upsert(offers, {
        onConflict: 'store,store_product_code',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      console.error(`   ❌ Batch error: ${error.message}`);
      stats.errors += batch.length;
    } else {
      stats.inserted += data?.length || 0;
    }

    // Progress indicator
    const progress = Math.min(i + batchSize, products.length);
    process.stdout.write(`   Progress: ${progress}/${products.length}\r`);
  }

  console.log(`\n   ✅ Uploaded: ${stats.inserted} | Errors: ${stats.errors}`);
  return stats;
}

// ============================================
// SAVE LOCAL RESULTS
// ============================================

function saveLocalResults(results: ScrapeResult[], summary: any): void {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];

  // Save individual store results
  for (const result of results) {
    const filename = `${result.store.toLowerCase()}_${timestamp}.json`;
    fs.writeFileSync(
      path.join(OUTPUT_DIR, filename),
      JSON.stringify(result, null, 2)
    );
    console.log(`💾 Saved: ${filename}`);
  }

  // Save summary
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
}

// ============================================
// MAIN SCRAPE FUNCTION
// ============================================

async function scrapeStore(storeKey: StoreKey, scrapeType: string): Promise<ScrapeResult | null> {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🏪 Scraping: ${STORES[storeKey].name}`);
  console.log(`${'='.repeat(50)}\n`);

  let result: ScrapeResult | null = null;

  switch (storeKey) {
    case 'checkers': {
      const scraper = new CheckersScraper();
      await scraper.init();

      try {
        if (scrapeType === 'specials') {
          const products = await scraper.scrapeSpecials(5);
          result = {
            store: 'Checkers',
            products,
            errors: [],
            stats: {
              total: products.length,
              categories: 1,
              duration_ms: 0,
            },
          };
        } else if (scrapeType === 'all_categories') {
          const data = await scraper.scrapeAllCategories(3);
          result = {
            store: 'Checkers',
            ...data,
          };
        }
      } finally {
        await scraper.close();
      }
      break;
    }

    case 'pnp': {
      // TODO: Add PnP scraper
      console.log('⚠️  PnP scraper not implemented yet');
      break;
    }

    case 'woolworths': {
      // TODO: Add Woolworths scraper
      console.log('⚠️  Woolworths scraper not implemented yet');
      break;
    }

    default:
      console.log(`⚠️  Unknown store: ${storeKey}`);
  }

  return result;
}

// ============================================
// ENTRY POINT
// ============================================

async function main(): Promise<void> {
  const startTime = Date.now();

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         🛒 LATELA PRICE SCRAPER                           ║');
  console.log('║         South African Grocery Price Monitor               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  console.log(`📅 Date: ${new Date().toISOString()}`);
  console.log(`🏪 Stores: ${SCRAPE_STORES}`);
  console.log(`📋 Type: ${SCRAPE_TYPE}`);
  console.log('\n');

  // Initialize Supabase
  initSupabase();

  // Determine which stores to scrape
  const storesToScrape: StoreKey[] = SCRAPE_STORES === 'all'
    ? (Object.keys(STORES) as StoreKey[]).filter(k => STORES[k].enabled)
    : SCRAPE_STORES.split(',').map(s => s.trim() as StoreKey);

  console.log(`📋 Will scrape: ${storesToScrape.join(', ')}\n`);

  // Run scrapers
  const results: ScrapeResult[] = [];
  const uploadStats = { total: 0, inserted: 0, errors: 0 };

  for (const storeKey of storesToScrape) {
    if (!STORES[storeKey]) {
      console.log(`⚠️  Unknown store: ${storeKey}, skipping...`);
      continue;
    }

    try {
      const result = await scrapeStore(storeKey, SCRAPE_TYPE);
      
      if (result && result.products.length > 0) {
        results.push(result);

        // Upload to Supabase
        const stats = await uploadToSupabase(result.products, result.store);
        uploadStats.total += result.products.length;
        uploadStats.inserted += stats.inserted;
        uploadStats.errors += stats.errors;
      }
    } catch (error) {
      console.error(`❌ Failed to scrape ${storeKey}: ${error}`);
    }
  }

  // Calculate totals
  const totalProducts = results.reduce((sum, r) => sum + r.products.length, 0);
  const totalDuration = Date.now() - startTime;

  // Create summary
  const summary = {
    date: new Date().toISOString(),
    scrape_type: SCRAPE_TYPE,
    stores_scraped: results.map(r => r.store),
    total_products: totalProducts,
    duration_ms: totalDuration,
    duration_human: `${Math.round(totalDuration / 1000 / 60)} minutes`,
    upload_stats: uploadStats,
    summary: `Scraped ${totalProducts} products from ${results.length} stores in ${Math.round(totalDuration / 1000)} seconds. Uploaded ${uploadStats.inserted} to Supabase.`,
    results: results.map(r => ({
      store: r.store,
      products: r.stats.total,
      errors: r.errors.length,
    })),
  };

  // Save local results
  saveLocalResults(results, summary);

  // Print summary
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    📊 SCRAPE SUMMARY                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\n   Total Products: ${totalProducts}`);
  console.log(`   Stores Scraped: ${results.length}`);
  console.log(`   Duration: ${Math.round(totalDuration / 1000)} seconds`);
  console.log(`   Uploaded to Supabase: ${uploadStats.inserted}`);
  console.log(`   Errors: ${uploadStats.errors}`);
  console.log('\n');
}

// Run
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
