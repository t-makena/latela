

# Apply Minimalist Axis Style to Balance and Spending Trend Charts

Match the Savings Balance chart's clean look: hide X and Y axes, show only min/max Y-axis tick labels, values revealed on hover via tooltips.

## Charts to Update

### 1. Balance chart (`FinancialInsightContent.tsx`)
Two instances (mobile + desktop, lines 473-536 and 560-623):
- **XAxis**: Add `hide={true}` to remove the X-axis entirely
- **YAxis**: Replace current full axis with the Savings Balance pattern:
  - Compute `minValue` / `maxValue` from `netBalanceData`
  - Deduplicate ticks: `ticks = min === max ? [min] : [min, max]`
  - Set `hide={false}`, `axisLine={false}`, `tickLine={false}`, `domain={[min, max]}`
  - Format ticks as `R{value}` with `fontSize: 11`, `width: 70`
- Remove the `CartesianGrid` or keep it -- for consistency with Savings chart, remove it
- Remove the "Balance" rotated label from YAxis

### 2. Spending Trend chart (`EnhancedSpendingChart.tsx`)
Two chart types in this component:

**BarChart (lines 155-447)** -- used for 1W, 1M, 1Y:
- **XAxis** (line 157): Add `hide={true}`
- **YAxis** (line 168): Replace with min/max ticks pattern, remove rotated "Amount Spent" label, set `axisLine={false}`, `tickLine={false}`, format as `R{value}`
- Remove `CartesianGrid`

**LineChart (lines 449-474)** -- fallback for custom long ranges:
- **XAxis** (line 451): Add `hide={true}`
- **YAxis** (line 457): Same min/max ticks pattern, remove "Amount Spent per Month" label
- Remove `CartesianGrid`

## Technical Details

### Balance chart changes
Before each `<ResponsiveContainer>` for the Balance chart, compute:
```tsx
const allBalanceValues = netBalanceData.flatMap(d => [d.netBalance, d.budgetBalance]);
const minBalance = Math.min(...allBalanceValues);
const maxBalance = Math.max(...allBalanceValues);
const balanceTicks = minBalance === maxBalance ? [minBalance] : [minBalance, maxBalance];
```

Then in both mobile and desktop LineCharts:
```tsx
<XAxis dataKey="month" hide={true} />
<YAxis
  hide={false}
  ticks={balanceTicks}
  axisLine={false}
  tickLine={false}
  tickFormatter={(value) => `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`}
  stroke="hsl(var(--muted-foreground))"
  fontSize={11}
  width={70}
  domain={[minBalance, maxBalance]}
/>
```

Remove `<CartesianGrid>` from both instances.

### Spending Trend chart changes
For the BarChart, compute min/max from `getChartData()` totals. For the LineChart fallback, compute from the `amount` field.

```tsx
// Inside render, before ResponsiveContainer
const chartData = getChartData();
const allTotals = chartData.map(d => d.total || 0);
const minSpend = Math.min(...allTotals);
const maxSpend = Math.max(...allTotals);
const spendTicks = minSpend === maxSpend ? [minSpend] : [minSpend, maxSpend];
```

Then:
```tsx
<XAxis ... hide={true} />
<YAxis
  hide={false}
  ticks={spendTicks}
  axisLine={false}
  tickLine={false}
  tickFormatter={(value) => `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`}
  stroke="hsl(var(--muted-foreground))"
  fontSize={11}
  width={70}
  domain={[minSpend, maxSpend]}
/>
```

Remove `<CartesianGrid>` from both BarChart and LineChart.

### Files to edit
1. `src/components/financial-insight/FinancialInsightContent.tsx` -- Balance chart (2 instances: mobile + desktop)
2. `src/components/dashboard/EnhancedSpendingChart.tsx` -- Spending Trend chart (BarChart + LineChart)

No new dependencies.

