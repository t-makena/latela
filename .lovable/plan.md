
## Block All Mobile Routes — Show Landing Page Instead

### The Problem

Right now `/landing` is just one route among many. Mobile users who navigate directly to `/auth` (or any other route) still see the real app. The landing page is a destination, not a gate.

The goal: **any mobile visitor hitting any URL in the app should be intercepted and shown `/landing` instead** — including `/auth`. Desktop users are completely unaffected.

### Strategy

The cleanest way is a single **`MobileGate` wrapper** component that sits above all routing. It checks `useIsMobile()` and, if the user is on a small screen, immediately renders `<Landing />` regardless of what URL they tried to access. Desktop users fall through to the normal `<Routes>` as today.

```text
App renders
  └── MobileGate
        ├── [mobile]  → always render <Landing /> (no routing at all)
        └── [desktop] → render normal <Routes> (all existing routes unchanged)
```

This is better than adding redirect logic to every individual route, and better than patching `ProtectedRoute`, because it intercepts even public routes like `/auth` that `ProtectedRoute` never touches.

### Files to Change

#### 1. `src/App.tsx`

- Import `useIsMobile` and `Landing`.
- Wrap all `<Routes>` in a new inline `MobileGate` component defined inside `App.tsx`.
- `MobileGate` calls `useIsMobile()`. If mobile → render `<Landing />`. Otherwise → render `{children}` (the `<Routes>`).
- Also: remove the now-redundant `/landing` route from `<Routes>` (desktop users don't need it, mobile users are gated before routing).

Key change shape:

```tsx
function MobileGate({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  if (isMobile) return <Landing />;
  return <>{children}</>;
}

// Inside App JSX:
<BrowserRouter>
  <MobileGate>
    <FloatingChatProvider>
      <FloatingChat />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        {/* all other routes — NO /landing route needed */}
        ...
      </Routes>
    </FloatingChatProvider>
  </MobileGate>
</BrowserRouter>
```

Note: `useIsMobile` returns `false` by default on the first render (before the `useEffect` fires). This means desktop users will see a very brief blank flash. To avoid this, the `MobileGate` can render `null` (a spinner would be overkill for a one-frame delay) while `isMobile` is still `undefined` — which we can detect since `useIsMobile` returns `!!isMobile` (always a boolean). We'll tweak `MobileGate` to handle this by checking `window.innerWidth` synchronously on first render via a one-liner `useState` initialiser, so there's zero flash.

#### 2. `src/components/ProtectedRoute.tsx`

- Change the fallback redirect back from `/landing` to `/auth`, since mobile users are now blocked before they ever reach `ProtectedRoute`. This keeps desktop unauthenticated users going to the login page, not the landing page.

```tsx
// Before
return <Navigate to="/landing" state={{ from: location }} replace />;

// After
return <Navigate to="/auth" state={{ from: location }} replace />;
```

### What this does NOT change
- All desktop routing — completely untouched
- The Landing page component itself — no changes
- All other pages and components
- Database / RLS — no changes
- The `/landing` route can be removed from `<Routes>` since the gate handles it at a higher level; or it can be kept as a no-op for desktop if a direct desktop link to `/landing` should still work (we'll keep it as a safe fallback)
