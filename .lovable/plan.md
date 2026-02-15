

## Fix Accounts Page Structure: All Accounts vs Individual Account

### Current Problems

1. **`/accounts` (All Accounts) on mobile** only shows the first account card -- it should show ALL account cards
2. **Title labels are swapped**: "All Accounts" shows "Account Insight" but should show "Budget Insight"; individual accounts show "Budget Insight" (default) but should show "Account Insight"
3. **No account-specific filtering on mobile**: The `MobileBudgetInsightCard` doesn't filter transactions by account, so individual account pages show the same data as the consolidated view

### Planned Changes

**1. `src/pages/Accounts.tsx` (All Accounts page - mobile)**
- Show ALL account cards (loop through `accounts` array) instead of just `accounts[0]`
- Change the insight card title to use the default `titleKey` ("Budget Insight") instead of overriding it to "Account Insight"

**2. `src/pages/AccountDetail.tsx` (Individual account page - mobile)**
- Pass `titleKey="finance.accountInsight"` to `MobileBudgetInsightCard` so it says "Account Insight"
- Pass the `accountId` to `MobileBudgetInsightCard` so its calculations are scoped to that specific account

**3. `src/components/accounts/MobileBudgetInsightCard.tsx`**
- Add an optional `accountId` prop
- When `accountId` is provided, filter transactions to only that account before computing metrics
- This ensures each individual account page shows account-specific percentage changes, not consolidated figures

### Summary

| Page | Account Cards | Insight Title | Data Scope |
|------|--------------|---------------|------------|
| `/accounts` (All) | All accounts | Budget Insight | All transactions |
| `/accounts/:id` (Single) | Single account | Account Insight | That account's transactions only |

### Technical Details

- `MobileBudgetInsightCard` gains an optional `accountId?: string` prop
- When set, transactions are filtered with `.filter(t => t.account_id === accountId)` before metric calculations
- Available balance also filters to only the matching account
- No database or routing changes needed
