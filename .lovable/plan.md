

## Fix: Integrate Grocery Budget Into the Budget Page

The previous implementation was not saved. All three files still contain the original standalone grocery budget code. This plan re-implements the integration from scratch.

---

### What Will Change

1. **Budget page gets a sub-view toggle** -- clicking a new "Grocery Budget" card switches to the grocery search/list UI without leaving `/budget`
2. **The standalone `/grocery-budget` route redirects** to `/budget`
3. **The "Grocery Budget" nav item is removed** from the sidebar

---

### File Changes

#### 1. `src/pages/Budget.tsx`

- Add a `view` state: `useState<'budget' | 'grocery'>('budget')`
- Import grocery dependencies: `useGroceryCart`, `SearchTab`, `MyListTab`, `formatPriceCents`, `ShoppingCart`, `ChevronRight`, `ArrowLeft`, `Search`
- **When `view === 'budget'`**: render everything as-is, plus a new **"Grocery Budget" navigation card**:
  - **Desktop**: placed after the "Calculation Explanation" card (line 456) inside the right-column `div`. When `showBalanceCalculations` is false, placed as a full-width card below the grid.
  - **Mobile**: placed as the last card before the `AddBudgetItemDialog` (before line 270)
  - Card style: `rounded-2xl border border-foreground cursor-pointer`, `box-shadow: 4px 4px 0px #000`, with ShoppingCart icon, title, description, and ChevronRight arrow
- **When `view === 'grocery'`**: render the full grocery UI:
  - Back header: ArrowLeft + "Back to Budget" button
  - Tab buttons (Search / My List) with item count badge
  - SearchTab and MyListTab components
  - Sticky total footer

#### 2. `src/App.tsx`

- Add `import { Navigate } from "react-router-dom"`
- Change line 79-85 from rendering `<GroceryBudget />` to: `<Navigate to="/budget" replace />`
- Remove the `GroceryBudget` import (line 22)

#### 3. `src/components/layout/Navbar.tsx`

- Remove line 80: `{ name: t('nav.groceryBudget'), href: "/grocery-budget", icon: ShoppingCart }`
- Remove the `ShoppingCart` import from lucide-react (line 4) since it's no longer used in this file

