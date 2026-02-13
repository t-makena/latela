

## Auto-Clear Chat After 5 Minutes of Inactivity

### Overview
After 5 minutes of no user interaction (no typing, no sending messages), the chat terminal automatically clears and starts fresh. The previous conversation is already saved in Supabase, so it remains accessible from the Chat History sidebar on the /chat page. Users can also reopen past conversations from history and continue them.

### How It Works
1. A "last activity" timestamp is tracked, reset on every message send or input change
2. A timer checks every 30 seconds if 5 minutes have elapsed since the last activity
3. If idle for 5+ minutes AND there are messages on screen, the chat clears (sets `conversationId` to `null` and `messages` to `[]`)
4. The conversation is already saved to Supabase, so nothing is lost -- it appears in Chat History

### Changes

#### File: `src/components/chat/FloatingChat.tsx`

**1. Add a `lastActivityRef` (useRef)**
Track the timestamp of the last user interaction without causing re-renders.

**2. Reset activity on user actions**
- In the `send()` function, update `lastActivityRef.current = Date.now()`
- In the `onChange` handler for the input, update `lastActivityRef.current = Date.now()`

**3. Add inactivity timer (useEffect)**
- When the chat is open and has messages, start a `setInterval` (every 30s)
- On each tick, check if `Date.now() - lastActivityRef.current >= 300000` (5 minutes)
- If true, call `handleNewConversation()` to clear the terminal
- Clean up the interval when the chat closes or component unmounts

#### File: `src/pages/Chat.tsx`

**Same pattern applied to the full Chat page:**

**1. Add `lastActivityRef`**

**2. Reset on send and input change**

**3. Add inactivity timer that calls `startNewConversation()` after 5 minutes of idle**

### Summary

| File | Change |
|---|---|
| `src/components/chat/FloatingChat.tsx` | Add `lastActivityRef`, reset on activity, add inactivity timer that clears chat after 5 min |
| `src/pages/Chat.tsx` | Same inactivity auto-clear logic |

Both files already save conversations to Supabase before clearing, so all past chats remain in the history sidebar and can be reopened and continued at any time.

