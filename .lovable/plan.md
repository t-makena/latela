

## Fix: Budget Allocation Shows Empty Due to Category Name Mismatch

### Root Cause

The `calculateCategoryAllocations` function maps `transaction.parent_category_name` against `PARENT_NAME_TO_BUDGET_CATEGORY`, which expects top-level names like **"Necessities"**, **"Discretionary"**, **"Savings"**.

However, the database view `v_transactions_with_details` returns **mid-level** category names like "Food & Groceries", "Dining & Restaurants", "Bills & Subscriptions" in the `parent_category_name` field. Every lookup returns `undefined`, so all allocations stay at zero.

| What the code expects | What the DB actually returns |
|---|---|
| "Necessities" | "Food & Groceries", "Bills & Subscriptions", "Fees", etc. |
| "Discretionary" | "Dining & Restaurants", "Entertainment & Recreation", "Miscellaneous", etc. |
| "Savings" | "Savings & Investments" |

### Fix

**`src/lib/categoryMapping.ts`** -- Add a complete mapping from mid-level category names to budget categories:

```
SUBCATEGORY_NAME_TO_BUDGET_CATEGORY = {
  // Necessities
  "Food & Groceries": "needs",
  "Bills & Subscriptions": "needs",
  "Housing & Utilities": "needs",
  "Transportation & Fuel": "needs",
  "Healthcare & Medical": "needs",
  "Fees": "needs",
  // Discretionary
  "Dining & Restaurants": "wants",
  "Entertainment & Recreation": "wants",
  "Shopping & Retail": "wants",
  "Personal & Lifestyle": "wants",
  "Miscellaneous": "wants",
  "Offertory/Charity": "wants",
  "Assistance/Lending": "wants",
  // Savings
  "Savings & Investments": "savings",
  // Income
  "Salary & Wages": "income",
  "Other Income": "income",
  "Bonuses & Commissions": "income",
  "Refunds & Reimbursements": "income",
}
```

**`src/hooks/useBudgetMethod.ts`** -- Update `calculateCategoryAllocations` to use the new mapping instead of `PARENT_NAME_TO_BUDGET_CATEGORY`:

```
// Change this line:
const budgetCategory = PARENT_NAME_TO_BUDGET_CATEGORY[tx.parent_category_name];
// To:
const budgetCategory = SUBCATEGORY_NAME_TO_BUDGET_CATEGORY[tx.parent_category_name];
```

### Result

| Before | After |
|--------|-------|
| Every category lookup returns undefined | Each transaction maps to Needs, Wants, or Savings |
| All allocations show 0 | Allocations reflect actual spending |
| Percentage bars are empty | Percentage bars show real usage vs limits |

