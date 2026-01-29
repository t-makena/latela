

## Unified Grocery Budget Page Implementation

### Summary
Create a new unified `/grocery-budget` page that combines price comparison and cart estimation into one cohesive experience. This page will feature a Search/My List tab interface, store filters, an "On Sale Only" toggle, and a persistent footer showing the estimated total.

---

### Current State Analysis

**Existing Assets to Leverage:**
- `usePriceSearch` hook - product search with debouncing via React Query
- `useGroceryScanner` hook - image scanning and item parsing
- `ProductComparisonCard`, `StoreOfferRow`, `StoreBadge` - price comparison UI
- `ImageUploader` - camera/upload component
- `storeColors.ts` - store color configuration (missing Makro)
- Edge functions: `search-products`, `scan-grocery-list`

**What Needs to be Created:**
- `useGroceryCart` hook - unified cart state with localStorage persistence
- `GroceryBudget.tsx` page - main unified page
- `SearchTab.tsx` - search functionality with filters
- `MyListTab.tsx` - cart/list management
- `GrocerySearchResultCard.tsx` - search result with "+ Add" button
- `CartItemCard.tsx` - cart item with store switching
- `StoreFilterPills.tsx` - store filter buttons
- `ScanListDialog.tsx` - modal for scanning

---

### Implementation Details

#### Phase 1: Update Store Colors Configuration

**File: `src/lib/storeColors.ts`**

Add Makro store and update type:

| Change | Description |
|--------|-------------|
| Add `'makro'` to `StoreKey` type | Enable Makro store support |
| Add Makro config | `{ bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', name: 'Makro' }` |

---

#### Phase 2: Create Grocery Cart Hook

**New File: `src/hooks/useGroceryCart.ts`**

A custom hook that manages the shopping cart with localStorage persistence:

| Feature | Implementation |
|---------|----------------|
| Cart items state | Array of `CartItem` objects |
| `addToCart(product, offer)` | Add product with selected store offer |
| `updateQuantity(id, qty)` | Change item quantity (min 1) |
| `updateStore(id, offer)` | Switch to different store's offer |
| `removeFromCart(id)` | Remove item |
| `clearCart()` | Empty the cart |
| localStorage sync | Persist/restore cart on mount |
| Computed totals | `totalCents`, `itemCount`, `storeBreakdown` |

**CartItem Interface:**
```text
{
  id: string;
  productId: string;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  quantityValue: number | null;
  quantityUnit: string | null;
  selectedOffer: ProductOffer;
  availableOffers: ProductOffer[];
  quantity: number;
  addedAt: number;
}
```

---

#### Phase 3: Create Grocery Budget Page

**New File: `src/pages/GroceryBudget.tsx`**

Main page component with tab-based navigation:

| Section | Details |
|---------|---------|
| Header | ShoppingCart icon + "Grocery Budget" title |
| Tab Navigation | "Search" (magnifier icon) / "My List (X)" (cart icon + count) |
| Active tab | Black background, white text |
| Inactive tab | White background, black border |
| Content Area | Renders `SearchTab` or `MyListTab` based on active tab |
| Sticky Footer | Shows item count + estimated total |

**Footer Logic:**
- Empty cart: "Est. Monthly Grocery Budget: R0.00"
- With items: "X items · Est. Total: RXXX.XX"

---

#### Phase 4: Create Search Tab Component

**New File: `src/components/grocery-budget/SearchTab.tsx`**

| Feature | Implementation |
|---------|----------------|
| Search input | Uses `usePriceSearch` hook |
| Store filter pills | All, Checkers, Makro, PnP, Woolies |
| On Sale Only toggle | Filter by `on_sale` flag |
| Client-side filtering | Filter results by selected store |
| Empty state | "Search for grocery items - Type at least 2 characters to search" |
| Loading state | Skeleton cards |
| Results | Grid of `GrocerySearchResultCard` components |

**Filter Logic:**
- "All" shows all products with all store offers
- Specific store filters to only show that store's prices
- "On Sale Only" filters offers where `on_sale === true`

---

#### Phase 5: Create Search Result Card Component

**New File: `src/components/grocery-budget/GrocerySearchResultCard.tsx`**

Modified product card with "Add to List" functionality:

| Element | Description |
|---------|-------------|
| Product image | 80x80px, object-contain |
| Product name | Bold, line-clamp-2 |
| Brand + quantity | Muted text (e.g., "Kellogg's 500g") |
| Price pills | Color-coded badges per store |
| "BEST" badge | Green, on cheapest offer |
| "SALE" badge | Orange, on promotional offers |
| Unit price | Small text showing R/100g or R/100ml |
| "+ Add" button | Adds to cart with cheapest offer selected |
| Success feedback | Toast notification on add |

---

#### Phase 6: Create My List Tab Component

**New File: `src/components/grocery-budget/MyListTab.tsx`**

| Feature | Implementation |
|---------|----------------|
| Item list | Renders `CartItemCard` for each item |
| "Scan List" button | Camera icon, opens `ScanListDialog` |
| Empty state | "Your list is empty - Search for items or scan a grocery list" |
| Clear list button | Trash icon, confirms before clearing |

---

#### Phase 7: Create Cart Item Card Component

**New File: `src/components/grocery-budget/CartItemCard.tsx`**

| Element | Description |
|---------|-------------|
| Product name/brand | Left-aligned |
| Store badge | Current selected store (tappable to cycle) |
| Price display | Updates when store changes |
| Quantity controls | +/- buttons with current count |
| Subtotal | Price × quantity |
| Remove button | Trash icon |

**Store Switching:**
- Tap store badge to cycle through available offers
- Or use dropdown to select specific store

---

#### Phase 8: Create Store Filter Pills Component

**New File: `src/components/grocery-budget/StoreFilterPills.tsx`**

| Pill | Selected Style | Unselected Style |
|------|----------------|------------------|
| All | Amber background (`bg-amber-400`) | White + black border |
| Checkers | Black background, white text | White + black border |
| Makro | Black background, white text | White + black border |
| PnP | Black background, white text | White + black border |
| Woolies | Black background, white text | White + black border |

---

#### Phase 9: Create Scan List Dialog Component

**New File: `src/components/grocery-budget/ScanListDialog.tsx`**

| Feature | Implementation |
|---------|----------------|
| Trigger | Button with camera icon |
| Modal/Dialog | Uses `Dialog` from radix |
| Content | `ImageUploader` component |
| Scanning state | Shows progress indicator |
| Results preview | List of parsed items with matches |
| "Add All" button | Batch add matched items to cart |
| Success toast | "Added X items to your list" |

---

#### Phase 10: Update Navigation and Routes

**Modify: `src/App.tsx`**
- Add import for `GroceryBudget`
- Add route: `/grocery-budget` → `<GroceryBudget />`
- Keep `/compare` and `/scan` routes (redirect later if needed)

**Modify: `src/components/layout/Navbar.tsx`**
- Replace separate "Compare Prices" and "Scan List" nav items with single "Grocery Budget"
- Use `ShoppingCart` icon from lucide-react
- Route to `/grocery-budget`

---

#### Phase 11: Add Translations

**Modify: `src/locales/en.json`** (and other 10 locale files)

Add new translation section:
```text
"groceryBudget": {
  "title": "Grocery Budget",
  "searchTab": "Search",
  "myListTab": "My List",
  "searchPlaceholder": "Search groceries...",
  "filterAll": "All",
  "onSaleOnly": "On Sale Only",
  "searchEmpty": "Search for grocery items",
  "searchHint": "Type at least 2 characters to search",
  "addToList": "Add",
  "addedToList": "Added to list",
  "estMonthlyBudget": "Est. Monthly Grocery Budget",
  "itemsTotal": "{{count}} items · Est. Total",
  "cheapestAt": "Cheapest at",
  "scanList": "Scan List",
  "scanListDesc": "Upload a photo of your grocery list",
  "addAllToList": "Add All to List",
  "itemsAdded": "Added {{count}} items to your list",
  "changeStore": "Change store",
  "emptyList": "Your list is empty",
  "emptyListHint": "Search for items or scan a grocery list",
  "clearList": "Clear List",
  "confirmClear": "Are you sure you want to clear your list?"
}
```

---

### File Structure

```text
New Files:
├── src/pages/GroceryBudget.tsx
├── src/hooks/useGroceryCart.ts
├── src/components/grocery-budget/
│   ├── SearchTab.tsx
│   ├── MyListTab.tsx
│   ├── GrocerySearchResultCard.tsx
│   ├── CartItemCard.tsx
│   ├── StoreFilterPills.tsx
│   └── ScanListDialog.tsx

Modified Files:
├── src/lib/storeColors.ts (add Makro)
├── src/App.tsx (add route)
├── src/components/layout/Navbar.tsx (update nav)
├── src/locales/*.json (all 11 files)
```

---

### Technical Notes

| Concern | Approach |
|---------|----------|
| Cart persistence | localStorage with JSON serialization |
| Store filtering | Client-side filter after API response |
| Neo-brutalist styling | 2px borders, 4px hard shadows, rounded corners |
| Mobile layout | `useIsMobile` hook for responsive design |
| Currency | All prices in cents, display with `formatPriceCents` |
| Tab state | React useState, could be URL params later |
| API reuse | Existing `search-products` and `scan-grocery-list` edge functions |

---

### UI Styling Reference

**Tab Buttons:**
```text
Active: bg-foreground text-background font-semibold
Inactive: bg-background border-2 border-foreground text-foreground
```

**Sticky Footer:**
```text
Fixed bottom, full width, bg-background, border-t-2 border-foreground
py-4 px-6, shadow-[0_-4px_0px_0px_rgba(0,0,0,1)]
```

**Store Filter Pills:**
```text
Rounded-full, px-3 py-1.5, text-sm font-medium
Gap-2 between pills, flex-wrap on mobile
```

