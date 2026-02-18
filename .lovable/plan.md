
## Change "Budget Allocation" → "Overall Allocation" on the All Accounts Page

### Where the text lives

There are two separate places this label appears:

1. **`src/components/financial-insight/FinancialInsightContent.tsx` — line 487**
   This is a hardcoded `<CardTitle>` string that renders the section heading on the desktop All Accounts page. This is the one shown when you are on `/accounts`.

2. **`src/components/financial-insight/BudgetBreakdown.tsx` — line 416**
   This uses the i18n key `t('finance.budgetAllocation')` for the pie chart sub-heading inside the breakdown component itself.

3. **`src/locales/en.json` — line 69**
   The translation key `"budgetAllocation": "Budget Allocation"` (previously proposed to be changed to "Account Allocation" but not yet applied).

### Change Plan

#### File 1: `src/components/financial-insight/FinancialInsightContent.tsx` — line 487

Change the hardcoded `<CardTitle>`:

```
Before:  <CardTitle className="heading-main">Budget Allocation</CardTitle>
After:   <CardTitle className="heading-main">Overall Allocation</CardTitle>
```

#### File 2: `src/locales/en.json` — line 69

Update the translation key used by the pie chart sub-heading inside `BudgetBreakdown`:

```
Before:  "budgetAllocation": "Budget Allocation",
After:   "budgetAllocation": "Overall Allocation",
```

This ensures both the card title and the chart sub-heading on the All Accounts page consistently read "Overall Allocation".

### What this does NOT change
- The `PrintableReport.tsx` hardcoded "Budget Allocation" label (in reports) — left untouched as it's a separate context
- No database changes
- No logic changes, styling changes, or RLS changes
