
# Fix Savings Balance Chart: Duplicate Zeros and Legend Spacing

## Issues
1. **Duplicate "R0" labels**: When all data values are 0, both `minValue` and `maxValue` equal 0, so `ticks={[0, 0]}` renders two overlapping "R0" labels in the centre-left of the chart.
2. **Legend too close to chart**: No margin/padding between the bottom of the chart lines and the legend row.

## Fix

**File: `src/components/goals/GoalsSavingsBalanceChart.tsx`**

### 1. Deduplicate Y-axis ticks
When `minValue === maxValue`, only show a single tick instead of two identical values:

```tsx
const ticks = minValue === maxValue ? [minValue] : [minValue, maxValue];
// ...
<YAxis ticks={ticks} ... />
```

### 2. Add spacing above legend
Add a bottom margin to the `<LineChart>` so the legend sits further below the chart area:

```tsx
<LineChart data={chartData} margin={{ bottom: 20 }}>
```

Two small edits in the same file, no new dependencies.
