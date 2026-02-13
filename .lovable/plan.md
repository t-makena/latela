

## Align Zero Line to Bottom of Chart Area

### Problem
The green zero-value line floats above the bottom edge of the chart. The zero line should sit exactly at the bottom of the visible chart area across all line charts.

### Solution
Set `domain={[0, 'auto']}` on all hidden `YAxis` components so zero maps to the very bottom of the chart. Remove the current `-2` negative offset on the Savings Balance chart.

### Files to Change

**1. `src/components/goals/GoalsSavingsBalanceChart.tsx`**
- Change `domain={[-2, 'auto']}` to `domain={[0, 'auto']}`

**2. `src/components/financial-insight/FinancialInsightContent.tsx`**
- Add `domain={[0, 'auto']}` to all `<YAxis hide={true} />` instances (6 occurrences -- both line charts and bar charts)

**3. `src/components/dashboard/EnhancedSpendingChart.tsx`**
- Add `domain={[0, 'auto']}` to both `<YAxis hide={true} />` instances

**4. `src/components/dashboard/SavingsBalanceChart.tsx`**
- Add `domain={[0, 'auto']}` to its `<YAxis />` (this one has visible axes but same principle applies)

### Why This Works
By default, Recharts adds padding below zero on the Y-axis. Setting `domain={[0, 'auto']}` forces the axis to start exactly at zero, placing the zero-value data points flush with the bottom of the chart area.
