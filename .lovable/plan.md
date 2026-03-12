

## Fix Statement Update for Existing Accounts

The `StatementUploadDialog` needs an "update mode" that detects existing accounts and merges new transactions instead of failing on duplicate insert.

### Changes

**`src/components/accounts/StatementUploadDialog.tsx`**:

1. Add an optional `accountId` prop to indicate update mode
2. Before inserting a new account, check if an account with the same `account_number` already exists for this user
3. If it exists:
   - Update the account's balance instead of inserting
   - Use the existing `account_id` for transaction import
   - Skip duplicate transactions by checking `transaction_date + description + amount` uniqueness
4. If it doesn't exist: proceed with current insert logic

**`src/components/financial-insight/FinancialInsightContent.tsx`** and **`src/components/accounts/MobileBudgetInsightCard.tsx`**:
- Pass `accountId` to `StatementUploadDialog` when triggered from the "Update" button so the dialog knows which account is being updated

### Technical Detail

The key change in `handleFile`:

```typescript
// After parsing, check for existing account
const { data: existingAccount } = await supabase
  .from('accounts')
  .select('id')
  .eq('account_number', data.accountInfo.accountNumber)
  .eq('user_id', userId)
  .maybeSingle();

if (existingAccount) {
  // Update balance on existing account
  await supabase.from('accounts')
    .update({ available_balance: Math.round(data.accountInfo.currentBalance * 100) })
    .eq('id', existingAccount.id);
  targetAccountId = existingAccount.id;
} else {
  // Insert new account (current logic)
}

// For transactions, use upsert or filter out duplicates before insert
```

For deduplication, filter out transactions that already exist by matching on `account_id + transaction_date + amount + description` before inserting.

