
## Mobile Landing Page with Waitlist

### Overview

Create a new public-facing landing page (`/landing`) that non-authenticated mobile users see, based on the design reference. The page features a colourful neo-brutalist background, the Latela logo icon, a large "Welcome to Latela" heading, an "About us" info card, a waitlist invite card, and a "Join Waitlist" CTA button that collects email addresses.

### Design Breakdown (from reference image)

- **Background**: Bold multi-colour blob/wave shapes — green (top-left), red (top-right), yellow (centre), blue (lower-left), orange (bottom-right)
- **Logo**: Latela icon (the existing `LatelaIcon` SVG) centred at the top
- **Headline**: "Welcome to Latela" in the brand font (Cooper BT), large, black
- **Card 1** (yellow, black border + shadow): Bold "About us" heading + description text
- **Card 2** (blue, black border + shadow): Waitlist incentive text (first 1000 users get 3 months premium free)
- **CTA Button**: Black background, white bold text "Join Waitlist" → opens email input modal

### Database

A new `waitlist` table will be needed to persist signups. This is a simple public-insert table.

**Migration: `supabase/migrations/YYYYMMDD_create_waitlist.sql`**
```sql
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (join waitlist)
CREATE POLICY "Public can join waitlist" ON waitlist 
  FOR INSERT WITH CHECK (true);

-- Only service role can read (admin use)
CREATE POLICY "Service read waitlist" ON waitlist 
  FOR SELECT USING (auth.role() = 'service_role');
```

### Files to Create / Edit

#### 1. New file: `src/pages/Landing.tsx`

A full-screen mobile-first landing page component with:

- **Colourful blob background** using inline SVG blobs or absolute-positioned coloured `div`s clipped with `border-radius` to produce the organic shape aesthetic from the design
- **LatelaIcon** (existing component) centered at top
- **"Welcome to Latela"** heading using `font-brand` (Cooper BT)
- **Yellow card** (About us)
- **Blue card** (Waitlist incentive)
- **Black "Join Waitlist" button** that opens an inline form (name + email input) or a small dialog
- On submit: inserts into the `waitlist` Supabase table, shows a success confirmation

#### 2. Edit: `src/App.tsx`

Add a `/landing` route (no auth required):
```tsx
import Landing from "./pages/Landing";
// ...
<Route path="/landing" element={<Landing />} />
```

#### 3. Edit: `src/components/ProtectedRoute.tsx`

Change the redirect for unauthenticated users from `/auth` → `/landing` so mobile visitors land here first:
```tsx
// Before
return <Navigate to="/auth" state={{ from: location }} replace />;

// After
return <Navigate to="/landing" state={{ from: location }} replace />;
```

The Landing page will have a secondary "Already have an account? Log in" link that navigates to `/auth`.

### Landing Page Structure (JSX outline)

```text
<div> ← full viewport, overflow hidden, relative
  
  [Blob background layer] ← absolute positioned coloured shapes
    - Green blob top-left
    - Red blob top-right
    - Yellow centre-blob
    - Blue lower blob
    - Orange bottom blob

  [Content layer] ← relative z-10, flex-col, padded
    
    [LatelaIcon]  ← centered, ~80px, white fill for contrast
    
    [Heading]
      "Welcome to"
      "Latela"
      ← font-brand, ~56px, font-black
    
    [About Us Card]  ← bg-yellow-300, black border, box-shadow 4px 4px 0 black, rounded-2xl
      <h3>About us</h3>
      <p>We are an AI-powered budgeting app on a mission to transform the relationship millions of South Africans have with their money.</p>
    
    [Waitlist Card]  ← bg-blue-400, black border, box-shadow 4px 4px 0 black, rounded-2xl, white text
      <p>If you would like to be notified when we launch our mobile app, please join our waitlist. The first 1000 people on our waitlist will get three months of our premium tier, for free.</p>
    
    [Join Waitlist Button]  ← full-width, bg-black, white bold text, rounded-2xl, large
      "Join Waitlist"
    
    [Login link]  ← small, centered, muted
      "Already have an account? Log in"

  [Waitlist Dialog / inline form]
    - Name input
    - Email input
    - Submit button
    - Success state: "You're on the list! 🎉"
```

### Technical Notes

- Blob shapes will be CSS `div`s with `border-radius` percentages to produce organic shapes (no external library needed)
- The `LatelaIcon` SVG uses `fill-foreground`/`fill-background` classes — on the landing page these will be overridden with hardcoded white/black fills since the background is colourful
- A separate `LatelaIconInverted` variant or inline SVG with hardcoded colours will be used for the landing page logo to ensure visibility against the colourful background
- No authentication is needed to view the landing page
- The waitlist insert uses the anonymous Supabase client with the RLS INSERT policy allowing public access

### What this does NOT change
- The existing `/auth` flow — unchanged, still accessible via link on the landing page
- Authenticated user routing — logged-in users still go to `/` (dashboard)
- Desktop layout — no changes (the landing page is intentionally mobile-focused)
- All existing app pages and components
