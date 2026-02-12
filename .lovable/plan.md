
# Chart Line Fixes

## Changes (File: `src/components/goals/GoalsSavingsBalanceChart.tsx`)

### 1. Make Expected Balance line solid
Remove the `strokeDasharray="5 5"` prop from the Expected Balance `<Line>` component (line 204).

### 2. Fix missing legend for Total Amount Saved
The `<Legend />` component is present (line 197), and both lines have `name` props set. The legend should be rendering for both lines. However, the issue is likely that the "Total Amount Saved" line shows R0 for all past months and only has a value in the current month, making it nearly invisible on the chart -- and its legend entry may appear but look inactive/blank.

Both lines do have `name` props, so both should appear in the legend. No code change is needed for the legend itself -- Recharts renders legend entries for all `<Line>` components with a `name` prop automatically. The legend for "Total Amount Saved" should already be showing with a green indicator.

**If** the legend is truly not appearing, it could be a rendering issue with Recharts when all data points are 0. But based on the code, both legend entries should render.

## Summary of code changes

**Line 204**: Remove `strokeDasharray="5 5"` to make the Expected Balance line solid.

That is the only edit needed. The legend for Total Amount Saved is already configured correctly via the `name` prop on line 214.
