

## Coinbase-Style Chart Refinements

### Overview
Apply 5 changes across all chart cards on the Accounts page: edge-to-edge graphs, remove legends, smaller data dots, relocate period filters below charts, and add a period filter to Budget Allocation.

### Affected Components
- **FinancialInsightContent.tsx** -- Balance chart (mobile + desktop), Spending by Category chart (mobile + desktop)
- **EnhancedSpendingChart.tsx** -- Spending Trend chart
- **GoalsSavingsBalanceChart.tsx** -- Savings Balance chart (Goals page, but same pattern)

---

### Change 1: Edge-to-edge graphs (Coinbase alignment)
Remove left/right padding so chart lines/bars start and end flush with the card edges.

- **All LineCharts/BarCharts**: Set `margin={{ top: 5, right: 0, left: 0, bottom: 0 }}` (remove the current `bottom: 40` and any `left: 20, right: 20` margins)
- **YAxis**: Set `width={0}` and `hide={true}` (the min/max ticks currently take up ~70px on the left). The Y-axis reference values are no longer needed since hover tooltips show amounts.
- **CardContent**: Remove horizontal padding on chart containers -- use `px-0` so the ResponsiveContainer fills the full card width. Keep vertical padding.
- Applies to: Balance chart (lines 480-538 mobile, 570-628 desktop), Spending Trend (line 161 BarChart, line 452 LineChart), Spending by Category (lines 686-778 mobile, 832-931 desktop), Savings Balance (lines 207-252).

### Change 2: Remove legends
Delete all `<Legend>` components from charts. The tooltip on hover already differentiates data series by name and color.

- **Balance chart**: Remove `<Legend>` at lines 519 (mobile) and 609 (desktop)
- **Savings Balance chart**: Remove `<Legend>` at line 234
- **Spending Trend / Category charts**: These don't currently have `<Legend>` components (they use custom tooltips), so no change needed

### Change 3: Smaller data point dots
Reduce `dot` radius from `r: 4` to `r: 1.5` and `activeDot` from `r: 6` to `r: 3` on all Line components.

- **Balance chart**: Lines 526-527, 534-535 (mobile) and 616-617, 624-625 (desktop) -- change `dot={{ r: 4 }}` to `dot={{ r: 1.5 }}`, `activeDot={{ r: 3 }}`
- **Savings Balance chart**: Lines 241, 249 -- change `dot={{ fill: '...', r: 4 }}` to `dot={{ fill: '...', r: 1.5 }}`
- **Category line chart**: Lines 730, 879 -- change `dot={{ r: 4 }}` to `dot={{ r: 1.5 }}`, `activeDot={{ r: 3 }}`

### Change 4: Move period filters below charts
Relocate `<DateFilter>` from the card header area to below the chart, centered, where the legend used to sit. This matches the Coinbase reference image where `1H 1D 1W 1M 1Y All` sits below the graph.

- **Balance chart (desktop)**: Move `<DateFilter>` from `CardHeader` (line 552-560) to after the `ResponsiveContainer` closing tag inside `CardContent`, wrapped in a centered `div` with `mt-4`
- **Balance chart (mobile)**: Move `<DateFilter>` from the header area (line 462-469) to after the chart `ResponsiveContainer`
- **Spending Trend**: Move `<DateFilter>` from the title area (lines 132-142 desktop, 146-156 mobile) to after the `ResponsiveContainer`
- **Spending by Category**: Move `<DateFilter>` from header area to below chart for both mobile (lines 663-671) and desktop (lines 808-817)
- **Savings Balance**: Move period buttons from `CardHeader` (lines 184-196) to below chart

### Change 5: Add period filter to Budget Allocation card
The Budget Allocation card (pie chart rendered by `BudgetBreakdown`) currently has no time filter. Add a `categoryAllocationFilter` state (default `"1M"`) and a `<DateFilter>` below the pie chart. Pass the selected filter to `BudgetBreakdown` so it filters transactions by the chosen period when generating the pie chart data.

- **FinancialInsightContent.tsx**: Add new state `categoryAllocationFilter` and `customAllocationRange`
- Pass `dateFilter` and `customDateRange` props to `BudgetBreakdown` when `showOnlyPieChart` is true
- Add `<DateFilter>` component below the pie chart content in `CardContent`
- **BudgetBreakdown.tsx**: Accept optional `dateFilter` and `customDateRange` props, and use them to filter `transactions` by date before generating the pie chart data (similar to how `getCategoryData` works in the parent)

### Technical Details

**Files to modify:**
1. `src/components/financial-insight/FinancialInsightContent.tsx` -- All 5 changes
2. `src/components/dashboard/EnhancedSpendingChart.tsx` -- Changes 1, 4
3. `src/components/goals/GoalsSavingsBalanceChart.tsx` -- Changes 1, 2, 3, 4
4. `src/components/financial-insight/BudgetBreakdown.tsx` -- Change 5 (accept filter props, filter transactions)

**Margin pattern for edge-to-edge (all charts):**
```tsx
// Before
<LineChart data={data} margin={{ bottom: 40 }}>
  <YAxis hide={false} ticks={ticks} width={70} ... />

// After  
<LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
  <YAxis hide={true} />
```

**DateFilter relocation pattern:**
```tsx
// Before (in CardHeader)
<CardHeader>
  <CardTitle>Balance</CardTitle>
  <DateFilter ... />
</CardHeader>
<CardContent>
  <ResponsiveContainer>...</ResponsiveContainer>
</CardContent>

// After (below chart)
<CardHeader>
  <CardTitle>Balance</CardTitle>
</CardHeader>
<CardContent className="px-0">
  <ResponsiveContainer>...</ResponsiveContainer>
  <div className="flex justify-center mt-4 px-6">
    <DateFilter ... />
  </div>
</CardContent>
```

