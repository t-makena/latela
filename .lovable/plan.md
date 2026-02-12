

# Fix: Savings Balance Using Wrong Available Balance Source

## Problem
The Savings Balance chart and status section is calculating "Available Balance" from transaction net totals (`calculateFinancialMetrics(transactions).netBalance`) instead of using the actual sum of account balances. This is a recurring regression.

## Root Cause
In `src/hooks/useSavingsAdjustment.ts` (line 68):
```typescript
const { netBalance } = calculateFinancialMetrics(transactions);
```
This derives the balance from transaction math, which is inaccurate. The correct source is the sum of `accounts.current_balance` via the `useAccounts` hook.

## Fix

**File: `src/hooks/useSavingsAdjustment.ts`**

1. Import `useAccounts` instead of relying on `useTransactions` for balance
2. Replace the `netBalance` calculation with the sum of actual account balances:

```typescript
// Before:
const { transactions } = useTransactions();
const { netBalance } = calculateFinancialMetrics(transactions);
const availableBalance = netBalance;

// After:
const { accounts } = useAccounts();
const availableBalance = useMemo(() => {
  return accounts.reduce((sum, account) => sum + account.balance, 0);
}, [accounts]);
```

3. Remove the now-unused `useTransactions` import and `calculateFinancialMetrics` import (if no longer needed elsewhere in the hook)

## Technical Details
- The `useAccounts` hook already converts `current_balance` from cents to Rands (line 34 of `useAccounts.ts`)
- This aligns with the established data model: Available Balance = sum of `accounts.current_balance`
- The `generateChartData` function in the same hook also uses `availableBalance` and will automatically use the corrected value

