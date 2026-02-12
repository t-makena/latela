

# Add Legend to Balance Chart and Fix Vertical Positioning

## 1. Balance chart legend

Add a `<Legend />` component to both mobile and desktop Balance `<LineChart>` instances in `FinancialInsightContent.tsx`, matching the Savings Balance chart pattern. The two `<Line>` components already have distinct colors but no `name` prop -- add human-readable names:

- `netBalance` line: `name="Available Balance"`
- `budgetBalance` line: `name="Savings Balance"`

Then add `<Legend />` inside each `<LineChart>`.

## 2. Push charts lower in the card (vertical positioning)

Currently the `<LineChart>` components use `margin={{ left: 0, right: 0 }}` which centers the chart vertically. To push the chart area down (so lines sit roughly a quarter above the card bottom), add a large `top` margin and a `bottom` margin for legend space:

**Balance chart** (both mobile and desktop instances):
- Change `margin` to `{{ top: 40, left: 0, right: 0, bottom: 30 }}`

**Spending Trend chart** (`EnhancedSpendingChart.tsx`, both BarChart and LineChart):
- Change `margin` to `{{ top: 40, left: 0, right: 0, bottom: 0 }}`

This shifts the actual plot area downward within the fixed-height `ResponsiveContainer`, placing the lines/bars in the lower portion of the card.

## Technical Details

### Files to edit

1. **`src/components/financial-insight/FinancialInsightContent.tsx`**
   - Mobile Balance chart (~line 480): Add `<Legend />` import from recharts, add `name` props to both `<Line>` components, insert `<Legend />`, update `margin` to `{ top: 40, left: 0, right: 0, bottom: 30 }`
   - Desktop Balance chart (~line 567): Same changes

2. **`src/components/dashboard/EnhancedSpendingChart.tsx`**
   - BarChart (~line 161): Update `margin` to `{ top: 40, left: 0, right: 0, bottom: 0 }`
   - LineChart fallback (further down): Same margin update

### Legend import
`Legend` from `recharts` -- check if already imported in `FinancialInsightContent.tsx`; if not, add it to the existing recharts import.

