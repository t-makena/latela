
## Replace Budget Status "Good/Bad" with Latela Score Risk Levels

### What Changes

The Financial Overview card currently shows **Budget Status** as either "Good" or "Bad" based on whether flexible balance is positive. This will be replaced with the same 5-tier risk levels used by the Latela Score: **Safe, Mild Risk, Moderate Risk, High Risk, Critical**.

### File: `src/components/dashboard/FinancialSummary.tsx`

1. **Import `useBudgetScore`** hook to access the calculated `riskLevel` from the budget score system
2. **Remove** the simple `good`/`bad` logic (`flexibleBalance >= 0 ? 'good' : 'bad'`)
3. **Replace** the Budget Status display with the risk level label and description from the Latela Score, reusing the same mapping pattern from `LatelaScoreCard`:
   - `safe` → "Safe" / "You're on track to make it to payday comfortably"
   - `mild` → "Mild Risk" / "Slight caution advised"
   - `moderate` → "Moderate Risk" / "Consider reducing spending"
   - `high` → "High Risk" / "High risk of running short before payday"
   - `critical` → "Critical" / "Urgent: You may not have enough to last"
4. **Add color coding** to the status text matching the Latela Score colors (green for safe, yellow for mild, orange for moderate, red for high/critical)

### Technical Details

- The `useBudgetScore` hook is already available and returns `riskLevel` from the budget score calculator
- The existing translation keys (`score.riskLevels.*`) will be reused for the status label
- The `budgetStatusDescription` will map to the risk messages (`score.riskMessages.*`)
- The loading state will also account for `useBudgetScore` loading
