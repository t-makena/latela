

# Fix: Savings Balance Chart Should Not Assume Previous Saved Amounts

## Problem
The chart spreads the current `totalSaved` (sum of all `goal.amountSaved`) backwards across past months using a `progressRatio`. If you only saved R5,000 this month, the chart incorrectly shows R833 in month 1, R1,667 in month 2, etc., instead of showing R0 for all past months and R5,000 only for the current month.

## Root Cause
In `GoalsSavingsBalanceChart.tsx`, lines 76-91:
```typescript
const progressRatio = monthsFromStart / monthCount;
const actualSavingsAtPoint = totalSaved * progressRatio;
```
This linear interpolation assumes savings were accumulated evenly over the entire period, which is incorrect.

## Fix

**File: `src/components/goals/GoalsSavingsBalanceChart.tsx`**

Replace the interpolation logic with point-in-time data:
- **Past months**: Show R0 savings (we have no historical savings snapshots, so we cannot assume any savings existed)
- **Current month**: Show the actual `totalSaved` value (sum of `goal.amountSaved`)

The updated logic for the savings line:
```typescript
let savingsBalance: number;
if (isCurrentMonth) {
  savingsBalance = totalSaved;
} else {
  savingsBalance = 0;
}
```

This is the simplest correct approach given there's no historical savings snapshot data. The chart will show R0 for all past months and the real total saved for the current month, accurately reflecting what was actually saved.

## Scope
- One file changed: `src/components/goals/GoalsSavingsBalanceChart.tsx`
- Only the `savingsBalance` calculation within the `chartData` memo changes
- No hook or data model changes needed

