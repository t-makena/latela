

## Move Bar/Line Toggle from "Spending by Category" to "Spending Trend"

### What's Changing
The Bar/Line toggle was mistakenly added to the "Spending by Category" chart on the Analytics page. It should instead be on the "Spending Trend" chart (`EnhancedSpendingChart.tsx`), which appears on the Accounts page.

### Changes

#### 1. Remove toggle from FinancialInsightContent.tsx (Analytics page)
- Remove the `categoryChartMode` state variable (line 54)
- Remove the `getTotalSpendingLineData()` function and its result (lines 393-449)
- Remove the Bar/Line toggle buttons in both mobile (lines 786-791) and desktop (lines 945-950) sections
- Remove the `ComposedChart` line chart branches in both mobile and desktop chart rendering (the `categoryChartMode === 'line'` conditional blocks)
- Keep everything else intact (bar chart, category drill-down line graph on double-click, etc.)

#### 2. Add toggle to EnhancedSpendingChart.tsx (Spending Trend)
- Add imports: `ComposedChart`, `Area`, `Button`
- Add `chartMode` state: `useState<'bar' | 'line'>('bar')`
- Add `getLineData()` function that aggregates all expense transactions into time-period buckets (daily/weekly/monthly) using the existing `dateRange` and period logic
- Compute the dominant category color from `chartData` -- find which category key has the highest total across all data points and use its color from `categoryColors`
- Add Bar/Line toggle buttons next to the "Spending Trend" title
- When `chartMode === 'line'`, render a `ComposedChart` with:
  - A `linearGradient` using the dominant color (0.3 to 0.05 opacity)
  - An `Area` for the gradient fill (`tooltipType="none"`)
  - A `Line` with `dot={false}`, `strokeWidth={2}`, matching the Balance chart aesthetic
  - `ReferenceDot` labels for highest and lowest spending points
  - Hidden axes

### Files Modified

| File | Action |
|---|---|
| `src/components/financial-insight/FinancialInsightContent.tsx` | Remove toggle, line mode state, and line chart branches |
| `src/components/dashboard/EnhancedSpendingChart.tsx` | Add toggle, line data function, and line chart rendering |
