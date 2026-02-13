

## Fix Balance Chart Tooltip Labels

### Problem
The tooltip in the Balance chart shows "Saving's Balance" for both lines. The black line (Available Balance, R18975.80) is mislabeled because of a string comparison bug in the tooltip formatter.

### Root Cause
In `src/components/financial-insight/FinancialInsightContent.tsx`, the tooltip `formatter` function checks:
```
name === 'netBalance' ? 'Available Balance' : "Saving's Balance"
```
But the `name` parameter receives the Line component's `name` prop (e.g., `"Available Balance"`), not the `dataKey`. Since `"Available Balance" !== "netBalance"`, both entries fall through to `"Saving's Balance"`.

### Fix
Update the formatter condition on both mobile and desktop to match the actual `name` value:

**Line 524 (mobile):**
Change `name === 'netBalance'` to `name === 'Available Balance'`

**Line 633 (desktop):**
Change `name === 'netBalance'` to `name === 'Available Balance'`

This is a two-line fix in one file: `src/components/financial-insight/FinancialInsightContent.tsx`.
