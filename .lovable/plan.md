
## Move Store Filters into a Dropdown Button

### Problem
The store filter pills (All, Checkers, Makro, PnP, Woolies) and the "On Sale" button take up a full row below the search bar, cluttering the UI on mobile.

### Solution
Replace the standalone filter pills row with a single **filter button** placed at the right end of the search bar. Tapping it opens a dropdown/popover showing the store options and the "On Sale" toggle. The button shows a visual indicator when a non-default filter is active.

### Changes

**File: `src/components/grocery-budget/SearchTab.tsx`**
- Import `Popover`, `PopoverTrigger`, `PopoverContent` from `@/components/ui/popover` and `SlidersHorizontal` icon from lucide
- Replace the search input `<div className="relative">` with a flex row containing the search input (flex-1) and a filter button on the right
- The filter button uses `SlidersHorizontal` icon; when a filter is active (store not "all" or onSaleOnly is true), show a small colored dot badge on the button
- Remove the entire "Filters Row" `<div>` (lines 57-75)
- Inside the `PopoverContent`, render the store options as a vertical list of buttons (similar styling to current pills) plus the "On Sale" toggle at the bottom
- Give the popover `bg-card` background and high z-index for visibility

**File: `src/components/grocery-budget/StoreFilterPills.tsx`**
- Keep the component and its `StoreFilter` type export (still used for the filter logic)
- Optionally refactor to a vertical layout variant, or inline the store list directly in SearchTab

### Layout

```text
Before:
[🔍  Search groceries...              ]
[All] [Checkers] [Makro] [PnP] [Woolies] [🔥 On Sale]

After:
[🔍  Search groceries...              ] [⚙ Filter]
                                          ┌──────────┐
                                          │ All      │
                                          │ Checkers │
                                          │ Makro    │
                                          │ PnP      │
                                          │ Woolies  │
                                          │──────────│
                                          │ 🔥 Sale  │
                                          └──────────┘
```

### Technical Details

**SearchTab.tsx** updated structure:
```tsx
<div className="flex items-center gap-2">
  <div className="relative flex-1">
    <Search ... />
    <Input ... />
  </div>
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="icon" className="relative shrink-0">
        <SlidersHorizontal size={18} />
        {hasActiveFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-48 bg-card border-foreground p-2 z-50">
      {/* Store buttons + On Sale toggle */}
    </PopoverContent>
  </Popover>
</div>
```

The active filter indicator dot lets users know a filter is applied even when the popover is closed. Selecting "All" with sale off returns to default (no dot).
