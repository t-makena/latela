

## Fix: "Apply Adjustment" Button and "Est completion date" Label

### Issue 1: "Apply Adjustment" button not working

**Root cause**: In both `SavingsAdjustmentCard.tsx` (line 48) and `MonthEndReviewDialog.tsx` (line 92), the `handleApplyAdjustments` function constructs a new `dueDate` from scratch (`new Date()`) instead of preserving the goal's original due date. This means:
- When `timelineExtensionMonths` is 0 or Infinity, the due date becomes **today**, which is invalid
- Even when extension months exist, the calculation starts from today instead of the original due date

**Fix**: Parse the goal's existing `timeline` string back to a Date and keep it as the due date. The adjustment should only update `monthlyAllocation`, not change the due date — the due date is user-set and should be preserved.

**Changes in `src/components/goals/SavingsAdjustmentCard.tsx`** (lines 42-58):
- Remove the broken dueDate construction
- Parse the goal's existing timeline back to a Date to pass to `updateGoal`
- Only update `monthlyAllocation` to the new value; keep everything else unchanged

**Changes in `src/components/goals/MonthEndReviewDialog.tsx`** (lines 88-103):
- Same fix as above

### Issue 2: "Due:" should say "Est completion date:"

**Root cause**: In `useGoals.ts` line 89, the `dueDate` field is hardcoded as `Due: ${formattedDueDate}`. The user wants goals with a target amount to show "Est completion date:" instead.

**Changes in `src/hooks/useGoals.ts`** (line 89):
- Change `dueDate: \`Due: ${formattedDueDate}\`` to `dueDate: \`Est completion date: ${formattedDueDate}\``

**Changes in `src/pages/Goals.tsx`** (line 148) and `src/components/dashboard/BudgetGoalsList.tsx`** (line 95):
- No changes needed — these just render `goal.dueDate` which will automatically pick up the new label

