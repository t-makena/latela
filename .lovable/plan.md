

## Align Header Dividers and Add Glass Effect to Floating Chat

### 1. Align the header divider lines (Chat.tsx)

The "Chat History" sidebar header and "Budget Buddy / Your AI financial advisor" main header both use `p-3` padding and `border-b`, but the sidebar header height differs due to its button row. To align the bottom border lines visually:

- Make both headers use the same fixed height (e.g., `h-14`) so their bottom borders sit at the same vertical position regardless of content differences.

**File: `src/pages/Chat.tsx`**
- Line 298: Add `h-14 items-center` to the sidebar header div
- Line 352: Add `h-14 items-center` to the main chat header div

### 2. Glassmorphism for FloatingChat (FloatingChat.tsx)

Update the floating chat container to use the same glass effect as the full Chat page.

**File: `src/components/chat/FloatingChat.tsx`**
- Line 236: Change `bg-background/95 backdrop-blur-xl` to `bg-background/60 backdrop-blur-xl` to match the transparency level of the full chat page
- Line 244: The header already has `bg-background/50 backdrop-blur-sm` which is consistent
- Line 332: The input area already has `bg-background/50 backdrop-blur-sm` which is consistent

### Summary

| File | Line | Change |
|---|---|---|
| `src/pages/Chat.tsx` | 298 | Add fixed height to sidebar header |
| `src/pages/Chat.tsx` | 352 | Add matching fixed height to main header |
| `src/components/chat/FloatingChat.tsx` | 236 | Change `bg-background/95` to `bg-background/60` |

