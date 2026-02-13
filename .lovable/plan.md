

## Fix: Chrome Extension "Add to List" Deep Link

### Problem
The "add to list" Chrome extension flow is broken because of a data source mismatch:

- The extension writes items to the `user_shopping_list` **database table**
- The app's "My List" grocery UI reads from **localStorage** (key: `grocery-cart`) via the `useGroceryCart` hook
- These are two completely separate data stores, so items added by the extension never show up in the app

The "add to budget" flow works because both the extension and the app use the same `budget_items` database table.

### Solution
Add a `/add-to-list` route that receives query parameters from the extension deep link and writes directly to localStorage (the `grocery-cart` key), which is the source of truth for the My List UI.

### Changes

**1. Create a new page component: `src/pages/AddToList.tsx`**
- Reads query parameters: `name`, `price`, `store` (and optionally `brand`, `image`)
- Reads the existing `grocery-cart` from localStorage
- Appends the new item in the same `CartItem` format that `useGroceryCart` expects
- Writes updated array back to localStorage
- Shows a brief success toast
- Redirects to `/budget` and automatically opens the grocery sub-view on the "My List" tab

**2. Register the route in `src/App.tsx`**
- Add `<Route path="/add-to-list" element={<ProtectedRoute><Layout><AddToList /></Layout></ProtectedRoute>} />`

**3. Update `src/pages/Budget.tsx`**
- Accept an optional URL search parameter (e.g., `?view=grocery&tab=list`) so the redirect from AddToList can open directly into the grocery sub-view's "My List" tab
- Read `searchParams` on mount and set `view` and `groceryTab` state accordingly

### How it works end-to-end

```text
Extension clicks "Add to List"
  --> Opens: https://latela.lovable.app/add-to-list?name=Milk&price=2599&store=checkers
  --> AddToList page reads params, writes to localStorage 'grocery-cart'
  --> Redirects to /budget?view=grocery&tab=list
  --> Budget page reads searchParams, opens grocery sub-view on My List tab
  --> useGroceryCart loads from localStorage and shows the new item
```

### Technical Details

**CartItem format** (matching `useGroceryCart`):
```typescript
{
  id: `ext-${Date.now()}`,
  productId: `ext-${name}-${Date.now()}`,
  productName: name,
  brand: brand || null,
  imageUrl: image || null,
  quantityValue: null,
  quantityUnit: null,
  selectedOffer: {
    store: store,
    store_display_name: store,
    price_cents: parseInt(price),
    unit_price_cents: null,
    in_stock: true,
    on_sale: false,
    promotion_text: null,
    product_url: null,
  },
  availableOffers: [/* same offer */],
  quantity: 1,
  addedAt: Date.now(),
}
```

**Files to create:**
- `src/pages/AddToList.tsx`

**Files to edit:**
- `src/App.tsx` -- add the `/add-to-list` route
- `src/pages/Budget.tsx` -- read `view` and `tab` from URL search params on mount

No database changes needed. No edge function changes needed. This keeps localStorage as the single source of truth for the grocery list UI.

