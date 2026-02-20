
## Fix: Budget Buddy 401 — `getClaims()` Not Available on This Supabase JS Version

### Root Cause (Confirmed)

The direct curl test returns 401. The edge function is deploying and running, but failing at line 613:

```typescript
const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
```

`getClaims()` was added to `@supabase/supabase-js` in **v2.69.0** (released late 2024). The edge function imports:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

The `@2` floating pin on esm.sh is resolving to an older cached version that does **not** have `getClaims`. The method is `undefined` at runtime, so calling it returns an error immediately, triggering the 401 before any AI call is made.

### The Fix — Decode JWT Manually

The solution is to stop using the Supabase client for auth validation entirely, and instead decode the JWT payload directly. A JWT is three base64url-encoded segments separated by dots. The middle segment (payload) contains the `sub` (user ID), `exp` (expiry), and other claims. This is exactly what `getClaims()` does internally — no network call, no library version dependency.

**Change in `supabase/functions/chat-financial/index.ts` (lines 612-620)**:

```typescript
// BEFORE (broken - getClaims not available on @supabase/supabase-js@2 pin)
const token = authHeader.replace('Bearer ', '');
const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
if (claimsError || !claimsData?.claims) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
const userId = claimsData.claims.sub;

// AFTER (fixed - decode JWT payload directly, no library dependency)
const token = authHeader.replace('Bearer ', '');
let userId: string;
try {
  const payloadBase64 = token.split('.')[1];
  if (!payloadBase64) throw new Error('Invalid JWT');
  const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
  if (!payload.sub || (payload.exp && payload.exp < Math.floor(Date.now() / 1000))) {
    throw new Error('Token expired or missing sub');
  }
  userId = payload.sub;
} catch {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

This approach:
- Works on any Supabase JS version (no method dependency)
- Requires zero network calls
- Validates the `sub` claim (user ID) and `exp` (expiry) from the JWT payload
- Is the same technique `getClaims()` uses internally

### After the Code Change

The edge function will be immediately redeployed and tested via curl.

### What is NOT Changing

- The Anthropic model (`claude-3-5-sonnet-20241022`) — already correct
- All tool logic, system prompt, data fetching — unchanged
- All other pages and edge functions — unchanged
- The `ANTHROPIC_API_KEY` secret — already configured and correct
