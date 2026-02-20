
## Fix: Budget Buddy Not Responding

### Root Cause

The `chat-financial` edge function is calling Anthropic with the model name `claude-sonnet-4-5-20250929`. This is not a valid Anthropic model identifier — it is a malformed string that blends two different model names:

- `claude-sonnet-4-5` — valid, but very new (may not be available on all accounts)
- `claude-3-5-sonnet-20241022` — valid and widely available

When Anthropic receives an unknown model name it returns a `400` error. The edge function catches this at line 762–767 and returns `{ error: 'AI service error' }` to the client. The FloatingChat component receives a non-OK response, throws inside the `try` block, and the `toast.error` fires briefly — but because the SSE reader never opens, there is no visible feedback beyond the typing indicator disappearing.

### The Fix — One Line Change

In `supabase/functions/chat-financial/index.ts`, change the model string in **both** Anthropic fetch calls (lines ~754 and ~821) from:

```
model: 'claude-sonnet-4-5-20250929',
```

to:

```
model: 'claude-3-5-sonnet-20241022',
```

`claude-3-5-sonnet-20241022` is Claude's most capable stable model, fully available via standard API keys, and supports all tool-use features that Budget Buddy relies on.

### Files to Change

| File | Change |
|---|---|
| `supabase/functions/chat-financial/index.ts` | Fix the model name in two `fetch` calls (lines ~754 and ~821) |

The function will be redeployed immediately after the edit. No other files need to change — the ANTHROPIC_API_KEY secret is already configured correctly.
