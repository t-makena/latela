
# Fix Legend Spacing and Horizontal Score Card Layout

## 1. Savings Balance Chart — More legend spacing
**File: `src/components/goals/GoalsSavingsBalanceChart.tsx`**

Increase the bottom margin on the `<LineChart>` from `20` to `40` to push the legend further below the chart lines, especially visible in longer time periods.

```tsx
<LineChart data={chartData} margin={{ bottom: 40 }}>
```

## 2. Horizontal LatelaScoreCard — Fix score circle and risk alignment
**File: `src/components/budget/LatelaScoreCard.tsx`**

Current issue: The score circle uses `border-6` which isn't a standard Tailwind class (should be `border-[6px]`), and the risk status block sits too high relative to the right column's bottom metrics.

Changes to the horizontal layout (lines 118-183):

- **Score circle**: Change `border-6` to `border-[6px]` to ensure the border renders properly as a visible circle outline.
- **Restructure left column**: Keep the score circle at top with "out of 100" label, but move the risk status block further down by adding top margin (`mt-auto` or explicit `mt-4`) so it aligns vertically with the bottom row of metrics (Avg Daily Spend / Risk Ratio) in the middle column.
- **Grid alignment**: Change the grid from `items-start` to `items-stretch` or keep `items-start` but use flexbox spacing within the left column to push risk status to the bottom.

Specifically:
```tsx
<div className="flex flex-col items-center gap-3 justify-between h-full">
  {/* Score circle + label at top */}
  <div className="flex flex-col items-center gap-1">
    <div className="flex items-center justify-center w-24 h-24 rounded-full border-[6px] ...">
      <span>{totalScore}</span>
    </div>
    <p className="text-xs ...">out of 100</p>
  </div>
  {/* Risk status pushed to bottom */}
  <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/50 w-full">
    ...
  </div>
</div>
```

This ensures the score circle border renders correctly, and the risk status aligns with the bottom metrics row.
