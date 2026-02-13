

## Chart Visual Improvements

Three changes across all line charts (Balance, Savings Balance, Spending Trend, and Spending by Category line view):

### 1. Graph padding at p-6 (24px) on left and right edges

Currently charts use `margin={{ ... right: 0, left: 0 ... }}`. Update all chart margins to `right: 24, left: 24` so the graph lines start and end with 24px (p-6) inset from the card edges.

### 2. Remove dots from line graphs

Currently all `<Line>` components have `dot={{ fill: '...', r: 1.5 }}`. Change to `dot={false}` on all Line components, keeping only `activeDot={{ r: 3 }}` for hover interaction.

### 3. Show highest value label on the chart

Add a Recharts `<ReferenceDot>` at the data point with the highest value, displaying a formatted currency label (e.g., "R5,000.00") positioned above or to the side of the point, similar to the Coinbase/Zcash style in the reference image. Each chart will compute its max data point and render the label.

### Files to Change

**`src/components/financial-insight/FinancialInsightContent.tsx`**

Balance chart (mobile, lines 484-529):
- Margin: `left: 0, right: 0` to `left: 24, right: 24`
- Two `<Line>` components: change `dot={{ fill: '...', r: 1.5 }}` to `dot={false}`
- Add `<ReferenceDot>` at the highest `netBalance` point with a currency label

Balance chart (desktop, lines 559-604):
- Same three changes as mobile

Spending by Category line view (mobile, line 665):
- Margin: `left: 0, right: 0` to `left: 24, right: 24`
- Line dot to `dot={false}`
- Add `<ReferenceDot>` at max `amount`

Spending by Category line view (desktop, line 785):
- Same three changes

Bar charts (lines 700, 820, and EnhancedSpendingChart line 135): Only apply margin changes (left/right: 24). No dot or label changes for bar charts.

**`src/components/dashboard/EnhancedSpendingChart.tsx`**

- BarChart margin (line 135): `left: 0, right: 0` to `left: 24, right: 24`
- LineChart fallback (line 416): same margin change, remove default dots, add `<ReferenceDot>` at max

**`src/components/goals/GoalsSavingsBalanceChart.tsx`**

- Margin (line 193): `left: 0, right: 0` to `left: 24, right: 24`
- Both `<Line>` components (lines 215, 224): `dot` to `false`
- Add `<ReferenceDot>` at the highest `savings` value with currency label

### Technical Detail: ReferenceDot Implementation

Import `ReferenceDot` from `recharts`. For each line chart, compute the max data point:

```typescript
const maxPoint = chartData.reduce((max, d) => d.netBalance > max.value 
  ? { month: d.month, value: d.netBalance } : max, 
  { month: '', value: 0 });
```

Then render inside the `<LineChart>`:
```tsx
<ReferenceDot
  x={maxPoint.month}
  y={maxPoint.value}
  r={0}
  label={{
    value: formatCurrency(maxPoint.value),
    position: 'top',
    style: { fontSize: '11px', fontWeight: 600, fill: 'hsl(var(--foreground))' }
  }}
/>
```

The label will float above the highest point, matching the Zcash-style reference image. If the max point is near the right edge, position will adjust to `'left'`; if near the left edge, `'right'`.

