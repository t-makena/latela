
## Fix: Budget Allocation Should Track Actual Spending, Not Budget Plan

### Problem
The budget allocation (Needs/Wants/Savings breakdown) currently sums up planned budget item amounts. It should instead aggregate actual transaction spending from the current month, grouped by parent category into Needs, Wants, and Savings.

### Changes

**1. `src/hooks/useBudgetMethod.ts` -- `calculateCategoryAllocations`**

Replace the logic that sums budget item amounts with logic that sums actual transaction spending:

- Accept `transactions` (from `useTransactions`) instead of `budgetItems` and `calculateMonthlyAmount`
- For each expense transaction (amount < 0), look up its `parent_category_name` and map it to Needs/Wants/Savings using `PARENT_NAME_TO_BUDGET_CATEGORY`
- Sum the absolute amounts per category
- Keep the existing limit calculations (percentage of available balance) unchanged
- Update the `allocated` and `remaining` fields based on actual spending

Updated signature:
```text
calculateCategoryAllocations(
  availableBalance: number,
  transactions: Transaction[]    // replaces budgetItems + calculateMonthlyAmount
): CategoryAllocations
```

**2. `src/pages/Budget.tsx` -- Wire up transactions instead of budget items**

- Change the `categoryAllocations` useMemo (lines 247-262) to pass `transactions` to `calculateCategoryAllocations` instead of `budgetItems` and `calculateMonthlyAmount`
- Remove the `itemsWithCategories` mapping logic (no longer needed)
- Pass `transactions` which are already loaded via `useTransactions()`

**3. `src/components/budget/AddBudgetItemDialog.tsx` -- Update prop usage (if needed)**

- The dialog receives `categoryAllocations` for limit warnings -- this will now reflect actual spending vs limits, which is the correct behavior (warn when actual spending approaches the category limit)

### Result

| Before | After |
|--------|-------|
| Allocation = sum of planned budget item amounts | Allocation = sum of actual transaction spending |
| Empty budget items = zero allocation | Transactions with categories drive allocation |
| Limit warnings based on planned amounts | Limit warnings based on real spending |
| Uncategorized transactions ignored | Uncategorized transactions excluded (no parent category) |
