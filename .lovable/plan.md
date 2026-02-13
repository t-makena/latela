
## Grocery Budget UI Fixes

### 1. Background visibility
The grocery sub-view wrapper on mobile (`<div className="min-h-screen py-6 animate-fade-in">`) lacks transparency -- it needs to match other pages by not having a solid background. The desktop grocery view also needs the same treatment. This aligns with the existing pattern where Dashboard and Budget mobile views use transparent wrappers.

### 2. Replace tab buttons with header icon toggle
Remove the "Search" and "My List" tab buttons entirely. Instead:
- **When on Search tab**: Show "Grocery Budget" title on the left, and a ShoppingCart icon (with item count badge) in the top-right corner. Tapping the cart icon switches to the list view.
- **When on My List tab**: Show "Grocery Budget" title on the left (or "My List"), and a Search icon in the top-right corner. Tapping the search icon switches back to search.

This replaces the two-button tab navigation with a single contextual icon in the header row.

### 3. Move total to end of list, remove sticky footer
Remove the sticky bottom footer bar from the grocery sub-view. Instead, the items total / estimated budget line will be rendered at the bottom of the MyListTab component, after all cart item cards.

### Technical Details

**File: `src/pages/Budget.tsx`**
- In the `GrocerySubView` component:
  - Remove the entire tab navigation `<div>` (lines 251-277)
  - Update the header row: keep ArrowLeft + title on the left, add a toggle icon button on the right (ShoppingCart when on search, Search when on list, with item count badge on cart icon)
  - Remove the sticky footer `<div>` (lines 295-314)
  - Pass `groceryItemCount` and `groceryTotalCents` to `MyListTab` so it can render the total at the bottom

**File: `src/components/grocery-budget/MyListTab.tsx`**
- Accept new props: `totalCents` and `itemCount`
- After the cart items list, render the total line (e.g., "3 items: R129.99") using `formatPriceCents`
- When the list is empty, show nothing for the total
