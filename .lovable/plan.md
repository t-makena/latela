
## Root Cause Found: `VITE_SUPABASE_URL` is `undefined`

### What the Logs Showed

Edge function logs: **completely empty** — the function never received the request.

Network request (the smoking gun):
```
POST undefined/functions/v1/chat-financial
Status: 404
```

The URL is literally `undefined/functions/v1/chat-financial`. The request hits a 404 and never reaches Supabase at all — which is why there are no logs, no 401s, nothing.

### Why This Happens

Both `src/pages/Chat.tsx` and `src/components/chat/FloatingChat.tsx` construct the chat URL like this:

```typescript
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-financial`;
```

The `.env` file does not exist in the project, so `import.meta.env.VITE_SUPABASE_URL` evaluates to `undefined` at runtime. All Supabase database calls work fine because `src/integrations/supabase/client.ts` hardcodes the URL directly — but the fetch to the edge function bypasses that.

### The Fix

Replace the raw `fetch` URL construction in both files with `supabase.functions.invoke()`, which uses the already-configured Supabase client and never relies on env vars. This is also the correct pattern per Supabase best practices.

**`src/pages/Chat.tsx`** — remove the `CHAT_URL` constant and replace the fetch block with `supabase.functions.invoke('chat-financial', { body: ..., headers: ... })`. The response is a `ReadableStream` that can be consumed the same way.

**`src/components/chat/FloatingChat.tsx`** — same change.

The cleanest approach is to use `supabase.functions.invoke()` with the streaming option, but since the current code manually reads SSE streams, we can simply replace just the URL with the hardcoded value from `client.ts`:

```typescript
// BEFORE (broken)
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-financial`;

// AFTER (fixed)
const CHAT_URL = `https://sqbcxopovghwgdqplejr.supabase.co/functions/v1/chat-financial`;
```

This is the same URL already hardcoded in `client.ts` and is the correct Supabase project URL.

### What Will Be Changed

- `src/pages/Chat.tsx` — fix `CHAT_URL` constant (line 24)
- `src/components/chat/FloatingChat.tsx` — fix `CHAT_URL` constant (line 23)

### What Will NOT Change

- Edge function code — already correct and deployed
- Authentication logic — already correct
- Model name — already updated to `claude-sonnet-4-5-20250929`
- All other files — unchanged
