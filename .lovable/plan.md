

## Fix: Account Insight Not Showing Data

### Problem
The "Account Insight" section shows all zeros because `calculateFinancialMetrics()` in `src/lib/realData.ts` filters transactions by `created_at` (the database insertion timestamp) instead of `transaction_date` (the actual transaction date). Since transactions were bulk-imported, their `created_at` dates don't match the current month, so the filter returns an empty array.

### Fix (single file: `src/lib/realData.ts`)

Two one-word changes:

| Line | Current | Fixed |
|------|---------|-------|
| 11 | `new Date(t.created_at)` | `new Date(t.transaction_date)` |
| 86 | `new Date(t.created_at)` | `new Date(t.transaction_date)` |

No other files need modification. All consumers of `calculateFinancialMetrics` already pass transactions with the `transaction_date` field populated from the Supabase view.

