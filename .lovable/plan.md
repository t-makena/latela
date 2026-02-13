
## Budget Buddy Chat: 3 Fixes

### 1. Fix sidebar close button on desktop

The close button calls `setSidebarOpen(false)`, but the desktop sidebar rendering ignores `sidebarOpen` -- it always shows `w-72 shrink-0`. Fix: make the desktop sidebar also conditional on `sidebarOpen`, toggling between `w-72` and `w-0 overflow-hidden`.

### 2. Use PanelLeftClose icon for sidebar toggle

Replace the `X` close icon in the sidebar header with `PanelLeftClose` (already imported in Navbar). Also add a `PanelLeftClose` (or menu/open) button in the main header to reopen the sidebar when it's collapsed (on both mobile and desktop).

### 3. Remove the back button

Remove the `ArrowLeft` back button from the chat header entirely. Users navigate via the main navbar.

### Technical Details

**`src/pages/Chat.tsx`:**

- **Sidebar className** (line ~265-270): Change desktop branch from `"w-72 shrink-0"` to check `sidebarOpen`:
  - When open: `"w-72 shrink-0"`
  - When closed: `"w-0 overflow-hidden"`
- **Sidebar close button** (line ~278-280): Replace `X` icon with `PanelLeftClose`
- **Header** (line ~326-338):
  - Remove the `ArrowLeft` back button entirely (lines 332-334)
  - Change the menu button to show on both mobile and desktop when sidebar is closed (remove `isMobile &&` guard), using `PanelLeftClose` rotated or `Menu` icon
- **Imports** (line ~11): Add `PanelLeftClose` to lucide imports, remove `ArrowLeft`
- **Initial state**: Change `sidebarOpen` default to `!isMobile` (already the case)
