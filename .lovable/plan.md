
# Responsive Budget Plan + Latela Score Layout

## Problem
Currently the Budget Plan card and Latela Score card always sit side-by-side in a 2:1 grid. When there are fewer than 6 budget items, the Budget Plan card is short and the side-by-side layout wastes space. The user wants the Budget Plan to stretch full-width and the Score card to sit below it in a horizontal/landscape orientation when items are few.

## Behavior

```text
< 6 items:
+----------------------------------------------+
|           Budget Plan (full width)            |
+----------------------------------------------+
|     Latela Score (landscape / horizontal)     |
+----------------------------------------------+

6+ items:
+------------------------------+---------------+
|    Budget Plan (2 cols)      | Latela Score   |
|                              | (vertical)     |
+------------------------------+---------------+
```

## Changes

### 1. Dashboard.tsx -- Conditional grid layout
- Import `useBudgetItems` to access the budget items array and its length
- If `budgetItems.length < 6`: render Budget Plan full-width, then Latela Score below it with a `horizontal` prop
- If `budgetItems.length >= 6`: keep current 3-column grid with Budget Plan spanning 2 columns and Score on the right

### 2. LatelaScoreCard.tsx -- Add `horizontal` prop
- Add an optional `horizontal` boolean prop alongside the existing `compact` prop
- When `horizontal` is true, restructure the full card layout to be landscape-oriented:
  - Use a horizontal flex layout instead of vertical stacking
  - Score circle, risk status, and safe-to-spend sit in a row
  - Pillar breakdown and key metrics flow beside them
  - This creates a wider, shorter card that fits naturally below the full-width Budget Plan

### Technical Detail

**Dashboard.tsx:**
```tsx
const { budgetItems } = useBudgetItems();
const fewItems = budgetItems.length < 6;

// Desktop section becomes:
{fewItems ? (
  <>
    <BudgetItemsCard />
    <LatelaScoreCard horizontal />
  </>
) : (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 items-start">
    <div className="lg:col-span-2">
      <BudgetItemsCard />
    </div>
    <LatelaScoreCard />
  </div>
)}
```

**LatelaScoreCard.tsx:**
- Accept `horizontal?: boolean` prop
- When horizontal, the card uses a grid/flex row layout:
  - Left section: score circle + risk status
  - Middle section: safe-to-spend block
  - Right section: pillar breakdowns + key metrics in a compact 2x2 grid
- This keeps all existing content but arranges it horizontally to match the full-width Budget Plan above it
