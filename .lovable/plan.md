
## Match Font Sizes and Add "Target Total Savings"

### Problem
The currency figures under "Target Monthly Saving" and "Total Amount Saved" use `balance-primary` (40px desktop / 26px mobile) and `balance-secondary` (30px / 21px), which are much larger than the "Goals Overview" card title using `heading-main` (27px / 19px). The user wants these to match. Additionally, a "Target Total Savings" metric is missing.

### Changes

**File: `src/pages/Goals.tsx`**

1. **Add `totalTargetSavings` calculation** (after line 60):
   ```tsx
   const totalTargetSavings = goals.reduce((total, goal) => total + goal.target, 0);
   ```

2. **Mobile section (lines 148-161)** -- Change layout from 2 columns to 3, and replace `balance-secondary` with `heading-main` on the currency values:
   ```tsx
   <div className="flex justify-between items-start gap-4">
     <div className="flex-1">
       <p className="label-text mb-1">{t('goals.targetMonthlySaving')}</p>
       <p className="heading-main currency">{formatCurrency(totalMonthlyAllocation)}</p>
     </div>
     <div className="flex-1 text-center">
       <p className="label-text mb-1">{t('goals.totalAmountSaved')}</p>
       <p className="heading-main currency">{formatCurrency(totalAmountSaved)}</p>
     </div>
     <div className="flex-1 text-right">
       <p className="label-text mb-1">Target Total Savings</p>
       <p className="heading-main currency">{formatCurrency(totalTargetSavings)}</p>
     </div>
   </div>
   ```

3. **Desktop section (lines 263-276)** -- Same pattern: replace `balance-primary` with `heading-main`, add third column for Target Total Savings:
   ```tsx
   <div className="flex justify-between items-start gap-8">
     <div className="flex-1">
       <p className="label-text mb-1">{t('goals.targetMonthlySaving')}</p>
       <p className="heading-main currency">{formatCurrency(totalMonthlyAllocation)}</p>
     </div>
     <div className="flex-1 text-center">
       <p className="label-text mb-1">{t('goals.totalAmountSaved')}</p>
       <p className="heading-main currency">{formatCurrency(totalAmountSaved)}</p>
     </div>
     <div className="flex-1 text-right">
       <p className="label-text mb-1">Target Total Savings</p>
       <p className="heading-main currency">{formatCurrency(totalTargetSavings)}</p>
     </div>
   </div>
   ```

### Result
All three summary figures will render at the same size as the "Goals Overview" title (27px desktop / 19px mobile, Cooper BT 700). The new "Target Total Savings" column shows the sum of all goal targets.
