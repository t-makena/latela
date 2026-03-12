

## Dynamic Stage Labels + Mismatched Account Detection

### Changes

**`src/components/accounts/StatementUploadDialog.tsx`**:

1. **Dynamic stage labels**: Make `PROCESSING_STAGES` and `getStageMessage` aware of whether we're in update mode (`accountId` is set). Change the third stage from static "Setting up account" / "Creating your account..." to "Updating account" / "Updating your account..." when `accountId` is provided.

2. **Mismatched account detection**: After parsing, if `accountId` is provided, fetch the current account's `account_number` from the DB. Compare it to the parsed statement's `accountNumber`. If they differ:
   - Show a warning toast: "This statement belongs to a different account. We've updated/created that account instead."
   - Proceed with the normal upsert flow (create or update the account matching the parsed statement's number)
   - The user is informed but the data is still processed correctly

### Technical approach

```typescript
// After parsing, before the upsert logic:
let mismatchDetected = false;
if (accountId) {
  const { data: currentAccount } = await supabase
    .from('accounts')
    .select('account_number')
    .eq('id', accountId)
    .single();
  
  if (currentAccount && currentAccount.account_number !== data.accountInfo.accountNumber) {
    mismatchDetected = true;
  }
}

// At the end, use mismatchDetected to show appropriate toast
```

For the stage labels, convert `PROCESSING_STAGES` to a function that takes `isUpdateMode: boolean` and returns the array with the appropriate third-step label.

