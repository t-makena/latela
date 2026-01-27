

## Change Color #F97316 to #F85F00

### Summary
Replace all instances of the orange color `#F97316` (and lowercase `#f97316`) with the new color `#f85f00` throughout the codebase.

### Files to Modify

**1. `tailwind.config.ts`** (Line 86)
- Change: `expense: "#F97316"` → `expense: "#f85f00"`
- This is the budget expense color used in Tailwind classes

**2. `src/components/PasswordStrength.tsx`** (Line 31)
- Change: `#f97316` → `#f85f00`
- This is the "Weak" password strength indicator color

**3. `src/components/financial-insight/FinancialInsightContent.tsx`** (Line 163)
- Change: `"E&R": "#F97316"` → `"E&R": "#f85f00"`
- This is the Entertainment & Recreation category color

**4. `src/components/financial-insight/BudgetBreakdown.tsx`** (Line 124)
- Change: `"Discretionary": "#F97316"` → `"Discretionary": "#f85f00"`
- This is the Discretionary parent category color

### Technical Notes
- The new color `#f85f00` is a slightly more saturated/darker orange
- Tailwind classes like `orange-500` and `orange-400` used in `LatelaScoreCard.tsx` are Tailwind defaults and won't be affected by this change (they use Tailwind's built-in color palette)
- If you want the Tailwind `orange-500` class to also use this new color, that would require extending the Tailwind theme, which is a separate change

