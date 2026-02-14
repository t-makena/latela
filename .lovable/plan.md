

## Fix: Empty PDF Report

### Problem
The `PrintableReport` component sits inside the `<main>` element (rendered by Layout). The print CSS rule `main { display: none !important; }` hides `<main>` entirely, which also hides the `PrintableReport` inside it -- a child cannot override a hidden parent.

### Fix (2 files)

**File 1: `src/index.css`**
- Remove `main` and `.container` from the print hide rule
- Instead, add a `.print-hide` class that hides non-report content:

```css
@media print {
  /* Hide non-report UI */
  .sidebar-nav, nav, header, .fixed, .sticky, footer,
  .sonner-toast, [data-sonner-toaster],
  .print-hide {
    display: none !important;
  }

  /* Show the printable report */
  .printable-report {
    display: block !important;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    padding: 20mm;
  }
}
```

**File 2: `src/pages/Reports.tsx`**
- Add `print:hidden` (Tailwind utility) to the visible Reports page content wrapper so it hides during print
- The `PrintableReport` already uses `hidden print:block` so it will become visible

This way `<main>` stays visible during print, allowing the `PrintableReport` inside it to render.

