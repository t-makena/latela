

## Update 1M Period to Show 30 Individual Days

### Overview
Change the 1M (one month) filter from displaying ~4 weekly buckets ("Jan W3", "Feb W1") to showing 30 individual daily data points, matching the same day-by-day format used by the 1W filter but over a longer range.

### Changes

#### 1. `src/lib/dateFilterUtils.ts` — Core date/label logic

- **`get1MDateRange()`**: Change from "past 4 weeks" to "past 30 days" using `subDays(today, 29)` (29 days ago + today = 30 days).
- **`get1MLabels()`**: Change from week labels ("Jan W3") to daily labels. Use a compact format like `"dd MMM"` (e.g., "15 Jan", "16 Jan") to fit 30 points on the x-axis.

#### 2. `src/components/financial-insight/FinancialInsightContent.tsx` — Balance and Category charts

- **`getNetBalanceData()`** (around lines 108-113 and 145-159): Replace the `1M` week-based grouping with day-based grouping (same logic as the `1W` branch but using the 30-day range).
- **`getCategoryLineData()`** (around lines 425-438): Replace the `1M` week-based grouping with day-based grouping.

#### 3. `src/components/dashboard/EnhancedSpendingChart.tsx` — Spending Trend chart

- **`getChartData()`** (line 73-74): Change `periodType` for 1M from `'week'` to `'day'`.
- **`getLineData()`** (lines 136-145): Replace the 1M week-based grouping with day-based grouping.

#### 4. `src/lib/chartDataUtils.ts` — Shared chart data generator

- Update the week-based logic branch (lines 92-97) so that when `periodType` is `'day'` with 30 labels, it correctly maps transactions to daily buckets (this should already work since the `'day'` branch handles this).

#### 5. `src/components/goals/GoalsSavingsBalanceChart.tsx` — Goals Savings chart

- **1M branch** (lines 55-91): Replace week-based data points with daily data points over 30 days. Each day shows the savings balance and expected balance using the same day-by-day logic.

#### 6. `src/pages/Reports.tsx` — PDF report

- The PDF report currently uses monthly aggregation for all charts. Update it so charts default to 1M (30-day) view with daily granularity, matching the in-app display.

### Technical Details

**New `get1MDateRange`:**
```
from = startOfDay(subDays(today, 29))
to = endOfDay(today)
```

**New `get1MLabels`:**
```
eachDayOfInterval -> format(day, "dd MMM")   // e.g. "15 Jan"
```

**X-axis readability**: With 30 labels, the x-axis will be dense. Labels will use a compact format and charts may show every 5th label using `interval={4}` on the XAxis component to avoid overlap.

### Scope
- 5 source files modified
- All in-app charts (Balance, Spending Trend, Category, Goals Savings) will show 30 daily data points for 1M
- PDF report charts will default to the same 30-day daily view

