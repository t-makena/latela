
## Add Neo-Brutalist Card Wrapper to Grocery Sub-View

### Problem
The Grocery Budget sub-view renders its content (search, my list) without the neo-brutalist card styling used everywhere else in the app -- no `bg-card`, no `border border-foreground`, no `4px 4px 0px #000000` box-shadow.

### Solution
Wrap the `GrocerySubView` content (below the header row) in a neo-brutalist card container matching the Budget Plan card style.

### Changes

**File: `src/pages/Budget.tsx`**

In the `GrocerySubView` component (around line 236), wrap the tab content area (the `<div className="flex-1">` block containing `SearchTab` / `MyListTab`) inside a card-styled container:

```tsx
<div 
  className="bg-card rounded-3xl border border-foreground p-5 w-full"
  style={{ boxShadow: '4px 4px 0px #000000' }}
>
  {groceryTab === 'search' ? (
    <SearchTab ... />
  ) : (
    <MyListTab ... />
  )}
</div>
```

This applies to both mobile and desktop since `GrocerySubView` is shared. The header (back arrow + title + toggle icon) stays outside the card, matching how other pages show a heading above their card content.
