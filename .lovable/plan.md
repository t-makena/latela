
## Fix 1M Expected Balance Line

### Problem
In the 1M (one month) view of the Savings Balance chart, the Expected Balance line accumulates weekly -- it starts near zero in Week 1 and ramps up to the full monthly amount by Week 4. This incorrectly implies that a portion of savings should have already been set aside in earlier weeks. The Expected Balance should be a flat line representing the total monthly savings target.

### Solution
Change the 1M chart logic so Expected Balance is a flat value (the full monthly expected savings) across all weeks, rather than a cumulative weekly ramp.

### File to Change

**`src/components/goals/GoalsSavingsBalanceChart.tsx`** (lines 55-81)

Replace the cumulative weekly logic:
```
cumulativeExpected += weeklyExpected;
```

With a flat expected value that accounts for which goals existed at each week:
```
// Calculate expected as total monthly allocation for goals that existed by this week
const expectedForWeek = goals.reduce((sum, goal) => {
  const goalCreated = new Date(goal.createdAt);
  if (goalCreated <= weekEnd) {
    return sum + goal.monthlyAllocation;
  }
  return sum;
}, 0);
```

Each week's `expected` value will be the flat monthly target (not divided or accumulated), so the orange line stays level across the chart, showing the user what they need to reach by month-end.
