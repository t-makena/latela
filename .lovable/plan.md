

## Fix: Available Balance showing R0 in 1W view

### Root Cause

In `src/components/financial-insight/FinancialInsightContent.tsx`, the `getNetBalanceData()` function has two problems:

1. **Empty range early return (line 128-134)**: When no transactions fall within the 1W date range (Feb 8-14), it returns `netBalance: 0` for every label -- ignoring older transactions entirely.

2. **Baseline starts at 0 (line 182)**: Even when some transactions exist in the range, `lastBalance` is initialized to `0` instead of the most recent balance before the range starts.

### Fix

**File**: `src/components/financial-insight/FinancialInsightContent.tsx`

**Step 1** -- After filtering transactions to the date range (line 93-98), find the most recent transaction balance *before* the range starts:

```ts
// Find the last known balance before the date range
const latestBeforeRange = transactions
  .filter(t => new Date(t.transaction_date) < dateRange.from)
  .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0];

const baselineBalance = latestBeforeRange?.balance ?? 0;
```

**Step 2** -- Update the empty-range early return (line 128-134) to use `baselineBalance` instead of `0`:

```ts
if (filteredTransactions.length === 0) {
  return labels.map((label, index) => ({
    month: label,
    netBalance: baselineBalance,
    budgetBalance: getSavingsForDate(periodEndDates[index])
  }));
}
```

**Step 3** -- Update the `lastBalance` initialization (line 182) to use `baselineBalance`:

```ts
let lastBalance = baselineBalance;
```

### Result

- When no transactions exist in the 1W window, the chart shows a flat line at the last known balance (R15,951.28) instead of R0.
- When some days have transactions and some don't, the carry-forward logic starts from the correct baseline rather than 0.
- All other time filters (1M, 3M, 6M, 1Y) also benefit from this fix.

### Scope

Only one file changes: `src/components/financial-insight/FinancialInsightContent.tsx`, three small edits within `getNetBalanceData()`.

