import { scrapeURL, scrapeMultipleURLs, getSupportedStores, ScraperOptions } from './src/index';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Default scraper options
const defaultOptions: ScraperOptions = {
  maxPages: 5 // Limit pages for testing
};

async function testSingleScrape() {
  console.log('\n=== Testing Single URL Scrape ===\n');
  
  const testUrl = 'https://www.pnp.co.za/search/milk';
  
  try {
    console.log(`Scraping: ${testUrl}`);
    console.log(`Max pages: ${defaultOptions.maxPages}`);
    
    const products = await scrapeURL(testUrl, defaultOptions);
    
    console.log(`\n✓ Success! Found ${products.length} products\n`);
    
    // Display first 10 products
    products.slice(0, 10).forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Price: R${product.price.toFixed(2)}`);
      console.log(`   Unit: ${product.unit || 'N/A'}`);
      console.log(`   Category: ${product.category || 'N/A'}`);
      console.log(`   Store: ${product.store}`);
      console.log('');
    });
    
    if (products.length > 10) {
      console.log(`... and ${products.length - 10} more products\n`);
    }
    
    // Show some statistics
    console.log('=== Statistics ===');
    console.log(`Total products: ${products.length}`);
    
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    console.log(`Average price: R${avgPrice.toFixed(2)}`);
    
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    console.log(`Categories found: ${categories.length > 0 ? categories.join(', ') : 'None detected'}`);
    
  } catch (error) {
    console.error('✗ Scraping failed:', error);
  }
}

async function testMultipleScrapes() {
  console.log('\n=== Testing Multiple URL Scrape ===\n');
  
  const urls = [
    'https://www.pnp.co.za/search/bread',
    'https://www.checkers.co.za/search/milk',
    'https://www.woolworths.co.za/search/eggs'
  ];
  
  try {
    const results = await scrapeMultipleURLs(urls, { maxPages: 3 });
    
    console.log('\n=== Results Summary ===\n');
    console.log(`Successful: ${results.success.length}/${urls.length}`);
    console.log(`Failed: ${results.failed.length}/${urls.length}\n`);
    
    // Show successful scrapes
    if (results.success.length > 0) {
      console.log('✓ Successful Scrapes:');
      results.success.forEach(({ url, products }) => {
        console.log(`  - ${url}: ${products.length} products`);
      });
      console.log('');
    }
    
    // Show failed scrapes
    if (results.failed.length > 0) {
      console.log('✗ Failed Scrapes:');
      results.failed.forEach(({ url, error }) => {
        console.log(`  - ${url}`);
        console.log(`    Error: ${error}`);
      });
      console.log('');
    }
    
    // Show sample products from first successful scrape
    if (results.success.length > 0) {
      const firstResult = results.success[0];
      console.log(`\nSample products from ${firstResult.url}:\n`);
      
      firstResult.products.slice(0, 5).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - R${product.price.toFixed(2)} (${product.unit || 'N/A'})`);
      });
    }
    
  } catch (error) {
    console.error('✗ Batch scraping failed:', error);
  }
}

async function testPaginationDepth() {
  console.log('\n=== Testing Pagination Depth ===\n');
  
  const testUrl = 'https://www.pnp.co.za/search/milk';
  
  // Test with different page limits
  const pageLimits = [1, 3, 5];
  
  for (const maxPages of pageLimits) {
    console.log(`\n--- Testing with maxPages: ${maxPages} ---`);
    
    try {
      const startTime = Date.now();
      const products = await scrapeURL(testUrl, { maxPages });
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      console.log(`✓ Found ${products.length} products in ${duration}s`);
    } catch (error) {
      console.error(`✗ Failed with maxPages=${maxPages}:`, error);
    }
  }
}

async function showSupportedStores() {
  console.log('\n=== Supported Stores ===\n');
  
  const stores = getSupportedStores();
  stores.forEach((store, index) => {
    console.log(`${index + 1}. ${store}`);
  });
  console.log('');
}

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Latela AI-First Scraper Test Suite   ║');
  console.log('╚════════════════════════════════════════╝');
  
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\n✗ Error: ANTHROPIC_API_KEY not found in environment variables');
    console.error('Please create a .env file with your API key:\n');
    console.error('ANTHROPIC_API_KEY=your_key_here\n');
    process.exit(1);
  }
  
  // Show supported stores
  await showSupportedStores();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || 'single';
  
  switch (command) {
    case 'single':
      await testSingleScrape();
      break;
      
    case 'multiple':
      await testMultipleScrapes();
      break;
      
    case 'pagination':
      await testPaginationDepth();
      break;
      
    case 'all':
      await testSingleScrape();
      await testMultipleScrapes();
      break;
      
    case 'url':
      if (args[1]) {
        console.log('\n=== Testing Custom URL ===\n');
        const maxPages = args[2] ? parseInt(args[2]) : 5;
        
        try {
          console.log(`URL: ${args[1]}`);
          console.log(`Max pages: ${maxPages}`);
          
          const products = await scrapeURL(args[1], { maxPages });
          console.log(`\n✓ Found ${products.length} products\n`);
          
          products.slice(0, 10).forEach((product, index) => {
            console.log(`${index + 1}. ${product.name}`);
            console.log(`   Price: R${product.price.toFixed(2)}`);
            console.log(`   Unit: ${product.unit || 'N/A'}`);
            console.log('');
          });
          
          if (products.length > 10) {
            console.log(`... and ${products.length - 10} more products`);
          }
        } catch (error) {
          console.error('✗ Failed:', error);
        }
      } else {
        console.error('Usage: npm run test url <URL> [maxPages]');
      }
      break;
      
    default:
      console.log('Available commands:');
      console.log('  single     - Test single URL scrape (default)');
      console.log('  multiple   - Test multiple URL scrapes');
      console.log('  pagination - Test pagination depth');
      console.log('  all        - Run all tests');
      console.log('  url <URL> [maxPages] - Test specific URL');
  }
  
  console.log('\n✓ Tests complete!\n');
}

// Run tests
main().catch(console.error);
