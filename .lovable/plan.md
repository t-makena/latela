

## Fix: Uncategorized Transactions Pile-Up

### Problem
125 out of 221 transactions are uncategorized, all on the same account. Two issues:

1. **Batch limit without re-invocation**: The edge function processes max 50 transactions per call and returns a `remaining` count, but the client (StatementUploadDialog) calls it only ONCE and ignores the `remaining` field. So if a statement has 175 transactions, only 50 get categorized.

2. **No manual re-categorize trigger**: There's no way to re-run categorization from the UI after the initial upload.

### Changes

**1. `src/components/accounts/StatementUploadDialog.tsx` -- Loop until all categorized**

After calling `categorize-transactions`, check `catData.remaining > 0` and re-invoke in a loop until all transactions are processed:

```
let remaining = Infinity;
while (remaining > 0) {
  const { data: catData, error: catError } = await supabase.functions.invoke(
    'categorize-transactions', { body: { accountId: accountData.id } }
  );
  if (catError || !catData?.success) break;
  remaining = catData.remaining || 0;
}
```

**2. `src/components/accounts/AccountDetail.tsx` -- Add "Re-categorize" button**

Add a button on the account detail page that lets users manually trigger categorization for accounts with uncategorized transactions. This calls the same loop logic above.

**3. `supabase/functions/categorize-transactions/index.ts` -- Expand smart rules**

Several of the 125 uncategorized transactions have clear patterns not yet covered:

| Pattern | Count | Should Be |
|---------|-------|-----------|
| "MONTHLY MANAGEMENT FEE" (no colon) | ~2 | Fees |
| "FEE - INSTANT MONEY" (dash not colon) | ~4 | Fees |
| "FEE-ELECTRONIC ACCOUNT PAYMENT" | ~2 | Fees |
| "CASH WITHDRAWAL AT" (no "FEE") | ~2 | Transport (ATM withdrawal) |
| "CELLPHONE INSTANTMON CASH TO" | ~4 | Transfers |
| "BETWAY" | ~4 | Entertainment |
| "MEATEXPRESS" | ~1 | Groceries/Dining (AI) |
| "PAYFLEX" | ~1 | Shopping (buy-now-pay-later) |
| "ATMNN..." / "ATM CASH WITHDRAWAL" | ~2 | Transfers |

Update `preCategorizeSmart` to catch:
- Fee variations: `MANAGEMENT FEE`, `FEE -`, `FEE-` (not just `FEE:`)
- ATM withdrawals: `CASH WITHDRAWAL`, `ATM` with negative amount
- Instant money: `INSTANTMON`, `INSTANT MONEY` = Transfers
- Betting: `BETWAY`, `HOLLYWOOD`, `SPORTINGBET` = Entertainment

### Summary
- The loop fix ensures ALL transactions get categorized regardless of statement size
- The re-categorize button lets users fix accounts that were partially processed
- Expanded smart rules reduce AI calls and prevent future miscategorization

