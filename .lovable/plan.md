

## Redesign Period Filter to Minimal Text Style

### What Changes
Replace the current button-based period filter with a clean, minimal text-based design matching the reference image. The selected option gets a filled dark circle/pill indicator behind it (like the "1M" in the screenshot), while unselected options are plain text.

### Visual Design
- Options displayed as plain text labels spaced evenly: `1W  1M  3M  6M  1Y  Custom`
- The **active** option has a dark filled circle (black background, white text, rounded-full)
- Unselected options are plain text in muted foreground color
- No borders, no outline buttons -- just text and one pill highlight
- "Custom" remains text-based but still opens the calendar popover on click
- Font: Inter (inherits from body), medium weight

### Technical Details

**File: `src/components/common/DateFilter.tsx`**

Replace the repeated `<Button>` elements with a single map over filter options. Each option renders as a `<button>` (not the shadcn Button) with:
- Base styles: `text-sm font-medium text-muted-foreground cursor-pointer transition-colors`
- Active styles: `bg-foreground text-background rounded-full w-8 h-8 flex items-center justify-center` (the filled circle pill)
- Inactive styles: `hover:text-foreground`

The "Custom" option keeps the `Popover` wrapper but uses the same text styling instead of a bordered button. When custom is active and a range is selected, it shows the date range text below or beside.

Structure:
```
<div className="flex items-center justify-center gap-6">
  {filters.map(filter => (
    <button
      key={filter}
      onClick={...}
      className={cn(
        "text-sm font-medium transition-all",
        isActive
          ? "bg-foreground text-background rounded-full w-8 h-8 flex items-center justify-center"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  ))}
</div>
```

No other files need changes -- the DateFilter component is self-contained and used via props everywhere.

