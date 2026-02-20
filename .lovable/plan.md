
## Fix: Budget Buddy "Failed to get response"

### Root Cause Identified

The analytics show the edge function is returning **401 Unauthorized**, not a 500 AI error. There are two contributing issues:

1. **Redeployment gap**: The edge function logs are completely empty — no logs whatsoever. This strongly suggests the redeployment from the previous fix didn't complete properly, so the function running in production may still be the old version.

2. **Auth token fetch in Chat.tsx**: On line 171 of `Chat.tsx`, the `send` function makes a redundant async `supabase.auth.getSession()` call to get the access token, even though `session` is already available from `useAuth()` at the top of the component. If the session has expired or the async call returns slightly stale/null data, `access_token` is `undefined` and the request sends `Authorization: Bearer undefined`, which the edge function rejects as 401.

### The Fix — Two changes

**Change 1 — `src/pages/Chat.tsx` (line 171)**

Replace the redundant `getSession()` call with the already-available `session` from `useAuth()`:

```tsx
// Before (line 171)
Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,

// After
Authorization: `Bearer ${session?.access_token}`,
```

This removes the async roundtrip and uses the token that is already available and kept fresh by the `AuthContext` listener.

**Change 2 — Redeploy the edge function**

Force a fresh redeployment of `chat-financial` to ensure the model fix (`claude-3-5-sonnet-20241022`) is actually live.

### What is NOT changing

- The edge function logic — only redeploying it
- All other pages — unchanged
- The FloatingChat component already uses `session?.access_token` correctly, so no change needed there
