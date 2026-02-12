

# Fix Chart Vertical Position and Legend Consistency

## Issue 1: Vertical positioning mismatch

The Savings Balance chart uses `margin={{ bottom: 40 }}` (no top margin), which pushes the graph lines toward the top and leaves space at the bottom. The Balance and Spending Trend charts use `margin={{ top: 40 }}`, which does the opposite -- pushing lines down but from a different baseline.

**Fix**: Align Balance and Spending Trend to match Savings Balance's margin pattern: `margin={{ bottom: 40 }}` with no top padding.

| Chart | Current margin | New margin |
|-------|---------------|------------|
| Balance (mobile) | `top: 40, bottom: 5` | `bottom: 40` |
| Balance (desktop) | `top: 40, bottom: 5` | `bottom: 40` |
| Spending Trend (BarChart) | `top: 40, bottom: 0` | `bottom: 40` |
| Spending Trend (LineChart) | `top: 40, bottom: 0` | `bottom: 40` |

## Issue 2: Legend style mismatch

The Balance chart legend uses `verticalAlign="bottom" height={24} iconType="line"` with a formatter. The Savings Balance chart uses a bare `<Legend />` with no props.

**Fix**: Update the Savings Balance `<Legend />` to match the Balance card's style:

```
<Legend verticalAlign="bottom" height={24} iconType="line" />
```

The Savings Balance lines already have `name` props set, so no formatter is needed -- the names will display automatically.

## Files to edit

1. **`src/components/financial-insight/FinancialInsightContent.tsx`** -- Change margin on both mobile and desktop LineChart instances from `{ top: 40, left: 0, right: 0, bottom: 5 }` to `{ bottom: 40 }`
2. **`src/components/dashboard/EnhancedSpendingChart.tsx`** -- Change margin on both BarChart and LineChart from `{ top: 40, left: 0, right: 0, bottom: 0 }` to `{ bottom: 40 }`
3. **`src/components/goals/GoalsSavingsBalanceChart.tsx`** -- Update `<Legend />` to `<Legend verticalAlign="bottom" height={24} iconType="line" />`
