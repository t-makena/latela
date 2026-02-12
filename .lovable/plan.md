
# Simplify Savings Balance Card Layout

## What Changes

1. **Remove the "Savings Status" section** (lines 228-305) -- the block showing Expected Balance, Available Balance, and shortfall values. Only the **alert system** (shortfall detection + adjustment preview + apply button) remains, triggered when `savingsStatus.hasShortfall` is true.

2. **Keep the Legend** below the chart (already present via `<Legend />`).

3. **Remove X and Y axes** from the chart -- hide the axis lines, ticks, and labels by setting `hide={true}` on both `<XAxis>` and `<YAxis>`.

4. **Show highest and lowest amounts on Y axis area** -- instead of full axis ticks, display only the max and min values from the dataset as reference labels using `<ReferenceLine>` or custom Y-axis ticks limited to just two values.

5. **Tooltip shows amount and date on hover** -- already works via `<Tooltip>`, just ensure it displays clearly with the month label and formatted currency.

## Technical Details

### File: `src/components/goals/GoalsSavingsBalanceChart.tsx`

**Chart axis changes:**
- `<XAxis>`: add `hide={true}` to remove the x-axis entirely (dates shown on hover via tooltip)
- `<YAxis>`: replace full tick marks with only two ticks showing the min and max values from the data. Use `ticks={[minValue, maxValue]}` and keep `axisLine={false}`, `tickLine={false}` for a clean look
- Compute `minValue` and `maxValue` from chartData across both `expected` and `savings` fields
- Remove `<CartesianGrid>` for a cleaner minimal look (or keep very subtle)

**Remove Savings Status section:**
- Delete the entire `<div className="border-t pt-4">` block (lines 229-305)
- Re-add only the shortfall alert portion: the strategy info, adjustment preview, and apply button -- wrapped in a conditional `{savingsStatus.hasShortfall && (...)}` block
- This means when there's no shortfall, the card just shows the chart + legend
- When there IS a shortfall, the card expands to show the alert with adjustments

**Structure after changes:**
```
+----------------------------------+
| Savings Balance    [1M 3M 6M 1Y] |
|                                  |
| R15k               (max label)  |
|    ~~~chart lines~~~             |
| R0                  (min label)  |
|                                  |
| [Legend: Expected | Saved]       |
|                                  |
| (only if shortfall:)            |
| Strategy: Prioritize important  |
| [Adjustment Preview items]      |
| [Apply Adjustments button]      |
+----------------------------------+
```

Single file edit, no new dependencies.
