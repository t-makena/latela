

## Cascade Delete All Data When an Account is Removed

### Problem
When an account is deleted in Settings, only transactions are removed. Budget scores associated with that account are left behind as orphaned records.

### Tables with `account_id`
| Table | Currently deleted? |
|-------|-------------------|
| `transactions` | Yes |
| `budget_scores` | No (set to NULL via FK, leaving orphaned rows) |
| `v_transactions_with_details` | View (auto-handled) |
| `v_daily_account_balances` | View (auto-handled) |

### Changes

**`src/pages/Settings.tsx` -- `handleRemoveAccount` function**

Add deletion of `budget_scores` before deleting transactions and the account:

```text
1. Delete budget_scores where account_id matches
2. Delete transactions where account_id matches (already exists)
3. Delete the account itself (already exists)
```

The order matters because budget_scores has a foreign key to accounts with `ON DELETE SET NULL`, so deleting explicitly first keeps things clean. Transactions have no FK constraint but are deleted first by convention.

### Technical Detail

Add one Supabase call before the existing transaction deletion:

```typescript
// Delete budget scores for this account
const { error: scoresError } = await supabase
  .from('budget_scores')
  .delete()
  .eq('account_id', accountId);
if (scoresError) throw scoresError;
```

No database migration needed -- this is purely a frontend code change to ensure all related data is cleaned up.
