
## Landing Page — Wider Cards, Larger Text & Darker Button Shadow

### What's Changing

Three small visual tweaks to `src/pages/Landing.tsx` only:

#### 1. Wider cards / more horizontal width

The content wrapper is currently `max-w-sm` (384px) with `px-6` padding. Changing to `max-w-md` (448px) with `px-4` padding gives the cards more room to breathe and makes them feel bigger on screen.

#### 2. Larger text inside the cards

- **About us heading**: `text-xl` → `text-2xl`
- **Card body text**: both cards currently use `text-sm` → changing to `text-base`

#### 3. Much darker shadow on "Join Waitlist" button

Currently: `boxShadow: "4px 4px 0 #374151"` (dark grey, fairly subtle)  
Changed to: `boxShadow: "6px 6px 0 #000000"` — pure black and slightly larger offset for a stronger, crisper neo-brutalist effect.

### Files to Change

- **`src/pages/Landing.tsx`** only — three small edits:
  1. Content wrapper: `max-w-sm px-6` → `max-w-md px-4`
  2. About us card: heading `text-xl` → `text-2xl`, body `text-sm` → `text-base`
  3. Waitlist card: body `text-sm` → `text-base`
  4. CTA button shadow: `4px 4px 0 #374151` → `6px 6px 0 #000000`

### What is NOT changing
- All fonts, colours, card backgrounds — unchanged
- The background image — unchanged
- The waitlist modal / form — unchanged
- All other pages — unchanged
