

## Cart Estimator & Price Comparison Feature for Latela

### Summary
Add a comprehensive price comparison system to the Budget page that enables users to:
1. **Compare grocery prices** across major South African retailers (Pick n Pay, Checkers, Shoprite, Woolworths)
2. **Scan grocery lists** using AI-powered image recognition to automatically extract and price items
3. **Estimate cart totals** to plan shopping trips and maximize savings

This feature integrates with the existing neo-brutalist design system and follows the established patterns in the codebase.

---

### Phase 1: Database Schema Migration

Run the provided SQL migration to create three new tables:

| Table | Purpose |
|-------|---------|
| `canonical_products` | Groups same products across stores with normalized names |
| `product_offers` | Store-specific prices linked to canonical products |
| `price_history` | Tracks price changes over time for analytics |

**Key Features:**
- Public read access via RLS (price data is public)
- Indexes on name, brand, category, and price for fast lookups
- `search_products` database function for full-text search with grouped offers
- Triggers for automatic `updated_at` timestamps

---

### Phase 2: Edge Functions

Create two new Supabase Edge Functions:

**1. `supabase/functions/search-products/index.ts`**

| Feature | Description |
|---------|-------------|
| Endpoint | `POST /search-products` with body `{ query: string }` |
| Authentication | Public (no JWT required) |
| Response | Grouped products with offers sorted by price |
| Data enrichment | Calculates cheapest store, potential savings, unit prices |

**Response Format:**
```json
{
  "success": true,
  "query": "creatine",
  "total_results": 5,
  "products": [
    {
      "id": "uuid",
      "name": "USN Creatine 500g",
      "brand": "USN",
      "quantity_value": 500,
      "quantity_unit": "g",
      "image_url": "https://...",
      "offers": [
        {
          "store": "pnp",
          "store_display_name": "Pick n Pay",
          "price_cents": 23999,
          "unit_price_cents": 4799,
          "in_stock": true,
          "on_sale": false,
          "product_url": "https://..."
        }
      ],
      "cheapest_store": "Pick n Pay",
      "cheapest_price_cents": 23999,
      "potential_savings_cents": 2000,
      "store_count": 3
    }
  ]
}
```

**2. `supabase/functions/scan-grocery-list/index.ts`**

| Feature | Description |
|---------|-------------|
| Endpoint | `POST /scan-grocery-list` |
| Authentication | Required (user JWT) |
| Input | Base64 image or image URL |
| AI Provider | Anthropic Claude Vision (uses existing ANTHROPIC_API_KEY) |
| Output | Parsed items with product matches from database |

**Response Format:**
```json
{
  "success": true,
  "items": [
    {
      "id": "abc123",
      "raw_text": "2x bread",
      "name": "bread",
      "quantity": 2,
      "confidence": "high",
      "needs_clarification": true,
      "matches": [
        {
          "id": "uuid",
          "name": "Albany White Bread 700g",
          "cheapest_price_cents": 1899,
          "cheapest_store": "Checkers",
          "store_count": 4
        }
      ]
    }
  ],
  "total_items": 5,
  "needs_clarification": 2
}
```

---

### Phase 3: Frontend Pages

Create two new pages accessible from the navigation:

**1. `src/pages/Compare.tsx` - Price Comparison Page**

| Element | Description |
|---------|-------------|
| Sticky search bar | Search input with debounced queries |
| Suggested pills | Quick filters: "bread", "milk", "eggs", "chicken", "rice" |
| Product cards | Neo-brutalist cards showing all store prices |
| Store badges | Color-coded by retailer |
| Best price badge | Green "BEST" badge on cheapest option |
| Sale indicator | Orange "SALE" badge for promotions |
| Unit price | R/100g or R/100ml for fair comparison |
| Savings display | "Save RX.XX by comparing" message |
| Empty state | Helpful illustration when no search |
| Loading state | Skeleton cards during fetch |

**2. `src/pages/Scan.tsx` - Grocery List Scanner Page**

| Element | Description |
|---------|-------------|
| Upload area | Drag-and-drop with camera icon |
| Take Photo button | Uses device camera API |
| Upload Image button | File picker for images |
| Parsed items list | Cards for each extracted item |
| Status indicators | Green (selected), Amber (needs choice) |
| Quantity selector | +/- controls for each item |
| Product selector | Expandable section for ambiguous items |
| Summary card | Estimated total with store breakdown |
| Manual add input | Text input to add items by hand |
| Clear/Reset button | Start fresh |

---

### Phase 4: Frontend Components

Create supporting components in organized directories:

**`src/components/compare/`**
| Component | Purpose |
|-----------|---------|
| `ProductComparisonCard.tsx` | Main product card with store offers |
| `StoreOfferRow.tsx` | Individual store price row |
| `SearchSuggestions.tsx` | Quick search pill buttons |
| `StoreBadge.tsx` | Color-coded store indicator |

**`src/components/scan/`**
| Component | Purpose |
|-----------|---------|
| `GroceryItemCard.tsx` | Parsed item with status |
| `ProductMatchSelector.tsx` | Choose from product matches |
| `ListSummary.tsx` | Total calculation card |
| `ImageUploader.tsx` | Camera/file upload component |

---

### Phase 5: Custom Hooks

**`src/hooks/usePriceSearch.ts`**
- Debounced search input (300ms)
- React Query for caching and refetching
- Loading and error state management
- Results transformation

**`src/hooks/useGroceryScanner.ts`**
- Image upload handling
- API call to scan endpoint
- Item state management (add/remove/update quantity)
- Product selection for ambiguous items
- Total calculation

---

### Phase 6: Navigation Updates

**`src/components/layout/Navbar.tsx`**

Add new nav items after "Budget":
```typescript
{ name: t('nav.compare'), href: "/compare", icon: TrendingDown },
{ name: t('nav.scan'), href: "/scan", icon: Camera },
```

**`src/App.tsx`**

Add new protected routes:
```tsx
<Route path="/compare" element={
  <ProtectedRoute>
    <Layout>
      <Compare />
    </Layout>
  </ProtectedRoute>
} />
<Route path="/scan" element={
  <ProtectedRoute>
    <Layout>
      <Scan />
    </Layout>
  </ProtectedRoute>
} />
```

---

### Phase 7: Translations

Add to all 11 locale files (`src/locales/*.json`):

```json
{
  "nav": {
    "compare": "Compare Prices",
    "scan": "Scan List"
  },
  "compare": {
    "title": "Compare Prices",
    "searchPlaceholder": "Search for products...",
    "bestPrice": "BEST",
    "onSale": "SALE",
    "savingsMessage": "Save R{{amount}} by comparing",
    "noResults": "No products found",
    "searchPrompt": "Search for products to compare prices across stores",
    "outOfStock": "Out of stock",
    "perUnit": "per {{unit}}",
    "storesAvailable": "{{count}} stores"
  },
  "scan": {
    "title": "Scan Grocery List",
    "uploadTitle": "Upload Your List",
    "uploadDescription": "Take a photo or upload an image of your handwritten or printed grocery list",
    "takePhoto": "Take Photo",
    "uploadImage": "Upload Image",
    "parsing": "Analysing your list...",
    "itemsFound": "{{count}} items found",
    "needsSelection": "{{count}} items need selection",
    "selectProduct": "Select a product",
    "estimatedTotal": "Estimated Total",
    "addManually": "Add item manually",
    "clearList": "Clear List",
    "scanAnother": "Scan Another"
  }
}
```

---

### Phase 8: Styling Constants

**Store Color Scheme:**
```typescript
// src/lib/storeColors.ts
export const storeColors = {
  pnp: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-800', 
    border: 'border-blue-300',
    name: 'Pick n Pay' 
  },
  checkers: { 
    bg: 'bg-red-100', 
    text: 'text-red-800', 
    border: 'border-red-300',
    name: 'Checkers' 
  },
  shoprite: { 
    bg: 'bg-red-100', 
    text: 'text-red-800', 
    border: 'border-red-300',
    name: 'Shoprite' 
  },
  woolworths: { 
    bg: 'bg-green-100', 
    text: 'text-green-800', 
    border: 'border-green-300',
    name: 'Woolworths' 
  }
};
```

**Card Styling (follows existing neo-brutalist pattern):**
- `border-2 border-foreground`
- `rounded-xl` or `rounded-2xl`
- `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` (consistent with memory)
- White background on themed page background

---

### Technical Considerations

1. **No new secrets required** - Uses existing `ANTHROPIC_API_KEY` for AI vision
2. **Edge function config** - Add entries to `supabase/config.toml`:
   ```toml
   [functions.search-products]
   verify_jwt = false
   
   [functions.scan-grocery-list]
   verify_jwt = true
   ```
3. **Currency handling** - All prices stored in cents, divided by 100 for display (follows existing pattern)
4. **Image handling** - Use base64 encoding for upload, max 4MB file size
5. **Mobile responsive** - Both pages will use `useIsMobile` hook for adaptive layouts

---

### Implementation Order

1. Database migration (creates tables and functions)
2. Edge functions (search-products, scan-grocery-list)
3. Utility files (storeColors, types)
4. Custom hooks (usePriceSearch, useGroceryScanner)
5. Reusable components (compare/, scan/ directories)
6. Page components (Compare.tsx, Scan.tsx)
7. Navigation updates (Navbar, App router)
8. Translations (all 11 locale files)

---

### Files to Create/Modify

**New Files:**
- `src/pages/Compare.tsx`
- `src/pages/Scan.tsx`
- `src/hooks/usePriceSearch.ts`
- `src/hooks/useGroceryScanner.ts`
- `src/lib/storeColors.ts`
- `src/components/compare/ProductComparisonCard.tsx`
- `src/components/compare/StoreOfferRow.tsx`
- `src/components/compare/SearchSuggestions.tsx`
- `src/components/compare/StoreBadge.tsx`
- `src/components/scan/GroceryItemCard.tsx`
- `src/components/scan/ProductMatchSelector.tsx`
- `src/components/scan/ListSummary.tsx`
- `src/components/scan/ImageUploader.tsx`
- `supabase/functions/search-products/index.ts`
- `supabase/functions/scan-grocery-list/index.ts`

**Modified Files:**
- `src/App.tsx` - Add routes
- `src/components/layout/Navbar.tsx` - Add nav items
- `supabase/config.toml` - Add function configs
- `src/locales/en.json` - Add translations
- `src/locales/af.json` - Add translations
- `src/locales/zu.json` - Add translations
- `src/locales/xh.json` - Add translations
- `src/locales/nr.json` - Add translations
- `src/locales/nso.json` - Add translations
- `src/locales/ss.json` - Add translations
- `src/locales/st.json` - Add translations
- `src/locales/tn.json` - Add translations
- `src/locales/ts.json` - Add translations
- `src/locales/ve.json` - Add translations

