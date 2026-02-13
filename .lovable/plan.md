

## Accounts Page Graphs Not Fetching Historic Data

### Root Cause

Every graph on the Accounts page calls `useTransactions()` with **no arguments**, which defaults to `currentMonthOnly: true`. This means only the current month's transactions are fetched from the database, so when you select 3M, 6M, or 1Y filters, there is simply no data to display.

**Affected components (all fetching current-month-only data):**

| Component | Location | Issue |
|-----------|----------|-------|
| `FinancialInsightContent` | Line 36 | `useTransactions()` -- defaults to current month |
| `EnhancedSpendingChart` | Line 47 | `useTransactions()` -- defaults to current month |

This cascades to **all 4 graph cards** on the Accounts page:
1. **Budget Insight** -- comparison periods (3M, 6M, 1Y) have no data
2. **Budget Allocation** -- pie chart shows nothing for longer periods
3. **Balance** -- flat/zero lines for 3M, 6M, 1Y
4. **Spending Trend** -- empty bars for historical periods
5. **Spending by Category** -- zero amounts for historical periods

### Fix

**File: `src/components/financial-insight/FinancialInsightContent.tsx`** (line 36)

Change:
```typescript
const { transactions: allTransactions, loading } = useTransactions();
```
To:
```typescript
const { transactions: allTransactions, loading } = useTransactions({ currentMonthOnly: false, limit: 2000 });
```

**File: `src/components/dashboard/EnhancedSpendingChart.tsx`** (line 47)

Change:
```typescript
const { transactions: allTransactions } = useTransactions();
```
To:
```typescript
const { transactions: allTransactions } = useTransactions({ currentMonthOnly: false, limit: 2000 });
```

### Why `limit: 2000`

The default limit is 500 rows. For a 1-year view, a user might have 30+ transactions per month across multiple accounts, easily exceeding 500. A limit of 2000 covers roughly 1 year of dense transaction history without overloading the query. The Supabase hard cap is 1000 rows per query by default, so the limit may also need a server-side adjustment if transactions exceed 1000 -- but 2000 as a client-side request will return up to whatever the server allows.

### Summary

Two one-line changes. Both components need `{ currentMonthOnly: false, limit: 2000 }` passed to `useTransactions()` so the date filters on the Accounts page actually have historical data to work with.
