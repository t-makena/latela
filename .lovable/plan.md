
## Change Color #ef4444 to #ff3132

### Summary
Replace all instances of the red color `#ef4444` (and uppercase `#EF4444`) with the new color `#ff3132` throughout the codebase.

### Files to Modify

**1. `src/components/PasswordStrength.tsx`** (Line 31)
- Change: `'#ef4444'` → `'#ff3132'`
- This is the "Very Weak" password strength indicator color

**2. `src/components/financial-insight/FinancialInsightContent.tsx`** (Line 164)
- Change: `"H&M": "#EF4444"` → `"H&M": "#ff3132"`
- This is the Healthcare & Medical category color

**3. `src/components/financial-insight/BudgetBreakdown.tsx`** (Line 139)
- Change: `"Healthcare & Medical": "#EF4444"` → `"Healthcare & Medical": "#ff3132"`
- This is the Healthcare & Medical subcategory color

**4. `src/components/dashboard/EnhancedSpendingChart.tsx`** (Line 36)
- Change: `"Healthcare & Medical": "#EF4444"` → `"Healthcare & Medical": "#ff3132"`
- This is the Healthcare & Medical category color in the spending chart

### Technical Notes
- The new color `#ff3132` is a slightly brighter, more vivid red
- Tailwind utility classes like `text-red-600`, `text-red-500`, `bg-red-500` used elsewhere are Tailwind defaults and won't be affected by this change
- The CSS variables `--destructive` and `--color-negative` in `index.css` use HSL values, not hex codes, so they remain unchanged
- If you want those Tailwind red classes to also use this new color, that would require extending the Tailwind theme, which is a separate change
