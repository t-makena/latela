

## Unified Grocery Budget Page Refactor

### Summary
Create a new unified "Grocery Budget" page that combines price comparison and cart estimation into one cohesive experience. This will replace/consolidate the separate `/compare` and `/scan` pages with a new `/grocery-budget` page featuring a Search/My List tab interface.

---

### Current State Analysis

**Existing Components to Reuse:**
- `usePriceSearch` hook - handles product search with debouncing
- `useGroceryScanner` hook - handles image scanning and list management
- `ProductComparisonCard` - displays product with store price comparison
- `StoreOfferRow` - displays individual store price rows
- `StoreBadge` - color-coded store pills
- `ImageUploader` - camera/upload component
- `GroceryItemCard` - list item with quantity controls
- `ListSummary` - total calculation display
- `storeColors.ts` - store color definitions

**Missing from Current Implementation:**
- "Makro" store (needs adding to storeColors)
- Store filter functionality
- "On Sale Only" toggle filter
- Search/My List tab navigation
- Unified cart state management
- "Add to List" functionality on search results
- Sticky footer with running total

---

### Implementation Plan

#### Phase 1: Update Store Colors Configuration

**File: `src/lib/storeColors.ts`**

Add Makro store configuration:
```text
makro: { 
  bg: 'bg-orange-100', 
  text: 'text-orange-800', 
  border: 'border-orange-300',
  name: 'Makro' 
}
```

Update the `StoreKey` type to include `'makro'`.

---

#### Phase 2: Create Unified Cart Context/Hook

**New File: `src/hooks/useGroceryCart.ts`**

Create a unified cart management hook that:
- Manages cart items with: product ID, name, brand, image, selected store, price, quantity
- Provides `addToCart(product, selectedOffer)` function
- Provides `updateQuantity(itemId, quantity)` function
- Provides `updateStore(itemId, newStoreOffer)` function
- Provides `removeFromCart(itemId)` function
- Provides `clearCart()` function
- Computes totals: item count, total price, store breakdown
- Persists cart to localStorage for session continuity
- Integrates with the scanner hook's output format

**Interface for Cart Item:**
```text
CartItem {
  id: string;
  productId: string;
  productName: string;
  brand: string | null;
  imageUrl: string | null;
  quantityValue: number | null;
  quantityUnit: string | null;
  selectedOffer: ProductOffer;
  quantity: number;
  addedAt: Date;
}
```

---

#### Phase 3: Create New Grocery Budget Page

**New File: `src/pages/GroceryBudget.tsx`**

Main page component with:

1. **Header Section**
   - Cart icon + "Grocery Budget" title
   - No duplicate title (fix screenshot issue showing it twice)

2. **Tab Navigation**
   - Two toggle buttons: "Search" (with magnifier icon) and "My List (X)" (with cart icon)
   - Active tab: black background, white text
   - Inactive tab: white background, black border
   - Count badge updates dynamically

3. **Search Tab Content**
   - Search input with magnifier icon
   - Store filter pills: All, Checkers, Makro, PnP, Woolies (matching screenshot layout)
   - "On Sale Only" toggle button with flame/sale icon
   - Search results grid or empty state
   - Minimum 2 characters to trigger search

4. **My List Tab Content**
   - List of added items with quantity controls
   - Each item shows: name, selected store badge, price, quantity +/- buttons
   - Store selector to change store for each item
   - Trash icon to remove items
   - "Scan List" button to add items via photo

5. **Sticky Footer**
   - Always visible at bottom
   - Shows: "Est. Monthly Grocery Budget: R0.00" when empty
   - Shows: "X items · Est. Total: RXXX.XX" when items exist
   - Optional: "Cheapest at: [Store] - RXXX.XX" for single-store optimization

---

#### Phase 4: Create Search Tab Component

**New File: `src/components/grocery-budget/SearchTab.tsx`**

Features:
- Integrates `usePriceSearch` hook
- Store filter state (selectedStore: 'all' | 'checkers' | 'makro' | 'pnp' | 'woolworths')
- On Sale Only filter state
- Filters products client-side based on selected store
- Empty state: "Search for grocery items - Type at least 2 characters to search"
- Loading state with skeleton cards
- Search results rendered using `GrocerySearchResultCard` component

---

#### Phase 5: Create Search Result Card Component

**New File: `src/components/grocery-budget/GrocerySearchResultCard.tsx`**

Modified version of `ProductComparisonCard` that includes:
- Product image, name, brand, quantity
- Price pills for each store (color-coded badges)
- "BEST" badge on cheapest store price
- "SALE" badge on promotional prices
- Unit price (R/100g or R/100ml) in smaller text
- "+ Add" button that calls `addToCart` from context
- When store filter is active, only show that store's price

---

#### Phase 6: Create My List Tab Component

**New File: `src/components/grocery-budget/MyListTab.tsx`**

Features:
- Renders list of cart items using `CartItemCard` component
- "Scan List" button with camera icon that opens uploader dialog
- Empty state when no items
- Integrates with `useGroceryCart` for state management

---

#### Phase 7: Create Cart Item Card Component

**New File: `src/components/grocery-budget/CartItemCard.tsx`**

Features:
- Product name and brand
- Current store badge (tappable to cycle stores or dropdown)
- Price display (updates when store changes)
- Quantity controls (+/- buttons)
- Remove button (trash icon)
- Subtotal for item (price × quantity)

---

#### Phase 8: Create Store Filter Pills Component

**New File: `src/components/grocery-budget/StoreFilterPills.tsx`**

Features:
- Pill buttons: All, Checkers, Makro, PnP, Woolies
- "All" has amber/orange background when selected (matching screenshot)
- Other pills have black background when selected
- Unselected pills have white background with black border
- `onStoreChange(store)` callback

---

#### Phase 9: Create Scan List Dialog Component

**New File: `src/components/grocery-budget/ScanListDialog.tsx`**

Wrapper component that:
- Opens as a modal/dialog
- Contains the `ImageUploader` component
- Shows scanning progress
- Displays parsed items with confirmation
- "Add All to List" button
- Calls `addToCart` for each matched item

---

#### Phase 10: Update Navigation and Routes

**Modify: `src/App.tsx`**
- Add route: `/grocery-budget` → `<GroceryBudget />`
- Consider removing or redirecting `/compare` and `/scan` routes

**Modify: `src/components/layout/Navbar.tsx`**
- Replace "Compare Prices" and "Scan List" nav items with single "Grocery Budget" item
- Use `ShoppingCart` icon
- Route to `/grocery-budget`

---

#### Phase 11: Add Translations

**Modify: `src/locales/en.json` (and other locale files)**

Add new translation keys:
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
  "estMonthlyBudget": "Est. Monthly Grocery Budget",
  "itemsTotal": "{{count}} items · Est. Total",
  "cheapestAt": "Cheapest at",
  "scanList": "Scan List",
  "addedToList": "Added {{count}} items to your list",
  "changeStore": "Change store"
}
```

---

### File Structure Summary

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
├── src/components/layout/Navbar.tsx (update nav items)
├── src/locales/en.json (add translations)
├── src/locales/af.json
├── src/locales/zu.json
├── src/locales/xh.json
├── src/locales/nso.json
├── src/locales/st.json
├── src/locales/tn.json
├── src/locales/ts.json
├── src/locales/ve.json
├── src/locales/ss.json
└── src/locales/nr.json
```

---

### Technical Considerations

1. **Cart Persistence**: Use localStorage to persist cart between sessions
2. **Store Filtering**: Filter products client-side after API response to avoid multiple API calls
3. **Neo-brutalist Styling**: Maintain 2px borders, 4px hard shadows, rounded corners
4. **Mobile Responsiveness**: Use `useIsMobile` hook for adaptive layouts
5. **Edge Functions**: Reuse existing `search-products` and `scan-grocery-list` functions
6. **Currency**: All prices in cents, divide by 100 for display using `formatPriceCents`

