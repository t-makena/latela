

## Convert "Spending by Category" to Line Graph View

### Overview
Add a toggle to switch the "Spending by Category" chart between the existing bar chart and a new line graph view. The line graph shows total spending over time (like the Balance chart) with a gradient area fill below. The line and fill color dynamically match the category with the highest total spending in the selected filter period.

### How It Works
- A new toggle button ("Bar" / "Line") appears next to the chart title
- When "Line" is selected, the chart renders a `ComposedChart` with `Area` + `Line` (same pattern as the Balance chart)
- The dominant category color is determined by finding which category has the highest total in `categoryData`
- The gradient fill uses that color at 0.3 opacity fading to 0.05
- High/low ReferenceDot labels are shown (matching the Balance chart style)
- Double-click drill-down into a single category still works from bar view

### File: `src/components/financial-insight/FinancialInsightContent.tsx`

#### 1. New state variable (~line 53)
```tsx
const [categoryChartMode, setCategoryChartMode] = useState<'bar' | 'line'>('bar');
```

#### 2. New function: generate total spending time-series data (~line 389)
Reuse the same logic as `getCategoryLineData()` but without filtering to a single category -- aggregate ALL expense transactions into period buckets.

#### 3. Determine dominant category color
```tsx
const dominantCategory = categoryData.reduce((max, d) => 
  d.amount > max.amount ? d : max, categoryData[0]);
const dominantColor = dominantCategory?.color || '#1e65ff';
```

#### 4. Update chart rendering (both mobile ~line 734 and desktop ~line 864)
When `categoryChartMode === 'line'` and no `selectedCategoryForGraph`:
- Render a `ComposedChart` with:
  - `defs` for a `linearGradient` using `dominantColor`
  - `Area` with `fill="url(#gradientId)"`, `stroke="none"`, `tooltipType="none"`
  - `Line` with `stroke={dominantColor}`, `strokeWidth={2}`, `dot={false}`
  - `ReferenceDot` for max and min points with currency labels
  - Hidden axes, matching the Balance chart aesthetic

#### 5. Add toggle button in the header
Next to the title "Spending by Category", add a small segmented toggle:
```tsx
<div className="flex gap-1">
  <Button variant={categoryChartMode === 'bar' ? 'default' : 'outline'} size="sm" 
    onClick={() => setCategoryChartMode('bar')}>Bar</Button>
  <Button variant={categoryChartMode === 'line' ? 'default' : 'outline'} size="sm" 
    onClick={() => setCategoryChartMode('line')}>Line</Button>
</div>
```

### Summary of Changes

| Location | Change |
|---|---|
| Line ~53 | Add `categoryChartMode` state |
| Line ~389 | Add `getTotalSpendingLineData()` function |
| Line ~292 | Compute `dominantColor` from `categoryData` |
| Lines 710-731 (mobile header) | Add Bar/Line toggle buttons |
| Lines 734-813 (mobile chart) | Add line chart branch when `categoryChartMode === 'line'` |
| Lines 843-861 (desktop header) | Add Bar/Line toggle buttons |
| Lines 864-943 (desktop chart) | Add line chart branch when `categoryChartMode === 'line'` |

Only one file is modified: `src/components/financial-insight/FinancialInsightContent.tsx`

