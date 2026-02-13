

## Shopping List and Budget Plan Overhaul

This plan covers 5 changes: merchant-level budget grouping from the extension, manual item entry in the shopping list, sectioned list (budgeted vs considering), re-add capability for ticked-off items, and renaming "Grocery Budget" to "Cart Explorer".

---

### Change 1: Extension items use Merchant name, not item name, in Budget Plan

**Problem**: When the Chrome extension adds items via `/add-to-list`, each individual item (e.g. "LIMITED EDITION DENIM JACKET") gets its own name. If added to the budget plan, each item creates a separate row instead of grouping by merchant (e.g. "Zara").

**Solution**: The `AddToList` deep link already receives a `store` parameter. Modify the `CartItem` model and `AddToList` page to properly track the store/merchant. Then, when items from the shopping list are promoted to the budget plan, group them by merchant + frequency rather than individual item name.

**Key changes:**
- **`src/hooks/useGroceryCart.ts`**: Add a `status` field to `CartItem` (`'considering' | 'budgeted' | 'purchased'`) defaulting to `'considering'`, and add `addToBudget` / `markPurchased` / `reAddItem` callbacks
- **`src/pages/AddToList.tsx`**: Keep the store parameter as the merchant identifier (already captured)
- The budget plan integration uses the `store` (merchant) from `selectedOffer.store` or `selectedOffer.store_display_name` as the budget item name when promoting items

### Change 2: Manual entry in Shopping List

**Problem**: Users can only add items via search or scan -- no way to manually type an item.

**Solution**: Add an "Add Item" button + inline form/dialog in `MyListTab` that lets users enter:
- Item name (required)
- Merchant/Store (optional)
- Price in Rands (optional, converted to cents)

**Key changes:**
- **New component `src/components/grocery-budget/AddManualItemDialog.tsx`**: Dialog with three fields (name, merchant, price)
- **`src/components/grocery-budget/MyListTab.tsx`**: Add a `+` button next to "Scan List" that opens the manual entry dialog
- The manual item creates a `CartItem` with a synthetic `ProductOffer` (store = entered merchant or "Manual", price_cents = entered price or 0)

### Change 3: Section the Shopping List into "Budgeted" and "Considering"

**Problem**: All items sit in one flat list with no distinction between items already added to the budget plan and items still being considered.

**Solution**: Add a `status` field to `CartItem`. Items start as `'considering'`. When a user promotes an item (or group of merchant items) to the budget plan, status changes to `'budgeted'`. Purchased items become `'purchased'`.

**Key changes:**
- **`src/hooks/useGroceryCart.ts`**: 
  - Add `status: 'considering' | 'budgeted' | 'purchased'` to `CartItem` interface (default `'considering'`)
  - Add `markAsBudgeted(itemId)`, `markAsPurchased(itemId)`, `reAddItem(itemId)` callbacks
  - Migration: existing items without `status` default to `'considering'` on load
- **`src/components/grocery-budget/MyListTab.tsx`**: 
  - Split the items list into two sections with headers: "Considering" (status = `'considering'`) and "Budgeted" (status = `'budgeted'`)
  - Show purchased items in a collapsed "Purchased" section with strikethrough styling
  - Each item card gets a checkbox that toggles `'considering'` to `'purchased'` (tick off) and a "Add to Budget" action
- **`src/components/grocery-budget/CartItemCard.tsx`**: 
  - Add a checkbox on the left for tick-off
  - Add an "Add to Budget" small button/icon
  - Purchased items show with strikethrough and muted styling

### Change 4: Re-add purchased items

**Problem**: Once an item is ticked off, there's no way to bring it back.

**Solution**: Purchased items appear in a "Purchased" section. Each has a "Re-add" button (e.g. a refresh/undo icon) that sets status back to `'considering'`.

**Key changes:**
- **`src/components/grocery-budget/CartItemCard.tsx`**: When `status === 'purchased'`, show a re-add (RotateCcw) icon instead of the remove button
- **`src/hooks/useGroceryCart.ts`**: `reAddItem` sets status back to `'considering'`

### Change 5: Rename "Grocery Budget" to "Cart Explorer"

**Problem**: Feature is called "Grocery Budget" everywhere.

**Solution**: Update all references in locale files and navigation.

**Key changes:**
- **`src/locales/en.json`**: Change `"groceryBudget.title"` from `"Grocery Budget"` to `"Cart Explorer"`, update `nav.groceryBudget` similarly
- **All other locale files** (`af.json`, `zu.json`, etc.): Update the `groceryBudget.title` value
- **`src/pages/Budget.tsx`**: The `GroceryNavCard` and `GrocerySubView` already use `t('groceryBudget.title')` so they'll update automatically

---

### Technical Details

**Files to create:**
1. `src/components/grocery-budget/AddManualItemDialog.tsx` -- Manual item entry dialog

**Files to modify:**
1. `src/hooks/useGroceryCart.ts` -- Add `status` field, `markAsBudgeted`, `markAsPurchased`, `reAddItem`
2. `src/components/grocery-budget/CartItemCard.tsx` -- Add checkbox, budget action, purchased styling, re-add button
3. `src/components/grocery-budget/MyListTab.tsx` -- Section headers (Considering/Budgeted/Purchased), manual add button, "Add to Budget" grouping logic
4. `src/pages/Budget.tsx` -- Pass new callbacks through to MyListTab, handle "Add to Budget" by calling `addBudgetItem` with merchant name
5. `src/pages/AddToList.tsx` -- Ensure store is properly captured (already works)
6. `src/locales/en.json` -- Rename title to "Cart Explorer"
7. All other `src/locales/*.json` files -- Update title

**CartItem interface change:**
```typescript
export interface CartItem {
  // ...existing fields...
  status: 'considering' | 'budgeted' | 'purchased'; // NEW
}
```

**"Add to Budget" grouping logic (in MyListTab/Budget.tsx):**
When user taps "Add to Budget" on an item, the system:
1. Groups all `'considering'` items from the same merchant (store)
2. Sums their total price
3. Calls `addBudgetItem(merchantName, frequency, totalAmount)` -- frequency defaults to "Once-off" for non-grocery stores, "Monthly" for grocery retailers (reusing existing extension categorization logic)
4. Marks all grouped items as `'budgeted'`

