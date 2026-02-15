

## Fix: Signup Flow, Profile Data, and Remove Color Palette

### Issue 1: Auto-login after signup

**Problem**: After signing up, the user may be required to confirm their email before they can use the app. The Supabase project likely has email confirmation enabled, which means `signUp()` creates the user but doesn't return an active session until the email is confirmed.

**Fix in `src/pages/Auth.tsx`**:
- After successful signup, check if a session was returned (meaning email confirmation is disabled or auto-confirm is on). If so, navigate to `/` immediately (this already works).
- If no session but a user exists (email confirmation required), show a toast saying "Check your email to confirm your account" instead of navigating away.
- To enable immediate access without email confirmation, disable email confirmation in the Supabase Auth settings (Dashboard > Authentication > Providers > Email > toggle off "Confirm email"). This is the recommended approach for this app.

No code change is needed if email confirmation is disabled in the dashboard -- the existing code already navigates to `/` on successful signup with a session. The `onAuthStateChange` listener also handles this.

### Issue 2: Profile fields showing hardcoded values instead of actual user data

**Problem**: The Settings page Profile card uses hardcoded defaults:
- First Name: `defaultValue="John"` (line 257)
- Last Name: `defaultValue="Doe"` (line 261)
- Email: `useState("john.doe@example.com")` (line 58)
- Mobile: `useState("+27 81 234 5678")` (line 62)

These never read from the `user_settings` table or from the auth user object. The `useUserProfile` hook is imported and used for avatar only, but its data is ignored for name/email/mobile fields.

**Fix in `src/pages/Settings.tsx`**:
- Use the `profile` object from `useUserProfile()` to initialize first name, last name, email, and mobile fields.
- Also read the auth user's email from `useAuth()` as fallback.
- Add state variables for `firstName` and `lastName` initialized from `profile`.
- Wire up the save handlers for email and mobile to actually persist changes to `user_settings` via Supabase (currently they only update local state).
- Use a `useEffect` to populate state once `profile` loads.

**Fix in `src/hooks/useUserProfile.ts`**:
- Add an `updateProfile` method that persists first name, last name, email, and mobile changes to the `user_settings` table.

### Issue 3: Remove Color Palette option from Preferences

**Problem**: The user wants the Color Palette radio group (lines 658-684 in Settings.tsx) removed from the Preferences card.

**Fix in `src/pages/Settings.tsx`**:
- Remove the entire Color Palette section (the `<div className="border-t...">` block containing the RadioGroup for multicolor/blackwhite).
- Remove the `useColorPalette` import and hook call since it's no longer used on this page.

---

### Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/Settings.tsx` | Load profile data into form fields; persist edits to `user_settings`; remove Color Palette section and its import |
| `src/hooks/useUserProfile.ts` | Add `updateProfile()` method for saving name/email/mobile |
| `src/pages/Auth.tsx` | Handle the case where signup succeeds but no session is returned (email confirmation enabled) -- show appropriate message instead of silently failing |

### Technical Details

**Settings.tsx profile loading:**
```tsx
const { user } = useAuth();
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");

useEffect(() => {
  if (profile) {
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setEmail(profile.email || user?.email || "");
    setMobile(profile.mobile || "");
  }
}, [profile]);
```

**Auth.tsx signup session handling:**
```tsx
if (data.user && !data.session) {
  // Email confirmation required
  toast({ title: "Check your email", description: "Please confirm your email to continue" });
} else if (data.session) {
  // Auto-confirmed, go straight in
  navigate("/");
}
```

