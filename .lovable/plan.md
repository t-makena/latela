

## Fix: Account Insight Falling Back to Fabricated Data Instead of "N/A"

### Problem
The desktop Account Insight table (in `FinancialInsightContent.tsx` and `BudgetBreakdown.tsx`) fabricates comparison values when real historical data is unavailable, instead of displaying "N/A" as agreed. Three specific issues:

1. **Fabricated multipliers**: When no historical spending data exists, the code uses made-up fallbacks like `spending * 0.9`, `spending * 0.85`, `spending * 0.8`, `spending * 0.75` -- these are not real.
2. **Wrong index clamping**: `Math.max(0, currentMonthIdx - 12)` reuses January's data when a period goes before the available range, instead of returning null.
3. **BudgetBreakdown defaults to 0**: When a comparison value is falsy, percentage changes default to `0` instead of `null` / "N/A".

The mobile version (`MobileBudgetInsightCard`) already handles this correctly with `null` values and "N/A" display.

### Changes

**1. `src/components/financial-insight/FinancialInsightContent.tsx`**

- Replace the `monthlySpending` index lookups (lines 229-234) with proper null checks: if the index is out of range or the period has no transaction data, set the comparison object to `null` instead of using the fallback object.
- Remove all fabricated multipliers (`budgetBalance * 0.9`, `spending * 0.9`, etc.) from the props passed to `BudgetBreakdown`. Pass `null` for periods without real data.
- Remove the spending fallback to "latest month with data" (lines 213-227) -- if there is no current-month spending, show 0, not data from another month.

**2. `src/components/financial-insight/BudgetBreakdown.tsx`**

- Update the prop types to allow `null` for `threeMonthsAgo`, `sixMonthsAgo`, `oneYearAgo` (already optional, but their inner values need to support null).
- Change percentage change calculations (lines 93-135) to return `null` instead of `0` when the comparison data is missing or the denominator is zero.
- Update the table rendering to display "N/A" with neutral styling when a change value is `null`, matching the mobile card's behavior.

### Result

| Scenario | Before | After |
|----------|--------|-------|
| No data for 6M ago | Shows fabricated `-20%` | Shows "N/A" |
| No data for 1Y ago | Shows fabricated `-25%` | Shows "N/A" |
| Budget balance comparison | Shows `budgetBalance * 0.9` | Shows "N/A" (no historical snapshots) |
| No current month spending | Falls back to old month's data | Shows R0 |

