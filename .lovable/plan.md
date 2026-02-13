

## Fix: Budget Allocation Pie Chart Not Showing Data

### Root Cause

In `src/components/financial-insight/BudgetBreakdown.tsx`, both the simple and detailed category calculations check `transaction.type === 'expense'`. However, transactions fetched from the `v_transactions_with_details` view do **not** have a `type` field. Expenses are identified by `amount < 0`. Since `transaction.type` is always `undefined`, the filter never matches and the pie chart renders with zero data.

### Fix

**File: `src/components/financial-insight/BudgetBreakdown.tsx`**

Two changes:

1. **Line 182** (simple category data):
   Change `if (transaction.type === 'expense' && transaction.parent_category_name)` to `if (transaction.amount < 0 && transaction.parent_category_name)`

2. **Line 207** (detailed category data):
   Change `if (transaction.type === 'expense')` to `if (transaction.amount < 0)`

Also remove the `type` field from the `Transaction` interface (line 14) since it does not exist on the data.

### Summary

Three small edits in one file. The `type` field was never populated, so the expense filter silently excluded all transactions.

