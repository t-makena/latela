

## Fix: Account Insight Showing All Zeros

### Problem
The Account Insight table on the Accounts page shows R0,00 for all three metrics (Available Balance, Budget Balance, Spending). This is caused by three issues in how `FinancialInsightContent.tsx` sources its data:

1. **No current-month transactions exist**: All 130 transactions are from January 2026, but the current date is February 2026. `calculateFinancialMetrics()` filters for the current month and gets an empty array.
2. **Wrong data source for Available Balance**: The Dashboard correctly uses `useAccounts` (actual bank balances from the `accounts` table: R15,951.28). But the Accounts page derives Available Balance from transaction net totals, which are zero.
3. **Wrong `monthlySpending` indexing**: The code uses `monthlySpending[length - 1]` (always December) instead of the current month's index.

### Solution
Update `FinancialInsightContent.tsx` to match the Dashboard's data sourcing pattern:

- **Available Balance**: Use `useAccounts` to sum actual account balances (same as Dashboard's `FinancialSummary`)
- **Budget Balance**: Use `useBudgetItems.calculateTotalMonthly()` plus upcoming calendar events (same as Dashboard)
- **Spending**: Sum negative transactions for the current month directly from the transactions array, falling back to the latest month with data if current month is empty
- **Historical comparisons**: Use `v_daily_account_balances` view data for Available Balance history (per existing memory), and direct transaction aggregation for spending comparisons, instead of the broken `monthlySpending` array indexing

### Technical Changes

**File: `src/components/financial-insight/FinancialInsightContent.tsx`**

1. Add imports for `useAccounts`, `useBudgetItems`, and `useCalendarEvents`
2. Replace the `calculateFinancialMetrics`-derived metrics (lines 162-170) with:
   - `availableBalance` = sum of all `account.balance` values from `useAccounts`
   - `budgetBalance` = `calculateTotalMonthly()` + upcoming events total
   - `spending` = sum of negative transaction amounts for current month (or latest month with data)
3. Fix historical comparison data (lines 162-166) to:
   - Use correct month indexing (`new Date().getMonth()` instead of `length - 1`)
   - Compute previous/3M/6M spending by directly filtering and summing transactions for those periods
   - Use account balance history from `v_daily_account_balances` for Available Balance comparisons
4. Remove unused `calculateFinancialMetrics` import if no longer needed in this component

This aligns the Accounts page with the Dashboard, ensuring both pages show the same Available Balance (R15,951.28) and Budget Balance figures sourced from the same hooks.

