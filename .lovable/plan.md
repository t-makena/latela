

## Budget Buddy: Icon and Position Update + History Panel Close Button

### Changes

**1. Move Budget Buddy between Budget and Goals, use Sparkles icon**

Based on the reference image, the Budget Buddy nav item should sit between the Budget (Calculator) and Goals (Target) items, using a filled Sparkles icon (per the brand spec: `fill="currentColor"`, `strokeWidth={1.5}`).

In `src/components/layout/Navbar.tsx`:
- Change the import from `MessageSquare` to `Sparkles` (from lucide-react)
- Reorder `navItems` so Budget Buddy appears after Budget and before Goals:
  - Dashboard
  - Budget
  - **Budget Buddy** (moved here)
  - Goals
  - Calendar
  - Settings
- Apply filled styling to the Sparkles icon: `fill="currentColor"` and `strokeWidth={1.5}` -- this requires custom rendering for that specific nav item rather than the generic `<item.icon>` pattern

**2. Add a close/collapse button to the chat history sidebar on desktop**

In `src/pages/Chat.tsx`:
- The sidebar header already has a close button, but only for mobile (`isMobile && <Button ... <X />>`). Remove the mobile-only condition so the close button (X icon or PanelLeftClose) always renders, allowing desktop users to collapse the history panel too.

### Technical Details

**Navbar.tsx edits:**
- Line 4: Replace `MessageSquare` with `Sparkles` in the import
- Lines 77-84: Reorder the array to `[Dashboard, Budget, Budget Buddy, Goals, Calendar, Settings]`
- Lines 189-215: Add special handling for the Sparkles icon to apply `fill="currentColor"` and `strokeWidth={1.5}` props

**Chat.tsx edit:**
- Line ~211: Remove the `isMobile &&` condition wrapping the close button in the sidebar header, so it always shows

