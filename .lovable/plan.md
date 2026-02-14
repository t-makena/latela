

## Fix: Savings Balance Chart — Two Bugs

### Bug 1: Tooltip shows both lines as "Saving's Balance"

**File**: `src/components/goals/GoalsSavingsBalanceChart.tsx`, line 214

The tooltip formatter checks `name === 'expected'` but Recharts passes the Line's `name` prop (which is `"Expected Balance"`), not the `dataKey`. So the condition never matches and both lines get labeled "Saving's Balance".

**Fix**: Change `name === 'expected'` to `name === 'Expected Balance'`

### Bug 2: 1M view Expected Balance shows monthly allocation instead of current total

**File**: `src/components/goals/GoalsSavingsBalanceChart.tsx`, line 62

The 1M view sets `flatExpected = expectedMonthlySavings` (the sum of monthly allocations, e.g. R400). Since both lines should be equal at the current point, this should be `totalSaved` (e.g. R2,000).

**Fix**: Change `const flatExpected = expectedMonthlySavings;` to `const flatExpected = totalSaved;`

### Scope

Both the Dashboard (`/`) and Goals page use the same `GoalsSavingsBalanceChart` component, so these two line changes fix both pages.
