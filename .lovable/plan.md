

## Accounts Page Desktop/Tablet Layout Changes

### Changes Overview

1. **Remove** the AccountCard (bank name + balance) and CompactRecentTransactions card from the desktop layout
2. **Add a "Current Amount" column** to the Budget Insight table so users can see actual figures alongside percentage changes

### File Changes

**1. `src/pages/Accounts.tsx`** -- Remove the top row grid

Remove the entire grid section (lines 78-92) containing `AccountCard` and `CompactRecentTransactions`. The desktop layout will start directly with `FinancialInsightContent`. Clean up unused imports (`AccountCard`, `CompactRecentTransactions`, `scrollToTransactions`, `currentAccountIndex` state, and the `currentAccount` variable used only in desktop).

**2. `src/components/financial-insight/BudgetBreakdown.tsx`** -- Add "Current Amount" column

In the `showOnlyTable` table (lines 341-399, the multi-period desktop table), add a new column header "Current Amount" after "Metric" and before "1 Mth". Each row gets a new cell showing the formatted Rand value:

| Metric | Current Amount | 1 Mth | 3 Mth | 6 Mth | 1 Yr |
|--------|---------------|-------|-------|-------|------|
| Available Balance | R12,500 | +5% | +8% | ... | ... |
| Budget Balance | R3,200 | +2% | ... | ... | ... |
| Spending | R8,400 | -3% | ... | ... | ... |

The current amount values (`availableBalance`, `budgetBalance`, `spending`) are already passed as props -- they just need to be displayed in the new column formatted as `R{amount.toLocaleString()}`.

Also add the same column to the `showOnlyOneMonth` table variant (lines 308-338) for consistency.

### Technical Details

**Accounts.tsx desktop return block** will simplify to:
```text
<div className="min-h-screen pt-6 px-6 pb-20">
  <div className="space-y-6">
    <FinancialInsightContent />
    <StatementUploadDialog ... />
  </div>
</div>
```

**BudgetBreakdown.tsx table** gets a new column after "Metric":
- Header: "Current Amount" (text-right aligned)
- Available Balance row: `R{availableBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
- Budget Balance row: `R{budgetBalance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
- Spending row: `R{spending.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`

No database changes or new dependencies required.
