
## Landing Page — Typography & Background Updates

### Changes Required

1. **Remove** the "Already have an account? Log in" link from `src/pages/Landing.tsx`
2. **Add Garet font** (Regular + Heavy/Bold weights) to the project via self-hosted font files
3. **Apply typography rules**:
   - All body/descriptive text → Garet (regular)
   - Card headings, labels, form labels → Garet
   - "Join Waitlist" button text → Cooper BT **bold**
   - "Latela" in the heading → Cooper BT **regular** (weight 300)
   - "Welcome to" in the heading → Garet regular
   - The "Join the waitlist" sheet title, "You're on the list!" success heading → Cooper BT (existing brand heading)
4. **Replace the CSS blob background** with the uploaded background image (`Colorful_Simple_Abstract_Phone_Wallpaper_1.png`) as a full-bleed `background-image`

### Font Implementation

Garet is a free font by Type Forward. I'll fetch the `.woff2` files for Regular and Heavy (Bold) weights and place them in `public/fonts/`. Then add `@font-face` declarations in `src/index.css` and register `'garet'` in `tailwind.config.ts` as a new font family.

**`src/index.css` additions:**
```css
@font-face {
  font-family: 'Garet';
  src: url('/fonts/Garet-Book.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: 'Garet';
  src: url('/fonts/Garet-Heavy.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
}
```

**`tailwind.config.ts` addition:**
```ts
fontFamily: {
  'brand': ['"Cooper BT"', 'serif'],
  'garet': ['Garet', 'sans-serif'],   // ← new
  'sans': ['Inter', 'system-ui', 'sans-serif'],
}
```

### Background Image

The uploaded wallpaper (`Colorful_Simple_Abstract_Phone_Wallpaper_1.png`) will be saved to `src/assets/` and imported directly in `Landing.tsx`. The blob `<div>` elements will be removed entirely and replaced with a single CSS `background-image` on the root container:

```tsx
import bg from "@/assets/landing-bg.png";

<div
  className="relative min-h-screen flex flex-col items-center justify-start"
  style={{
    backgroundImage: `url(${bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center top",
  }}
>
```

### Typography Mapping (Landing.tsx)

| Element | Font | Weight | Class |
|---|---|---|---|
| "Welcome to" | Garet | Regular | `font-garet font-normal` |
| "Latela" | Cooper BT | Regular (300) | `font-brand font-light` |
| About us card heading "About us" | Garet | Bold | `font-garet font-bold` |
| Card body text | Garet | Regular | `font-garet` |
| Waitlist card body text | Garet | Regular | `font-garet` |
| "Join Waitlist" button | Cooper BT | Bold | `font-brand font-bold` |
| Form labels | Garet | Semibold | `font-garet font-semibold` |
| Form inputs (placeholder/value) | Garet | Regular | `font-garet` |
| "Join the waitlist" sheet title | Cooper BT | Bold | `font-brand font-bold` |
| Success "You're on the list!" | Cooper BT | Bold | `font-brand font-bold` |
| Success subtext | Garet | Regular | `font-garet` |
| "Close" button in sheet | Cooper BT | Bold | `font-brand font-bold` |

### Files to Change

1. **`public/fonts/Garet-Book.woff2`** — new font file (fetched from CDN)
2. **`public/fonts/Garet-Heavy.woff2`** — new font file (fetched from CDN)
3. **`src/assets/landing-bg.png`** — new background image (from uploaded file)
4. **`src/index.css`** — add two `@font-face` blocks for Garet
5. **`tailwind.config.ts`** — add `'garet'` to `fontFamily`
6. **`src/pages/Landing.tsx`** — remove login link, remove blob divs, add background image, apply typography classes throughout

### What is NOT changing

- The `LatelaIconLanding` SVG — unchanged
- All form logic and Supabase insert — unchanged
- The mobile gate (`MobileGate` in `App.tsx`) — unchanged
- All other pages and components — unchanged
