import { scrapeFullStore } from './src/fullStoreScraper';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Latela Full Store Scraper with Auto URL Discovery     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ Error: ANTHROPIC_API_KEY not found');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const allStores = ['woolworths', 'pnp', 'checkers', 'makro'];

  // Read store(s) from CLI args first, then SCRAPE_STORES env var
  const storeInput = args[0] || process.env.SCRAPE_STORES || 'all';
  const stores = storeInput.toLowerCase() === 'all'
    ? allStores
    : storeInput.split(',').map(s => s.trim()).filter(Boolean);

  const maxCategories = args[1] ? parseInt(args[1]) : 10;
  const maxPagesPerCategory = args[2] ? parseInt(args[2]) : 3;

  console.log('Configuration:');
  console.log(`  Stores:                 ${stores.join(', ')}`);
  console.log(`  Max categories:         ${maxCategories}`);
  console.log(`  Max pages per category: ${maxPagesPerCategory}`);
  console.log('');

  let totalProducts = 0;
  const failed: string[] = [];

  for (const store of stores) {
    try {
      const result = await scrapeFullStore(store, {
        maxCategories,
        maxPagesPerCategory,
        outputFile: `${store.toLowerCase()}-full-scrape.json`,
        saveProgress: true
      });

      console.log(`✓ ${store} scrape completed! Products: ${result.totalProducts}`);
      totalProducts += result.totalProducts;
    } catch (error) {
      console.error(`✗ ${store} scrape failed:`, error);
      failed.push(store);
    }
  }

  console.log(`\nAll done. Total products: ${totalProducts}`);
  if (failed.length > 0) {
    console.error(`Failed stores: ${failed.join(', ')}`);
    process.exit(1);
  }
}

main().catch(console.error);

// Usage:
// npx tsx test-full-store.ts woolworths 10 3
// npx tsx test-full-store.ts pnp 15 5
// npx tsx test-full-store.ts checkers 10 3
// npx tsx test-full-store.ts makro 10 3
