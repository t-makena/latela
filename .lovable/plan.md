
## Fix Balance Chart Line Titles and Add Area Fills

### Changes

**File: `src/components/financial-insight/FinancialInsightContent.tsx`**

#### 1. Update imports
Add `Area`, `ComposedChart` from recharts (replacing `LineChart` usage for the Balance charts), or add `defs`, `linearGradient`, and `Area` components. The simplest approach: switch the Balance charts from `LineChart` + `Line` to `ComposedChart` + `Line` + `Area`, which allows mixing line strokes with filled areas beneath.

#### 2. Fix tooltip labels
In both mobile (line 509) and desktop (line 594) formatter functions, change:
- `'Available Balance'` stays as-is (already correct)
- `'Savings Balance'` to `"Saving's Balance"`

Update the `name` prop on both `Line` components (mobile lines 526/535, desktop lines 611/620):
- `name="Available Balance"` -- already correct
- `name="Savings Balance"` to `name="Saving's Balance"`

#### 3. Add area fills beneath the lines
For each Balance chart (mobile and desktop), replace `LineChart` with `ComposedChart` and add `Area` components:

- **Available Balance area**: filled with `#292929` at ~20% opacity, keyed to `netBalance`
- **Saving's Balance area**: filled with `#05ff86` at ~20% opacity, keyed to `budgetBalance`

Each area uses `<defs>` with `<linearGradient>` for a fade-to-transparent effect (solid at top, transparent at bottom), giving a polished gradient fill.

The `<Line>` components remain for the stroke; the `<Area>` components add the fill beneath.

#### 4. Specific code structure per chart

```tsx
import { ComposedChart, Area } from "recharts"; // add to imports

// Inside each Balance chart, replace <LineChart> with <ComposedChart>
<ComposedChart data={netBalanceData} margin={{ top: 20, right: 24, left: 24, bottom: 5 }}>
  <defs>
    <linearGradient id="fillAvailable" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#292929" stopOpacity={0.3} />
      <stop offset="100%" stopColor="#292929" stopOpacity={0.05} />
    </linearGradient>
    <linearGradient id="fillSavings" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#05ff86" stopOpacity={0.3} />
      <stop offset="100%" stopColor="#05ff86" stopOpacity={0.05} />
    </linearGradient>
  </defs>
  <XAxis ... />
  <YAxis ... />
  <Tooltip ... formatter with "Saving's Balance" ... />
  <ReferenceDot ... />
  <Area type="monotone" dataKey="netBalance" fill="url(#fillAvailable)" stroke="none" />
  <Area type="monotone" dataKey="budgetBalance" fill="url(#fillSavings)" stroke="none" />
  <Line type="monotone" dataKey="netBalance" name="Available Balance" stroke="#292929" ... />
  <Line type="monotone" dataKey="budgetBalance" name="Saving's Balance" stroke="#05ff86" ... />
</ComposedChart>
```

Note: The Available Balance stroke color will also change to `#292929` and Saving's Balance stroke to `#05ff86` to match their respective fill colors.

### Summary of edits

| Location | What changes |
|---|---|
| Import (line 4-16) | Add `ComposedChart`, `Area` |
| Mobile Balance (lines 484-541) | `LineChart` to `ComposedChart`, add gradient defs + Areas, fix name/labels |
| Desktop Balance (lines 569-626) | Same changes |
