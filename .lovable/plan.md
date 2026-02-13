

## Fix: Balance Graph Savings Line

### Problems

**In `src/components/financial-insight/FinancialInsightContent.tsx`, function `getNetBalanceData()`:**

1. **1W shows flat 0**: When there are no transactions in the selected period, line 103-105 returns early with `budgetBalance: 0` for all points, ignoring goal savings entirely.

2. **All other periods show flat R2,000 everywhere**: Line 164 sets `budgetBalance: totalAmountSaved` as a constant for every data point regardless of when the goal was created. So Dec, Jan, and Feb all show R2,000 even though the goal was only created on Feb 13.

### Correct Behavior

- **1W** (Feb 7-13): The goal was created Feb 13 (today), so the savings line should show R2,000 for today and 0 for prior days.
- **1M** (approx Jan W3 to Feb W2): Should be 0 for all weeks before Feb W2, then R2,000 from Feb W2 onward.
- **3M/6M/1Y**: Should show 0 for all months before Feb 2026, then R2,000 for Feb 2026.

### Solution

Update `getNetBalanceData()` to compute per-period savings based on each goal's `createdAt` date instead of using a flat total.

**File: `src/components/financial-insight/FinancialInsightContent.tsx`**

#### Change 1: Fix the early return (line 103-105)

Remove `budgetBalance: 0` from the no-transactions fallback. Instead, compute savings per-label using the same goal-date logic below.

#### Change 2: Replace flat `totalAmountSaved` (line 153 + 164)

Instead of:
```js
const totalAmountSaved = goals.reduce(...);
// ...
budgetBalance: totalAmountSaved
```

For each data point, calculate savings as the sum of `goal.amountSaved` for goals created on or before that period's end date:

```js
// For each period, compute savings based on goal creation dates
const getSavingsForDate = (periodEnd: Date) => {
  return goals.reduce((sum, goal) => {
    const created = new Date(goal.createdAt);
    return created <= periodEnd ? sum + goal.amountSaved : sum;
  }, 0);
};
```

#### Change 3: Track actual period dates alongside labels

The current code generates string labels but loses the actual dates. Refactor to retain the period end date for each label so `getSavingsForDate` can be called per data point:

- **1W**: Each label maps to a day -- use that day as the period date
- **1M**: Each label maps to a week interval -- use the week's end date
- **3M/6M/1Y**: Each label maps to a month -- use end of that month

Then in the final `labels.map()` (line 157), replace:
```js
budgetBalance: totalAmountSaved
```
with:
```js
budgetBalance: getSavingsForDate(periodEndDates[index])
```

And similarly in the no-transactions path, return savings based on goal dates instead of 0.

### Visual Result

```text
Before (6M view, goal created Feb 13 with R2,000):
Savings: R2,000 -> R2,000 -> R2,000 -> R2,000 -> R2,000 -> R2,000
         Sep      Oct       Nov       Dec       Jan       Feb

After:
Savings: R0     -> R0      -> R0      -> R0      -> R0      -> R2,000
         Sep      Oct       Nov       Dec       Jan       Feb
```

