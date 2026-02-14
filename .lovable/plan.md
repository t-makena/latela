

## Reports Page — PDF Report and Spreadsheet Exports

### Overview
Add a dedicated **Reports** page (`/reports`) to the main navigation where users can download a full PDF financial report and export data as CSV, Excel, or Google Sheets.

### What You'll Get

**PDF Report** — A downloadable document containing:
- Financial Overview (Available Balance, Budget Balance, Flexible Balance, Budget Status)
- Budget Plan table with amounts and spending
- Savings Goals table with progress
- Savings Balance chart data summary
- Latela Score summary

**Spreadsheet Exports** (CSV / Excel / Google Sheets):
- Transactions — full history with date, merchant, category, amount, balance
- Budget Items — name, frequency, budgeted amount, amount spent
- Goals — name, allocation, saved, target, timeline, progress %

---

### Technical Plan

#### 1. New file: `src/lib/exportUtils.ts`

Utility functions for all export logic:
- **CSV generation**: Convert arrays of objects to CSV strings, trigger download
- **Excel generation**: Use the same CSV approach with `.xls` extension (no heavy library needed for basic tabular data) or optionally use a lightweight lib
- **Google Sheets**: Generate a Google Sheets URL that opens with pre-filled CSV data via the `gviz` import URL pattern
- **PDF generation**: Use the browser's `window.print()` with a styled print-friendly layout, or build a simple HTML-to-PDF approach using a hidden iframe

#### 2. New file: `src/pages/Reports.tsx`

The Reports page with two sections:

**Section A: Full PDF Report**
- A card with a "Download PDF Report" button
- Clicking it renders a print-friendly version of all financial data and triggers `window.print()` (saves as PDF)
- Includes: Financial Summary, Budget Plan table, Goals table, Latela Score

**Section B: Spreadsheet Exports**
- Three export cards, one for each dataset:
  - **Transactions** — with period filter (1M, 3M, 6M, 1Y, All)
  - **Budget Items** — current budget plan
  - **Goals** — all savings goals
- Each card has three buttons: CSV, Excel, Google Sheets

#### 3. New file: `src/components/reports/PrintableReport.tsx`

A hidden, print-optimized component that renders the full financial report:
- Uses `@media print` CSS for clean output
- Includes the Latela logo, date, user name
- Structured sections with tables and summary numbers
- Rendered in a hidden div, shown only when printing

#### 4. Update: `src/components/layout/Navbar.tsx`

Add a "Reports" nav item with a `FileText` icon between Goals and Calendar in the navigation.

#### 5. Update: `src/App.tsx`

Add the `/reports` route.

#### 6. Update: `src/index.css`

Add print-specific CSS rules (`@media print`) to hide the navbar, background, and other non-report elements during PDF export.

### Data Flow

- Transactions: fetched via `useTransactions()` hook (from `v_transactions_with_details` view)
- Budget Items: fetched via `useBudgetItems()` hook
- Goals: fetched via `useGoals()` hook
- Financial metrics: calculated via `calculateFinancialMetrics()` and account balances from `useAccounts()`
- Latela Score: from `useBudgetScore()` hook

All data stays client-side — no new edge functions or database changes needed.

### No Database Changes Required

All export logic runs in the browser using existing data from hooks. No new tables, migrations, or edge functions.

