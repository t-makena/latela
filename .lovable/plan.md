

## Fix: Budget Allocation Not Working

### Problem
Budget items are saved **without** their `parent_category_id`, so the percentage-based allocation system (Needs/Wants/Savings) has no data to work with. All allocations show as zero.

The bug is a 3-link broken chain:

1. `Budget.tsx` -- `handleAddBudgetItem` receives `parentCategoryId` but discards it (prefixed with `_`)
2. `useBudgetItems.ts` -- `addBudgetItem` and `addMutation` don't accept a `parentCategoryId` parameter
3. `useBudgetItems.ts` -- The database INSERT never includes `parent_category_id`

### Changes

**1. `src/hooks/useBudgetItems.ts`**

- Add `parentCategoryId` to `addMutation`'s input type
- Include `parent_category_id` in the Supabase INSERT
- Update the `addBudgetItem` wrapper function to accept and pass through the parameter

**2. `src/pages/Budget.tsx`**

- Remove the underscore from `_parentCategoryId` and pass it through to `addBudgetItem`

### Result

| Before | After |
|--------|-------|
| `parent_category_id` always NULL | Saved correctly from the selected subcategory |
| Category allocations always 0 | Allocations reflect actual budget items |
| "Exceeds limit" warning never triggers | Warns when Needs/Wants/Savings limits are exceeded |
| Percentage-based budgeting is decorative | Percentage-based budgeting actually works |

