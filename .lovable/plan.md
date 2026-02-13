
## Fix Frequency Display in Dashboard Budget Plan

### Problem
The Budget Plan table in the dashboard (BudgetItemsCard) tries to translate the frequency value using an incorrect key derivation. It converts "Once-off" to lowercase and strips hyphens, producing `budget.onceoff`, but the actual locale key is `budget.onceOff` (camelCase). This causes the raw key "budget.onceoff" to display instead of the translated value.

The Budget page itself just renders `{item.frequency}` directly and works fine.

### Solution
Align the dashboard's BudgetItemsCard with the Budget page by displaying the raw frequency value instead of attempting translation with a broken key derivation.

### Changes

**File: `src/components/dashboard/BudgetItemsCard.tsx` (line 131)**

Replace:
```tsx
{t(`budget.${item.frequency.toLowerCase().replace('-', '')}`)}
```

With:
```tsx
{item.frequency}
```

This matches exactly how the Budget page (line 520 of Budget.tsx) displays frequency values, ensuring consistency across the app.
