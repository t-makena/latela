# 🛒 Latela Price Scraper

Automated South African grocery price scraper that runs on GitHub Actions and syncs to Supabase.

## Features

- ✅ Scrapes Checkers, Pick n Pay, Woolworths (more coming)
- ✅ Runs automatically via GitHub Actions (daily at 6am SAST)
- ✅ Uploads to Supabase for use in Latela app
- ✅ Tracks price history for price drop alerts
- ✅ Manual trigger from GitHub UI

---

## 🚀 Quick Setup

### 1. Add to Your Repo

Copy the `scraper/` folder and `.github/` folder to your Latela repo:

```
latela/
├── .github/
│   └── workflows/
│       └── scrape-prices.yml
├── scraper/
│   ├── src/
│   │   ├── scrapers/
│   │   │   └── checkers.ts
│   │   ├── config.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── ... (rest of your app)
```

### 2. Run Supabase Migration

Go to your Supabase Dashboard → SQL Editor → Run:

```sql
-- Copy contents from supabase/migrations/20240131_product_offers.sql
```

### 3. Add GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your service role key (from Supabase Dashboard → Settings → API) |

### 4. Test Manually

1. Go to your repo → Actions tab
2. Click "🛒 Scrape Grocery Prices"
3. Click "Run workflow"
4. Select options and run

---

## 📅 Schedule

The scraper runs automatically:

| Schedule | Time | What |
|----------|------|------|
| Daily | 6:00 AM SAST | Scrape specials |
| Monday | 8:00 AM SAST | Weekly full scrape |

To change the schedule, edit `.github/workflows/scrape-prices.yml`:

```yaml
schedule:
  - cron: '0 4 * * *'  # Daily at 4am UTC (6am SAST)
```

---

## 🖥️ Local Development

```bash
cd scraper

# Install dependencies
npm install

# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-key"

# Run scraper
npm run scrape

# Or scrape specific store
npm run scrape:checkers
```

---

## 📊 Using the Data in Latela

### Query Specials

```typescript
const { data: specials } = await supabase
  .from('current_specials')
  .select('*')
  .limit(20);
```

### Search Products

```typescript
const { data: products } = await supabase
  .from('product_offers')
  .select('*')
  .textSearch('product_name', 'milk')
  .order('price_cents');
```

### Compare Prices

```typescript
const { data: comparison } = await supabase
  .from('price_comparison')
  .select('*')
  .ilike('product_name', '%bread%');
```

---

## 🔧 Adding New Stores

1. Create `scraper/src/scrapers/newstore.ts`
2. Follow the pattern in `checkers.ts`
3. Add to `config.ts` STORES object
4. Import in `index.ts` and add case to `scrapeStore()`

---

## ⚠️ Important Notes

- **Rate Limiting**: The scraper includes delays to avoid being blocked
- **ToS**: Scraping may violate store Terms of Service - use responsibly
- **Costs**: GitHub Actions free tier = 2000 minutes/month (plenty for daily scrapes)
- **Caching**: Results are cached in Supabase - only new prices update

---

## 📁 Output

Scrape results are saved as:
- GitHub Actions artifacts (JSON files)
- Supabase `product_offers` table

Check the Actions tab for logs and downloadable results.
