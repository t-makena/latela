

## Guard Latela Score and Budget Status Behind Account Existence

### Problem
When no accounts are linked, the budget score calculator still runs and produces misleading results (e.g. risk ratio of 999, "Critical" status) because all balances are zero. Users see a scary score and status before they have even added an account.

### Changes

**1. `src/lib/budgetScoreCalculator.ts`**
- At the top of `calculateBudgetScore`, after fetching `accountsData`, check if the array is empty or null
- If no accounts exist, return `null` instead of computing a score
- Update the return type to `Promise<BudgetScoreResult | null>`

**2. `src/hooks/useBudgetScore.ts`**
- Already handles `scoreData` being `null` with defaults -- no changes needed here since `LatelaScoreCard` checks `!scoreData`

**3. `src/components/budget/LatelaScoreCard.tsx`**
- Line 32 already has `if (!scoreData) return null;` -- this will automatically hide the card when no accounts exist
- No changes needed

**4. `src/components/dashboard/FinancialSummary.tsx`**
- Add a check: if `accounts.length === 0`, display the Budget Status metric as "N/A" (or a dash) instead of showing the risk level
- This applies to both the desktop content block (line 251-263) and the minimal mobile view

### Summary

| Component | Current (no accounts) | After fix |
|-----------|----------------------|-----------|
| Latela Score Card | Shows "Critical", score 0 | Hidden entirely |
| Budget Status in Financial Overview | Shows "Critical" in red | Shows "N/A" or "--" |
| Safe to Spend | Shows R0.00/day | Hidden (card not rendered) |

### Technical Detail
The key fix is a single early-return in `calculateBudgetScore`:
```
if (!accountsData || accountsData.length === 0) {
  return null;
}
```
This cascades through `useBudgetScore` (scoreData becomes null) to `LatelaScoreCard` (returns null) and `FinancialSummary` (checks accounts.length for Budget Status display).
