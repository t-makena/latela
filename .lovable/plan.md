

## Add "Update Statement" Button to Account Insight Card

### Changes

**`src/components/financial-insight/FinancialInsightContent.tsx`** (line 451):
- Change the `<CardHeader>` to use `flex flex-row items-center justify-between` layout
- Add a button with an upload icon (e.g., `Upload` from lucide-react) in the top-right corner
- Add local state `uploadDialogOpen` to control the `StatementUploadDialog`
- Import and render `StatementUploadDialog` triggered by the button

**`src/components/accounts/MobileBudgetInsightCard.tsx`** (line 148-151):
- Same approach: add an upload button next to the heading
- Import and render `StatementUploadDialog`

### Technical detail

The button will open the existing `StatementUploadDialog` component. On success, the page reloads to reflect new data (`window.location.reload()`). The button will use `variant="outline"` and `size="sm"` with the `Upload` icon for a clean, non-intrusive look.

