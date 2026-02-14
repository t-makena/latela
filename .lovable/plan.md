

## Fix: Savings Balance Chart - Correct Line Names and Expected Balance Logic

### Current Issues

1. **Line naming**: The green line is labeled "Total Amount Saved" -- should be "Saving's Balance". The gray line "Expected Balance" name is correct.
2. **Expected Balance logic is wrong**: Currently uses backward-looking cumulative monthly allocations. Should be a **forward projection** from today's actual savings:
   - Current month: `totalSaved` (same as Saving's Balance)
   - Each future month: `totalSaved + (monthlyAllocation x months ahead)`
   - Past months before goal creation: R0

### Correct Expected Balance Model

Example: Goal created Feb 14 with R2,000 saved, R400/month allocation:
- Dec, Jan: R0 (goal didn't exist)
- Feb (current): R2,000 (baseline = totalSaved)
- Mar: R2,400 (R2,000 + R400 x 1)
- Apr: R2,800 (R2,000 + R400 x 2)

### Reference Image Match

The green line (Saving's Balance) shows the actual step-up at goal creation. The gray line (Expected Balance) starts at the same point as savings in the current month but grows at a gentler slope representing the monthly allocation projection.

### Technical Changes

**File: `src/components/goals/GoalsSavingsBalanceChart.tsx`**

**1. Fix line labels (lines 200, 224, 233)**
- Change tooltip and Line `name` from "Total Amount Saved" to "Saving's Balance"

**2. Rewrite Expected Balance logic (lines 45-127)**

The chart needs to show both **past data** and **future projection**:

For 3M/6M/1Y views:
- Iterate from (period start) to (period start + monthCount) -- this includes months ahead of now
- For months before goal creation: `expected = 0`, `savings = 0`
- For the current month: `expected = totalSaved`, `savings = totalSaved`
- For future months: `expected = totalSaved + (expectedMonthlySavings x monthsAhead)`, `savings` line stops (no future data, so 0 or null)

For 1M view:
- Current week: both lines show `totalSaved`
- Past weeks before goal: both 0
- The expected line stays flat at the monthly target for the 1M view (per existing memory about flat expected in 1M)

**3. Extend chart timeline into the future**

Currently the chart only shows historical months. To match the reference image where the expected line projects forward, the data range needs to extend a few months beyond "now":
- 3M: show 1 month back + 2 months forward (or similar split)
- 6M: show 3 months back + 3 months forward
- 1Y: show 6 months back + 6 months forward

This way the green line (actual savings) stops growing at "now" while the gray line (expected) continues to project forward.

**4. Update line colors to match brand (line 222, 231)**
- Expected Balance: keep `hsl(var(--muted-foreground))` (gray) -- matches reference
- Saving's Balance: keep `#22c55e` (green) -- matches reference

### Summary of Data Shape Per Period

```text
3M view (1 month back, 2 forward):
         Jan     Feb(now)  Mar       Apr
Savings: R0      R2,000    --        --
Expected:R0      R2,000    R2,400    R2,800

6M view (3 back, 3 forward):
         Dec  Jan  Feb(now)  Mar     Apr     May
Savings: R0   R0   R2,000    --      --      --
Expected:R0   R0   R2,000    R2,400  R2,800  R3,200
```
