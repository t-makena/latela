

## Apply Garet Font to Chat Components

Apply `font-garet` class to both chat components so all chatbot text uses the Garet font family.

### Changes

**`src/pages/Chat.tsx`** — Add `font-garet` to the outermost chat container div so all text inside (messages, input, sidebar titles) inherits Garet.

**`src/components/chat/FloatingChat.tsx`** — Same approach: add `font-garet` to the floating chat container div.

This uses the existing `font-garet` utility already defined in `tailwind.config.ts` (`'Garet', sans-serif`).

