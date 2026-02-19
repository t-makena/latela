
## Fix: Background Extends Behind Dynamic Island / Status Bar

Two precise edits only — no logic changes, no new files.

### Edit 1 — `index.html` (line 5)

Add `viewport-fit=cover` to the viewport meta tag:

```html
<!-- Before -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- After -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

This tells mobile Safari to extend the page's rendering surface all the way behind the Dynamic Island and status bar. Without it, the browser always reserves that top strip as white.

### Edit 2 — `src/pages/Landing.tsx` (line 100)

Replace the `py-10` class on the content wrapper with an inline `paddingTop` style that uses the CSS environment variable `env(safe-area-inset-top)`:

```tsx
<!-- Before -->
<div className="relative z-10 flex flex-col items-center w-full max-w-md px-4 py-10 gap-5">

<!-- After -->
<div
  className="relative z-10 flex flex-col items-center w-full max-w-md px-4 pb-10 gap-5"
  style={{ paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)" }}
>
```

- `env(safe-area-inset-top)` equals the exact height of the Dynamic Island / notch on the current device
- On iPhones with a Dynamic Island it is ~59px; on older notch iPhones ~44px; on devices with no notch it equals `0px` — so this is fully safe everywhere
- `+ 2.5rem` preserves the existing `py-10` (40px) top spacing below the safe area, so the logo and heading sit in the same visual position they do now, just pushed down past the island

### What is NOT changing

- Background image, colours, cards, typography — all unchanged
- The waitlist modal — unchanged
- All desktop routes and other pages — unchanged
- The bottom of the page / modal safe area is already handled with `pb-10`
