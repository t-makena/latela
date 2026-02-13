

## Floating Budget Buddy Mini-Chat

### Overview
Add a persistent, floating Budget Buddy chat panel that launches when users long-press the Sparkles icon in the navigation. The panel sits at the bottom of the screen as an overlay, allowing users to chat while viewing any page. It persists across route changes.

### Architecture

The floating chat will live at the App level (above routes) so it survives navigation. A React context will manage the open/close state, accessible from the Navbar for the long-press trigger.

### New Files

**1. `src/contexts/FloatingChatContext.tsx`**
- Context with `isOpen`, `open()`, `close()`, `toggle()` state
- Provider wraps the app at the same level as other providers

**2. `src/components/chat/FloatingChat.tsx`**
- A fixed-position panel at the bottom of the screen (`fixed bottom-0 right-0 left-0 md:left-auto md:right-4 md:bottom-4 md:w-[420px]`)
- Contains a simplified version of the Chat page logic: message list, input, streaming, conversation persistence
- Header with "Budget Buddy" title, minimize/close buttons
- Glassmorphism styling consistent with the full chat page
- Height: ~60% of viewport on mobile, ~500px on desktop
- Smooth slide-up animation
- No chat history sidebar (keeps it compact); uses the most recent conversation or creates a new one

### Changes to Existing Files

**3. `src/components/layout/Navbar.tsx`**
- Add long-press detection on the Budget Buddy nav item (both mobile and desktop)
- On long-press: call `open()` from FloatingChatContext instead of navigating
- On normal click/tap: navigate to `/chat` as before
- Implementation: `onTouchStart`/`onTouchEnd` with a 500ms timer for mobile; `onMouseDown`/`onMouseUp` for desktop

**4. `src/App.tsx`**
- Wrap with `FloatingChatProvider`
- Render `<FloatingChat />` inside the BrowserRouter (so it persists across routes) but outside `<Routes>`

**5. `src/components/layout/Layout.tsx`**
- No changes needed; the floating chat is positioned fixed and overlays everything

### Technical Details

**Long-press detection:**
```typescript
// Custom hook: useOnLongPress(callback, delay = 500)
// Sets a timeout on pointer down, clears on pointer up/leave
// If timeout fires, calls callback and sets a flag to prevent the click/navigation
```

**Floating chat panel behavior:**
- Opens with a slide-up animation (translate-y transition)
- Closes with slide-down
- On mobile: full-width at bottom, ~60vh height
- On desktop: 420px wide, anchored bottom-right, ~500px height
- Uses the same streaming logic and edge function (`chat-financial`) as the full Chat page
- Shares conversation data via Supabase (same tables), so conversations started in the floating chat appear in the full chat page too
- When on the `/chat` route, the floating chat auto-closes (no need for both)

**State persistence across navigation:**
- The FloatingChatContext and FloatingChat component live above the router's `<Routes>`, so they are never unmounted during navigation
- Message state is held in the FloatingChat component's local state
