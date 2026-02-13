
## Dual-Font Typography System: Cooper BT + Inter

### Overview
Set Inter as the default body/UI font across the entire app, and reserve Cooper BT for brand elements (logo, nav items, page headings, section titles). This is achieved primarily through global CSS changes with minimal component edits.

### Changes

**1. Add Inter from Google Fonts (`index.html`)**
- Add the Google Fonts `<link>` tag for Inter (weights 400, 500, 600, 700) in the `<head>`.

**2. Update Tailwind config (`tailwind.config.ts`)**
- Change `fontFamily` to define two families:
  - `'brand'`: `['"Cooper BT"', '"Cooper Black"', 'serif']` -- for headings and nav
  - `'sans'`: `['Inter', 'system-ui', 'sans-serif']` -- becomes the default body font

**3. Update global CSS (`src/index.css`)**
- Change the `body` rule from `font-family: 'Cooper BT', serif` to `font-family: 'Inter', system-ui, sans-serif`
- Add brand font rules for headings and nav items:
  ```css
  h1, h2, h3, .heading-main, .heading-card, .page-title, .section-title {
    font-family: 'Cooper BT', 'Cooper Black', serif;
  }
  ```
- Update the existing `.heading-main` and `.heading-card` utility classes to include `font-family: 'Cooper BT', 'Cooper Black', serif`

**4. Navbar component (`src/components/layout/Navbar.tsx`)**
- Add `font-brand` class to the "Latela" logo text (`<h2>` on lines 253 and 279)
- Add `font-brand` class to nav item `<span>` elements (lines 115, 142, 203, 225) so nav labels use Cooper BT

**5. No other component changes needed**
- The `heading-main` CSS class (used in BudgetItemsCard, LatelaScoreCard, Dashboard, etc.) will inherit Cooper BT from the global CSS rule
- All other text (tables, labels, numbers, buttons, body text) will automatically use Inter as the new body default
- The `<CardTitle>` elements that use `heading-main` class already get Cooper BT
- Score numbers, currency values, metric labels, table content, buttons -- all inherit Inter from body

### Technical Details

Files to edit:
- `index.html` -- add 1 line (Google Fonts link)
- `tailwind.config.ts` -- update `fontFamily` object (2 entries)
- `src/index.css` -- change body font-family, add heading font rules (~5 lines)
- `src/components/layout/Navbar.tsx` -- add `font-brand` to logo and nav item text (~4 spots)

No new dependencies. No structural changes. The approach uses CSS cascade so Inter becomes the default everywhere, and Cooper BT is applied only to brand elements via class or element selectors.
