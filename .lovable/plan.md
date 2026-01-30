
## Fix Account Balance Discrepancy

### Problem Summary
The app displays **R23,089.76** as the Available Balance, but the bank statement shows **R15,951.28**. This is a ~R7,138 discrepancy (45% error).

### Root Cause Analysis

**Data flow investigation:**

| Step | Value | Status |
|------|-------|--------|
| Statement's Available Balance | R15,951.28 | Source of truth |
| parse-statement extracted balance | R23,089.76 | Incorrect extraction |
| accounts.current_balance (DB) | 2,308,976 cents | Matches wrong extraction |
| Latest transaction.balance (DB) | 1,595,128 cents | Correct (R15,951.28) |
| App displays | R23,089.76 | Shows incorrect value |

**The bug is in the `parse-statement` edge function's balance extraction logic.** The regex patterns matched a different balance figure on the Standard Bank statement (likely an opening balance, credit limit, or intermediate running balance) instead of the correct closing/available balance.

### Evidence from Database

```text
Account current_balance:     2,308,976 cents = R23,089.76 (WRONG)
Last transaction balance:    1,595,128 cents = R15,951.28 (CORRECT)
```

The transaction-level balances are correct, proving the statement was parsed correctly for transactions, but the account-level balance was extracted from the wrong location in the PDF.

---

### Solution

Modify the `parse-statement` function to use the **last transaction's balance** as the account's `current_balance`, rather than relying on regex extraction from the PDF text. This approach is more reliable because:

1. Transaction balances are already being extracted correctly
2. The closing balance equals the balance after the final transaction
3. Eliminates dependency on variable PDF layouts across banks

---

### Technical Changes

#### File: `supabase/functions/parse-statement/index.ts`

**Location: ~Lines 350-368** (in `parsePDF` function return)

**Current logic:**
- Uses `currentBalance` from regex extraction (error-prone)
- Different patterns for different banks, but still unreliable

**New logic:**
- After extracting transactions, use the balance from the most recent transaction
- Fall back to regex-extracted balance only if no transactions have balance data

**Implementation approach:**

```text
After line 342 (after transactions are extracted):

// Use the latest transaction's balance as the current balance if available
let finalBalance = currentBalance;
if (transactions.length > 0) {
  // Find the latest transaction with a valid balance
  const transactionsWithBalance = transactions.filter(t => t.balance > 0);
  if (transactionsWithBalance.length > 0) {
    // Get the balance from the most recent transaction (first in array, sorted by date desc)
    finalBalance = transactionsWithBalance[0].balance;
    console.log('[BALANCE] Using latest transaction balance:', finalBalance);
  }
}

// Use finalBalance instead of currentBalance in the return object
```

**Key change in return statement:**
- Replace `currentBalance` with `finalBalance` in `accountInfo.currentBalance`

---

### Why This Fix Works

1. **Transaction balances are already correct** - The DB shows the latest transaction balance is R15,951.28, exactly matching the statement
2. **More reliable than regex** - Transaction balance extraction is structured and consistent
3. **Bank-agnostic** - Works across all bank formats without needing bank-specific patterns
4. **Fallback preserved** - If no transaction balances exist, regex extraction is still used

---

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/parse-statement/index.ts` | Use latest transaction balance as account current_balance |

---

### Immediate Fix for Current Data

The user's existing account has the wrong balance. After deploying the fix, they can either:
1. **Re-upload the statement** (will recreate account with correct balance)
2. **Manual database update** (run SQL to fix existing data):

```sql
UPDATE accounts 
SET current_balance = 1595128 
WHERE id = '432448ab-06a2-488d-9926-b2156f3a9d14';
```

---

### Testing

After implementation:
1. Upload the same bank statement again
2. Verify the new account shows R15,951.28 as Available Balance
3. Confirm this matches the statement's closing balance
