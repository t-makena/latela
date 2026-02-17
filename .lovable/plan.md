

## Fix: Budget Allocation Pie Chart Shows Empty

### Root Cause

The `BudgetBreakdown.tsx` component (used in the Financial Insight page) groups transactions by `parent_category_name` and checks against top-level names ("Necessities", "Discretionary", "Savings"). However, the database view returns **mid-level** names like "Food & Groceries", "Dining & Restaurants", etc. So:

```
parentCategoryTotals.hasOwnProperty("Food & Groceries")  // false
parentCategoryTotals.hasOwnProperty("Necessities")        // never returned by DB
```

Every transaction fails the lookup, and the pie chart renders empty.

### Fix

**`src/components/financial-insight/BudgetBreakdown.tsx` -- `getSimpleCategoryData` function (around lines 157-175)**

Import `SUBCATEGORY_NAME_TO_BUDGET_CATEGORY` from `@/lib/categoryMapping` and use it to map mid-level category names to their parent budget category before accumulating totals.

```text
Before:
  if (parentCategoryTotals.hasOwnProperty(parentCategory)) {
    parentCategoryTotals[parentCategory] += amount;
  }

After:
  // Map mid-level name to parent bucket
  const mapped = SUBCATEGORY_NAME_TO_BUDGET_CATEGORY[parentCategory];
  const parentBucket = mapped === 'needs' ? 'Necessities'
                     : mapped === 'wants' ? 'Discretionary'
                     : mapped === 'savings' ? 'Savings'
                     : mapped === 'income' ? 'Income'
                     : null;
  if (parentBucket && parentCategoryTotals.hasOwnProperty(parentBucket)) {
    parentCategoryTotals[parentBucket] += amount;
  }
```

This single change will make the simple (parent-level) pie chart display actual spending data. The detailed view already works correctly since it uses `subcategory_name` / `display_subcategory_name` directly.

### What This Does NOT Change
- The detailed pie chart view (already works with subcategory names)
- The `useBudgetMethod` hook (already fixed in the previous change)
- No database changes needed
