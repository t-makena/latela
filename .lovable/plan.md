

## Budget Buddy UI Updates

### Changes across two files

**File 1: `src/pages/Chat.tsx` (Full-page chat)**

1. **Description**: Change "Your AI financial advisor" (line 373) to "Your AI financial assistant"
2. **Remove emoji**: Change "Hey! I'm Budget Buddy &wave;" (line 385) to "Hey! I'm Budget Buddy"
3. **Replace icon**: Change the `MessageSquare` icon in the empty state circle (line 382) to `Sparkles` with `fill="currentColor" strokeWidth={1.5}` to match the brand spec. Add `Sparkles` to imports (line 9) and remove `MessageSquare` from imports if no longer used elsewhere -- but it is still used in the sidebar (line 338), so keep it.

**File 2: `src/components/chat/FloatingChat.tsx` (Floating mini-chat)**

4. **Description**: Change "AI financial advisor" (line 264) to "Your AI financial assistant"
5. **Remove emoji**: Change "Hey! I'm Budget Buddy &wave;" (line 288) to "Hey! I'm Budget Buddy"
6. **Remove redundant MessageSquare button**: Delete the `MessageSquare` button block (lines 268-270) -- the new conversation button next to minimize and close. Remove `MessageSquare` from the import (line 10) since it's no longer used in this file.
7. **Auto-clear fix**: The existing 5-minute inactivity timer (lines 37-45) already calls `handleNewConversation()`. However, `handleNewConversation` is referenced inside the `useEffect` but not listed in its dependency array, and `lastActivityRef` is not reset when a new conversation loads. Will ensure the timer resets `lastActivityRef` on conversation load (line 89) so the 5-minute countdown restarts properly when reopening or loading a conversation.

### Summary of icon changes
- Full-page Chat empty state: `MessageSquare` replaced with `Sparkles` (filled, 1.5 stroke)
- Floating Chat empty state: Already uses `Sparkles` -- no change needed
- Floating Chat header: Remove the `MessageSquare` new-conversation button (keep only minimize and close)
