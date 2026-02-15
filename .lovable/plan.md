

## Fix Account Insight Percentage Calculations

### Problems Identified

1. **Data scope too narrow**: The component calls `useTransactions()` with defaults (`currentMonthOnly: true, limit: 500`), so it only has current-month transactions. Selecting 3M, 6M, or 1Y still computes against the same tiny dataset, producing identical figures.

2. **Fake fallback values**: When no previous-period data exists:
   - Available Balance falls back to `currentBalance * 0.9`, always showing +11.1%
   - Budget Balance always uses `currentBudget * 0.9`, always showing +11.1%
   - Spending shows 0% change (or copies current period)

3. **No "N/A" display**: Periods without data should show "N/A" instead of fabricated percentages.

### Solution

**File: `src/components/accounts/MobileBudgetInsightCard.tsx`**

1. Change `useTransactions()` to `useTransactions({ currentMonthOnly: false, limit: 2000 })` so historical data is available for all period comparisons.

2. Track whether each metric has sufficient data by checking if there are actual transactions in the previous period:
   - `hasCurrentData`: current period has transactions
   - `hasPreviousData`: previous period has transactions
   - If either is missing, the change value becomes `null` (rendered as "N/A")

3. Remove the fake `* 0.9` fallback for available balance and budget balance. Instead:
   - **Available Balance**: Use actual previous-period ending balance from transactions. If no previous transactions exist, return `null`.
   - **Budget Balance**: Since historical budget snapshots aren't stored, return `null` (N/A) -- this is honest rather than fabricating a number.
   - **Spending**: Already correct logic, just needs the null/N/A guard when `previousSpending === 0` and `currentSpending === 0`.

4. Update the return type to use `number | null` for all change values.

5. Update rendering: when a change value is `null`, display "N/A" with neutral styling instead of calling `formatChange()`.

### Technical Details

```
Metric return type changes:
  availableBalanceChange: number | null
  budgetBalanceChange: number | null  
  spendingChange: number | null

Rendering logic:
  {change === null ? "N/A" : formatChange(change)}

Data fetching:
  useTransactions({ currentMonthOnly: false, limit: 2000 })
```

| Change | Detail |
|--------|--------|
| Fetch historical transactions | `currentMonthOnly: false, limit: 2000` |
| Remove `* 0.9` fallback for available balance | Use actual previous-period balance or null |
| Remove `* 0.9` fallback for budget balance | Show N/A (no historical budget snapshots) |
| Add null checks for spending | Return null when both periods have zero transactions |
| Render "N/A" for null changes | Neutral styling, no sign prefix |

