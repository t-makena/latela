
## Fix: Budget Buddy 401 Unauthorized — Root Cause Found

### What is Actually Happening

The edge function logs show it boots successfully but there are zero request-processing logs — meaning the 401 is being returned very early, before any AI call is made. The culprit is on **line 613** of `supabase/functions/chat-financial/index.ts`:

```typescript
const { data: authData, error: authError } = await supabase.auth.getUser(token);
```

`getUser(token)` makes a **network call** to the Supabase auth server to validate the JWT. With the current signing-keys system, this call is failing (returning an auth error), so the function immediately returns 401 before ever reaching the Anthropic API call.

The correct approach (as specified in the project's own Supabase guidelines) is to use `getClaims(token)`, which validates the JWT **locally** using the signing keys without a network roundtrip.

### The Fix — One Change in the Edge Function

**`supabase/functions/chat-financial/index.ts` (lines 612-618)**

Replace `getUser()` with `getClaims()`:

```typescript
// BEFORE (broken)
const token = authHeader.replace('Bearer ', '');
const { data: authData, error: authError } = await supabase.auth.getUser(token);
if (authError || !authData.user) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
const userId = authData.user.id;

// AFTER (fixed)
const token = authHeader.replace('Bearer ', '');
const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
if (claimsError || !claimsData?.claims) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
const userId = claimsData.claims.sub;
```

`getClaims()` reads the user ID directly from the JWT payload (`sub` field) without a network call — so it is faster, more reliable, and compatible with Lovable Cloud's signing-key authentication.

### After the Code Change

The edge function will be immediately redeployed.

### What is NOT Changing

- The Anthropic model (`claude-3-5-sonnet-20241022`) — already correct
- All tool logic, system prompt, data fetching — unchanged  
- All other pages and edge functions — unchanged
- The `ANTHROPIC_API_KEY` secret — already configured and correct
