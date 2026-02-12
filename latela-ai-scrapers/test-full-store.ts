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
  const store = args[0] || 'woolworths';
  const maxCategories = args[1] ? parseInt(args[1]) : 10;
  const maxPagesPerCategory = args[2] ? parseInt(args[2]) : 3;

  console.log('Configuration:');
  console.log(`  Store:                  ${store}`);
  console.log(`  Max categories:         ${maxCategories}`);
  console.log(`  Max pages per category: ${maxPagesPerCategory}`);
  console.log('');

  try {
    const result = await scrapeFullStore(store, {
      maxCategories,
      maxPagesPerCategory,
      outputFile: `${store.toLowerCase()}-full-scrape.json`,
      saveProgress: true
    });

    console.log('✓ Full store scrape completed!');
    console.log(`  Total products: ${result.totalProducts}`);
    
  } catch (error) {
    console.error('✗ Scrape failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

// Usage:
// npx tsx test-full-store.ts woolworths 10 3
// npx tsx test-full-store.ts pnp 15 5
// npx tsx test-full-store.ts checkers 10 3
// npx tsx test-full-store.ts makro 10 3
