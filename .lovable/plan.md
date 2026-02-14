

## Enhanced PDF Report — Include All Charts and Tables

### Overview
Expand the `PrintableReport` component to include **all** the charts and tables currently shown across the app, so the PDF is a comprehensive financial snapshot.

### What Will Be Added to the PDF

The report will include these new sections (in addition to existing Financial Overview, Budget Plan table, Goals table, and Latela Score):

1. **Spending Trend Chart** — A bar chart showing spending by category over the past month (reuses the same data logic as `EnhancedSpendingChart`)
2. **Balance Chart** — A line chart showing Available Balance and Savings Balance over 1 year (reuses the same data logic as `FinancialInsightContent.getNetBalanceData()`)
3. **Budget Allocation Pie Chart** — Category breakdown pie chart with a table showing category, amount, and percentage (reuses logic from `BudgetBreakdown`)
4. **Savings Balance Chart** — Expected vs actual savings balance projection (reuses logic from `GoalsSavingsBalanceChart`)
5. **Transaction History Table** — Full list of recent transactions with date, description, category, amount, and balance
6. **Budget Insight Table** — The comparison table showing Available Balance, Budget Balance, and Spending with month-over-month percentage changes

### Technical Plan

#### File 1: `src/components/reports/PrintableReport.tsx` (major rewrite)

- Add new props for the additional data:
  - `transactions` — array of transaction records for the transaction table and chart data generation
  - `categoryBreakdown` — pre-computed array of `{ name, value, color }` for the pie chart
  - `spendingChartData` — pre-computed array for the spending bar chart
  - `balanceChartData` — pre-computed array of `{ month, netBalance, budgetBalance }` for the balance line chart
  - `savingsChartData` — pre-computed array of `{ month, expected, savings }` for the savings projection chart
  - `budgetInsight` — object with current/previous metrics and percentage changes

- Render Recharts charts directly (SVG-based, prints natively):
  - Use `<BarChart>` for spending trend (static, no tooltips/interactions)
  - Use `<LineChart>` for balance and savings charts
  - Use `<PieChart>` for budget allocation
  - Set explicit `width` and `height` on charts instead of `ResponsiveContainer` (which doesn't work well in print) — use a wrapper `<div>` with fixed dimensions

- Add a transaction history table (last 50 transactions) with columns: Date, Description, Category, Amount, Balance

- Use print-friendly colors (dark strokes on white background)

#### File 2: `src/pages/Reports.tsx` (update)

- Compute the additional data needed for the new props:
  - Generate `categoryBreakdown` from transactions (same logic as `BudgetBreakdown.getSimpleCategoryData()`)
  - Generate `spendingChartData` using `generateChartDataFromTransactions()` from `chartDataUtils`
  - Generate `balanceChartData` using the same logic as `getNetBalanceData()` from `FinancialInsightContent`
  - Generate `savingsChartData` from goals data
  - Compute `budgetInsight` metrics with percentage changes
- Pass all new data as props to `PrintableReport`

#### File 3: `src/index.css` (minor update)

- Ensure SVG elements render properly in print by adding:
  ```css
  @media print {
    svg { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
  ```

### Key Considerations

- **Recharts in print**: Recharts renders SVG which prints natively. The main gotcha is `ResponsiveContainer` — it relies on parent element dimensions which can be 0 in hidden elements. The fix is to use a visible-during-print wrapper with explicit dimensions, or render charts with fixed `width`/`height` props directly on the chart components.
- **Page breaks**: CSS `break-before: page` will be added between major sections so the PDF has clean page boundaries.
- **Colors**: Charts will use the same category colors as the app but with `print-color-adjust: exact` to preserve colors in print.
- **Data computation**: All chart data is computed client-side in `Reports.tsx` using the same utility functions and hooks already used by the app's interactive charts — no new data fetching needed.

