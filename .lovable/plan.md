

## Fix Available Balance Using Wrong Column

### Problem
The `useAccounts` hook reads `current_balance` from the database and displays it as the "Available Balance" everywhere. For your Standard Bank credit account:
- `current_balance` = -R20,039.91 (amount owed -- negative)
- `available_balance` = R1,507.79 (actual available credit)

The app shows -R20,039.91 as your available balance, which is incorrect.

### Root Cause
In `src/hooks/useAccounts.ts`, line 27:
```
balance: (account.current_balance || 0) / 100
```
This should use `available_balance` instead, since that column represents what the user actually has available to spend.

### Fix

**File: `src/hooks/useAccounts.ts`**
- Change line 27 from `account.current_balance` to `account.available_balance`
- This single change cascades correctly through all components that consume `useAccounts` (FinancialSummary, AvailableBalanceCard, MobileBudgetInsightCard, MobileAccountCard, etc.)

### Technical Detail

| Field | Value (cents) | Value (Rands) | Meaning |
|-------|--------------|---------------|---------|
| `current_balance` | -2,003,991 | -R20,039.91 | Total balance on account (debt for credit cards) |
| `available_balance` | 150,779 | R1,507.79 | What the user can actually spend |

One line change in `useAccounts.ts`:
```
// Before
balance: (account.current_balance || 0) / 100

// After
balance: (account.available_balance || 0) / 100
```

