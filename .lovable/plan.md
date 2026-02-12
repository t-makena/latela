
# Fix: Green Legend Icon + Expected Balance Historical Assumption

## Issues

1. **Green legend missing**: The "Total Amount Saved" legend text appears but without the green color indicator. This is because Recharts renders the legend icon using the line's `stroke` color, but `hsl(var(--positive))` may not resolve properly in the SVG legend context. Need to use a concrete green color value.

2. **Expected Balance assumes past months**: The `cumulativeExpected` accumulates `expectedMonthlySavings` for every month in the period (e.g., 3 months back). But if goals were only created this month, there should be no expected balance for Dec or Jan -- only Feb. The expected line should only start accumulating from when goals actually existed.

## Changes (File: `src/components/goals/GoalsSavingsBalanceChart.tsx`)

### Fix 1: Green legend icon
Replace `hsl(var(--positive))` with a concrete green color `#22c55e` (green-500) for both the stroke and dot fill of the savings line. CSS custom properties inside `hsl()` don't always resolve in Recharts SVG legend icons.

### Fix 2: Expected balance should respect goal creation dates
Update the chart data loop to only accumulate `expectedMonthlySavings` for months where goals actually existed. For each month, check if any goals had been created by that month. Only include a goal's `monthlyAllocation` in the expected total for months on or after the goal's `created_at` date.

The logic change in the loop (around lines 69-70):
- Instead of blindly adding `expectedMonthlySavings` each month, iterate through goals and only sum allocations for goals that existed in that month
- Compare the chart month/year against each goal's `created_at` date

This ensures: if you created a goal in February with R5,000/month allocation, December and January show R0 expected, and only February shows R5,000.

## Technical Details

```text
Before (wrong):
  Dec: expected=5000, Jan: expected=10000, Feb: expected=15000

After (correct):  
  Dec: expected=0, Jan: expected=0, Feb: expected=5000
```

Two edits in one file, no new dependencies.
