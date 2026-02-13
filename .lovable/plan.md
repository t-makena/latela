

## Fix Balance Graph Zero Line Clipping

### Problem
The Balance graph's zero-value line is partially covered/clipped at the bottom edge of the chart, the same issue the Savings Balance chart previously had.

### Root Cause
The Balance chart (both mobile and desktop in `FinancialInsightContent.tsx`) uses `margin={{ top: 5, right: 0, left: 0, bottom: 0 }}`, which leaves no breathing room at the bottom. The Savings Balance chart was fixed by using `bottom: 5`.

### Fix
Update the `bottom` margin from `0` to `5` on both Balance `LineChart` instances in `FinancialInsightContent.tsx`:

**`src/components/financial-insight/FinancialInsightContent.tsx`**

1. **Mobile Balance chart (line 484)**: Change `margin={{ top: 5, right: 0, left: 0, bottom: 0 }}` to `margin={{ top: 5, right: 0, left: 0, bottom: 5 }}`

2. **Desktop Balance chart (line 559)**: Change `margin={{ top: 5, right: 0, left: 0, bottom: 0 }}` to `margin={{ top: 5, right: 0, left: 0, bottom: 5 }}`

This matches the Savings Balance chart's margin configuration and ensures the zero line is fully visible.
