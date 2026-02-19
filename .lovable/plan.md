
## Admin Waitlist Dashboard — `info@latela.co.za`

### Overview

A desktop-accessible `/admin/waitlist` route that sits **outside** the `MobileGate`, so it always renders regardless of viewport width. It is protected by `ProtectedRoute` (must be logged in) and performs a second check inside the page itself — if the logged-in email is not `info@latela.co.za`, an "Access Denied" screen is shown. The actual data access is also locked at the database layer via an RLS policy.

---

### Part 1 — Database: New RLS `SELECT` policy on `waitlist`

Currently the `waitlist` table only allows `SELECT` for `service_role`. We need a new policy so that an authenticated session where `auth.email() = 'info@latela.co.za'` can also read the full table.

```sql
CREATE POLICY "Admin can read waitlist"
ON public.waitlist
FOR SELECT
USING (auth.email() = 'info@latela.co.za');
```

This is evaluated entirely server-side from the JWT — cannot be spoofed.

---

### Part 2 — New page: `src/pages/AdminWaitlist.tsx`

A clean desktop admin UI with:

- **Header bar**: Latela wordmark + "Waitlist Admin" badge + Sign Out button
- **Stats row** (3 cards):
  - Total sign-ups
  - Sign-ups this week
  - Sign-ups today
- **Search input** — filters the table client-side by name or email
- **Table** — columns: `#` | Name | Email | Joined date (formatted `DD MMM YYYY`) — newest first, max 1000 rows
- **Export CSV button** — downloads the full filtered list using the existing `downloadCSV` utility from `src/lib/exportUtils.ts`
- **Access Denied screen** — shown if the logged-in email ≠ `info@latela.co.za`, with a Sign Out button
- **Loading / empty / error states** handled cleanly

The page uses existing shadcn/ui components (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `Input`, `Button`, `Badge`) and the `useAuth` hook from `AuthContext`.

The admin email `info@latela.co.za` is stored in a single constant at the top of the file — easy to change in future.

---

### Part 3 — Routing: `src/App.tsx`

The `/admin/waitlist` route is placed **before** the `<MobileGate>` wrapper (actually, it needs to be outside `MobileGate` so it renders on desktop too). The cleanest way:

```tsx
// In App.tsx — the admin route is rendered OUTSIDE MobileGate
// so the MobileGate (which shows Landing on mobile) doesn't intercept it.
```

The solution is to restructure `App.tsx` so that `/admin/waitlist` is rendered in a separate `<Routes>` block outside `MobileGate`, or more simply: move the admin route to the very top of the `<Routes>` block but still outside `MobileGate`. 

The cleanest approach: render the admin route in a parallel branch alongside `MobileGate`:

```tsx
<BrowserRouter>
  <Routes>
    {/* Admin route — always available on desktop, no MobileGate */}
    <Route path="/admin/waitlist" element={
      <ProtectedRoute>
        <AdminWaitlist />
      </ProtectedRoute>
    } />
    {/* All other routes go through MobileGate */}
    <Route path="/*" element={
      <MobileGate>
        <FloatingChatProvider>
          <FloatingChat />
          <Routes>
            ...existing routes...
          </Routes>
        </FloatingChatProvider>
      </MobileGate>
    } />
  </Routes>
</BrowserRouter>
```

This is the correct React Router v6 pattern — no code duplication, clean separation.

---

### Files to Change

| File | Change |
|---|---|
| Database migration | New `SELECT` RLS policy: `auth.email() = 'info@latela.co.za'` |
| `src/pages/AdminWaitlist.tsx` | New page (create) |
| `src/App.tsx` | Restructure routes to lift admin route outside MobileGate |

### What is NOT changing

- Landing page — unchanged
- All other app routes — unchanged
- The public `INSERT` policy on `waitlist` — unchanged (anyone can still sign up)
- `MobileGate` logic itself — unchanged
