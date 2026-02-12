
# Make Budget Plan Card Height Dynamic

## Problem
The `BudgetItemsCard` uses `h-full` on its root `<Card>`, which forces it to stretch to fill the parent grid cell height. This means the card height is determined by the tallest sibling in the grid row, not by its own content.

## Fix

**File: `src/components/dashboard/BudgetItemsCard.tsx` (line 90)**

Remove `h-full` from the Card className so the card's height is determined naturally by the number of budget items it contains.

```tsx
// Before
<Card className="h-full">

// After
<Card>
```

This single change ensures the card grows and shrinks as items are added or removed.
