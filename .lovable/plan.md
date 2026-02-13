

## Fix Balance Chart Tooltip Duplicates and Add High/Low Labels

### Problem 1: Duplicate tooltip entries
The `<Area>` components for `netBalance` and `budgetBalance` use the same `dataKey` as their corresponding `<Line>` components. Recharts includes all series in the tooltip by default, so each data key appears twice (once for Area, once for Line).

**Fix**: Add `tooltipType="none"` to all four `<Area>` components (mobile and desktop) so they are excluded from the tooltip.

### Problem 2: Highest and lowest amounts missing values
The current implementation only shows a `<ReferenceDot>` for the highest `netBalance` point but no label for the lowest, and no labels for the savings line.

**Fix**: Add `<ReferenceDot>` labels for:
- Highest Available Balance value
- Lowest Available Balance value (when different from highest)

Each label shows the formatted currency amount (e.g., "R5,000.00") positioned above for max and below for min.

### File: `src/components/financial-insight/FinancialInsightContent.tsx`

#### Changes (applied to both mobile and desktop chart blocks):

1. **Area components** (lines 535-536, 632-633): Add `tooltipType="none"` prop
   ```tsx
   <Area type="monotone" dataKey="netBalance" fill="url(#fillAvailable...)" stroke="none" tooltipType="none" />
   <Area type="monotone" dataKey="budgetBalance" fill="url(#fillSavings...)" stroke="none" tooltipType="none" />
   ```

2. **ReferenceDot for min point**: Add a second ReferenceDot for the lowest `netBalance` value, with the label positioned below the point
   ```tsx
   // Compute min point alongside max point
   const minPoint = netBalanceData.reduce((min, d) => 
     d.netBalance < min.value ? { month: d.month, value: d.netBalance } : min, 
     { month: netBalanceData[0]?.month, value: netBalanceData[0]?.netBalance ?? Infinity });
   ```

### Summary of edits

| Location | Change |
|---|---|
| Mobile Area (line 535-536) | Add `tooltipType="none"` |
| Desktop Area (line 632-633) | Add `tooltipType="none"` |
| Mobile ReferenceDot block (525-534) | Add min point ReferenceDot with label below |
| Desktop ReferenceDot block (622-631) | Add min point ReferenceDot with label below |
