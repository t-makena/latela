# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 3. Run a Test

```bash
npm test
```

## 📁 File Structure

```
scrapers/
├── baseScraper.ts          # Base class with AI extraction logic
├── pnpScraper.ts           # Pick n Pay scraper
├── checkersScraper.ts      # Checkers/Shoprite scraper
├── woolworthsScraper.ts    # Woolworths scraper
├── makroScraper.ts         # Makro scraper
├── index.ts                # Main exports and factory functions
├── test.ts                 # Test suite
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── .env.example            # Environment variables template
├── README.md               # Full documentation
├── DEPLOYMENT.md           # Deployment guide
└── QUICKSTART.md           # This file
```

## 🎯 Basic Usage

### Scrape a Single URL

```typescript
import { scrapeURL } from './scrapers';

const products = await scrapeURL('https://www.pnp.co.za/search?q=milk');

console.log(`Found ${products.length} products`);
products.forEach(p => {
  console.log(`${p.name}: R${p.price}`);
});
```

### Scrape Multiple URLs

```typescript
import { scrapeMultipleURLs } from './scrapers';

const urls = [
  'https://www.pnp.co.za/search?q=bread',
  'https://www.checkers.co.za/search?q=milk'
];

const { success, failed } = await scrapeMultipleURLs(urls);
console.log(`Success: ${success.length}, Failed: ${failed.length}`);
```

### Use Specific Scraper

```typescript
import { PnPScraper } from './scrapers';

const scraper = new PnPScraper();
const products = await scraper.scrape('https://www.pnp.co.za/...');
```

## 🏪 Supported Stores

- Pick n Pay (pnp.co.za)
- Checkers (checkers.co.za)
- Shoprite (shoprite.co.za)
- Woolworths (woolworths.co.za)
- Makro (makro.co.za)

## 🔑 Key Features

✅ **AI-First**: Uses Claude Haiku Vision API  
✅ **URL Validation**: Checks URLs before scraping  
✅ **Auto Cleanup**: Deletes screenshots automatically  
✅ **Store Detection**: Automatically picks right scraper  
✅ **Error Handling**: Comprehensive error management  
✅ **Batch Processing**: Scrape multiple URLs at once  

## 📊 Data Structure

Each product returns:

```typescript
{
  name: string;        // "Albany Superior Low GI Brown Bread"
  price: number;       // 18.99 (in Rands)
  unit?: string;       // "700g"
  category?: string;   // "Bakery"
  store: string;       // "Pick n Pay"
  url: string;         // Original URL
  scrapedAt: Date;     // Timestamp
}
```

## 💰 Cost Estimate

Using Claude Haiku 4:
- **~R0.15-0.50 per scrape** (depending on page size)
- **~R150-500 per 1000 scrapes**
- Much cheaper than Claude Sonnet or Opus

## 🔧 Common Commands

```bash
# Run all tests
npm test

# Test single scrape
npm run test:single

# Test multiple scrapes
npm run test:multiple

# Test custom URL
npm run test:url "https://www.pnp.co.za/search?q=bread"

# Build TypeScript
npm run build

# Watch mode
npm run dev
```

## ⚠️ Important Notes

1. **Rate Limiting**: Add delays between requests to avoid being blocked
2. **Screenshot Cleanup**: Screenshots are auto-deleted, but check `temp_screenshots/` if issues occur
3. **API Costs**: Monitor your Anthropic API usage
4. **Store Changes**: Websites change - test regularly
5. **Respect Robots.txt**: Be a good web citizen

## 🐛 Troubleshooting

### "URL validation failed"
- Check if URL is accessible in browser
- Store website might be down
- Check your internet connection

### "No valid JSON array found"
- Screenshot might be unclear
- Store layout changed significantly
- Try a different URL

### Screenshots not deleted
- Check permissions on `temp_screenshots/`
- Manually delete the folder if needed

## 📚 Next Steps

1. **Read Full Docs**: Check `README.md` for detailed documentation
2. **Deploy to Vercel**: See `DEPLOYMENT.md` for production setup
3. **Integrate with Latela**: Add to your React/Lovable app
4. **Store in Supabase**: Save prices to your database

## 🆘 Need Help?

- Check `README.md` for detailed examples
- See `DEPLOYMENT.md` for production setup
- Review `test.ts` for usage patterns

## 🎉 You're Ready!

Start scraping South African grocery prices with AI! 🇿🇦

```bash
npm test
```
