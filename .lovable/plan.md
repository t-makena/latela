
# Use Week-Based Labels for 1M Period in Balance and Savings Balance Cards

## What Changes

Both the **Balance** card (in `FinancialInsightContent.tsx`) and the **Savings Balance** card (in `GoalsSavingsBalanceChart.tsx`) currently use incorrect/inconsistent labeling for the 1M period. The Spending Trend chart already uses the `dateFilterUtils` helper which produces labels like "Jan W3", "Jan W4", "Feb W1" -- these two cards need to match that format.

### 1. Balance card (`FinancialInsightContent.tsx`)

**Current behavior**: 1M period uses static labels `"Week 1", "Week 2", "Week 3", "Week 4"` and groups transactions by `Math.ceil(date.getDate() / 7)`.

**New behavior**: Use `get1MDateRange()` and `get1MLabels()` from `dateFilterUtils` to generate calendar-anchored week labels (e.g., "Jan W3", "Jan W4", "Feb W1"). Group transactions into those actual calendar weeks using `eachWeekOfInterval`.

Changes in `getNetBalanceData()` function (around lines 71-139):
- Import and use `get1MDateRange()` to get the actual 4-week date range
- Replace the static `"Week 1"..."Week 4"` labels with dynamic labels from `get1MLabels()`
- Update the transaction grouping logic for `1M` to match transactions to actual calendar week intervals (same approach as `EnhancedSpendingChart`)

### 2. Savings Balance card (`GoalsSavingsBalanceChart.tsx`)

**Current behavior**: 1M period maps to `monthCount = 1`, generating just 1 data point (current month name).

**New behavior**: When `selectedPeriod === '1M'`, generate 4 weekly data points using `eachWeekOfInterval` from `date-fns` and label them "Jan W3", "Jan W4", etc. -- matching the Spending Trend format.

Changes in `chartData` useMemo (around lines 43-100):
- Add a special branch for `'1M'` that generates weekly data points instead of monthly
- Use `get1MDateRange()` from `dateFilterUtils` to get the 4-week window
- Use `eachWeekOfInterval` to iterate over each week
- Label each week as `"MMM W{n}"` (e.g., "Feb W1") matching the existing `get1MLabels()` format
- For each week, calculate the expected and savings values using the same logic but scoped to that week's date range

## Technical Details

### Files to edit:
1. **`src/components/financial-insight/FinancialInsightContent.tsx`** -- Update `getNetBalanceData()` to use calendar-anchored week labels for 1M
2. **`src/components/goals/GoalsSavingsBalanceChart.tsx`** -- Update `chartData` useMemo to generate weekly data points for 1M

### New imports needed:
- Both files: `import { get1MDateRange, get1MLabels } from "@/lib/dateFilterUtils"` (or use inline `eachWeekOfInterval` + `format` from `date-fns`)
- The `dateFilterUtils` already has `get1MLabels` which produces the correct format

### No new dependencies required.
