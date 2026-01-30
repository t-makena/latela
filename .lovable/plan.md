
## Fix Transaction History Amount Display

### Problem
Transaction amounts in Transaction History are showing values that are 100x too large. For example, a R20.00 transaction shows as R2000.00.

### Root Cause
The TransactionHistory component fetches directly from the `v_transactions_with_details` view without converting cents to Rands, while amounts are stored in cents in the database.

**Data flow:**
1. Statement upload correctly stores amounts in cents (×100)
2. TransactionHistory fetches raw cents from database
3. TransactionHistory displays raw cents without dividing by 100

**Evidence from database:**
| Database Amount | Actual Value | Displayed As |
|-----------------|--------------|--------------|
| -2000 cents | -R20.00 | -R2000.00 (wrong) |
| 180000 cents | R1800.00 | R180000.00 (wrong) |

### Solution
Add cent-to-Rand conversion when setting transactions in TransactionHistory component.

---

### Technical Changes

**File: `src/components/financial-insight/TransactionHistory.tsx`**

**Location: Lines 155-156** (after fetching transactions)

**Current code:**
```typescript
if (transactionsData) {
  setTransactions(transactionsData as any);
```

**New code:**
```typescript
if (transactionsData) {
  // Convert amounts from cents to Rands for display
  const convertedTransactions = (transactionsData as any[]).map(t => ({
    ...t,
    amount: (t.amount ?? 0) / 100,
    balance: t.balance != null ? t.balance / 100 : t.balance,
  }));
  setTransactions(convertedTransactions);
```

---

### Why This Fix Works
- Matches the conversion logic already used in `useTransactions` hook (line 67)
- Follows the established pattern documented in memory: "useTransactions hooks fetch data in cents and divide by 100 for Rand display"
- Keeps display formatting unchanged (line 387 already formats correctly assuming Rands)

---

### Files Modified

| File | Change |
|------|--------|
| `src/components/financial-insight/TransactionHistory.tsx` | Add cents→Rands conversion after fetching transactions |
