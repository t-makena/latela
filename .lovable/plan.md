
## Diagnose the 401: Add Logging to the Edge Function

### What We Know So Far

- The JWT decoding logic was added and looks structurally correct
- The curl test (which uses the logged-in user's real session token) still returns 401
- The edge function logs show **nothing** — because the `catch` block on line 622 silently swallows the error without logging it
- We cannot see the real failure reason

### The Problem

The `catch` block that wraps the JWT decoding has no logging:

```typescript
// Line 622 — currently silent
} catch {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 ... });
}
```

Without knowing what exception is thrown, we cannot diagnose why the JWT decoding is failing.

### The Fix — Two Changes in One Deploy

**1. Add detailed logging inside the catch block** so Supabase logs show exactly what went wrong:

```typescript
} catch (e) {
  console.error('JWT decode failed:', e?.message, 'Token length:', token?.length, 'Token prefix:', token?.slice(0, 20));
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, ... });
}
```

**2. Also add a log at the very start of request processing** so we can confirm the function is receiving the request:

```typescript
console.log('chat-financial invoked, method:', req.method, 'has-auth:', !!authHeader);
```

**3. Additionally add logging before the Anthropic API call** to confirm the model name is being sent correctly:

```typescript
console.log('Calling Anthropic with model:', 'claude-sonnet-4-5-20250929');
```

### Why This Will Work

After deploying, the next chat attempt will produce visible logs in the Supabase dashboard showing exactly which line is failing and why (e.g., `atob` not available in Deno, token format mismatch, JSON parse error, etc.). We can then make the targeted fix.

### What Will Be Changed

- `supabase/functions/chat-financial/index.ts` — add three `console.log`/`console.error` calls at key points
- Redeploy immediately after

### What Will NOT Change

- Authentication logic structure — unchanged
- Model name — unchanged
- All tools and system prompt — unchanged
