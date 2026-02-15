

## Fix: Google Sheets Export Producing Empty Results

### Root Cause

The current `openInGoogleSheets()` function does two disconnected things:
1. Downloads a CSV file to the user's computer
2. Opens `https://sheets.google.com/create` (a blank sheet)

These are completely separate actions — the CSV never gets into the sheet. The user sees an empty spreadsheet.

### Solution

Replace the approach with a **single action** that opens Google Sheets with the data pre-loaded using a `data:` URI passed to Google Sheets' CSV import URL:

```
https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv
```

Unfortunately Google Sheets doesn't support importing from `blob:` or `data:` URIs directly. The most reliable approach that works without a backend is:

**Option: Copy CSV to clipboard + open blank sheet with instructions**

Instead of silently downloading a CSV and opening a blank sheet, change the flow to:
1. Copy the CSV data to the user's clipboard
2. Open a blank Google Sheet
3. Show a toast: "Data copied to clipboard — paste it into the sheet (Ctrl+V)"

This is a much better UX than the current silent CSV download.

### File Change: `src/lib/exportUtils.ts`

Update `openInGoogleSheets()`:

```typescript
export const openInGoogleSheets = async (data: Record<string, unknown>[], headers?: string[]) => {
  if (data.length === 0) return;
  
  // Build tab-separated values (pastes correctly into Sheets)
  const keys = headers || Object.keys(data[0]);
  const headerRow = keys.join('\t');
  const rows = data.map(row =>
    keys.map(key => {
      const value = row[key];
      return value === null || value === undefined ? '' : String(value);
    }).join('\t')
  );
  const tsv = [headerRow, ...rows].join('\n');

  try {
    await navigator.clipboard.writeText(tsv);
  } catch {
    // Fallback: download CSV instead
    downloadFile(arrayToCSV(data, headers), 'latela-export.csv', 'text/csv;charset=utf-8;');
  }

  window.open('https://sheets.google.com/create', '_blank');
};
```

### File Change: `src/pages/Reports.tsx`

Update the toast message for the `sheets` export case:

```typescript
case "sheets":
  await openInGoogleSheets(data);
  toast.success("Data copied to clipboard — paste it into the Google Sheet (Ctrl+V)");
  break;
```

Also update `openInGoogleSheets` call to be awaited (it's now async).

### Summary

| File | Change |
|------|--------|
| `src/lib/exportUtils.ts` | Rewrite `openInGoogleSheets` to copy TSV to clipboard instead of downloading CSV; make it async |
| `src/pages/Reports.tsx` | Await the call; update toast message to instruct user to paste |

