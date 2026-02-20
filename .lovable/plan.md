
## Update Budget Buddy Model to claude-sonnet-4-5-20250929

### What's Changing

The `chat-financial` edge function calls the Anthropic API twice with the old model string `claude-3-5-sonnet-20241022`:

- **Line 760** — the non-streaming call (tool execution path)
- **Line 827** — the streaming call (main chat path)

Both will be updated to `claude-sonnet-4-5-20250929`.

### Technical Change

**`supabase/functions/chat-financial/index.ts`**

```typescript
// Line 760 — Before
model: 'claude-3-5-sonnet-20241022',

// Line 760 — After
model: 'claude-sonnet-4-5-20250929',

// Line 827 — Before
model: 'claude-3-5-sonnet-20241022',

// Line 827 — After
model: 'claude-sonnet-4-5-20250929',
```

### After the Change

The edge function will be immediately redeployed so the new model is live in production.

### What is NOT Changing

- Authentication logic (manual JWT decoding) — unchanged
- All tool logic, system prompt, data fetching — unchanged
- All other pages and edge functions — unchanged
- The `ANTHROPIC_API_KEY` secret — already configured and correct
