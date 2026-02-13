

## Change "Budget Insight" to "Account Insight" on Accounts Page

### What Changes

The heading "Budget Insight" will become "Account Insight" on the Accounts page (both mobile and desktop), while remaining "Budget Insight" on the Dashboard.

### Approach

Add a new translation key `finance.accountInsight` ("Account Insight") to all locale files. Then pass the title as a prop or use context to differentiate:

**1. All locale files (en.json, af.json, zu.json, etc.)** -- Add new key

Add `"accountInsight": "Account Insight"` (and translated equivalents) under the `finance` section of each locale file.

**2. `src/components/financial-insight/BudgetBreakdown.tsx`** -- Accept optional `titleKey` prop

Add an optional `titleKey?: string` prop (defaulting to `'finance.budgetInsight'`). Use it in the h3 heading instead of the hardcoded `t('finance.budgetInsight')`.

**3. `src/components/financial-insight/FinancialInsightContent.tsx`** -- Pass `titleKey`

When rendering `BudgetBreakdown`, pass `titleKey="finance.accountInsight"` since this component is only used on the Accounts page.

**4. `src/components/accounts/MobileBudgetInsightCard.tsx`** -- Use new key

Change the h2 from `t('finance.budgetInsight')` to `t('finance.accountInsight')`.

### Dashboard remains unchanged

- The Dashboard's mobile view uses `MobileBudgetInsightCard` directly -- this will also need to stay as "Budget Insight" there. To handle this, `MobileBudgetInsightCard` will accept an optional `titleKey` prop defaulting to `'finance.budgetInsight'`, and the Accounts page will pass `titleKey="finance.accountInsight"`.
- The Dashboard desktop view does not use BudgetBreakdown, so no changes needed there.

### Technical Summary

| File | Change |
|------|--------|
| All 11 locale JSON files | Add `finance.accountInsight` key |
| `BudgetBreakdown.tsx` | Add optional `titleKey` prop, default `'finance.budgetInsight'` |
| `FinancialInsightContent.tsx` | Pass `titleKey="finance.accountInsight"` to BudgetBreakdown |
| `MobileBudgetInsightCard.tsx` | Add optional `titleKey` prop, default `'finance.budgetInsight'` |
| `Accounts.tsx` (mobile) | Pass `titleKey="finance.accountInsight"` to MobileBudgetInsightCard |

No database or dependency changes needed.
