

## Seamless Google Sheets Export (No Pasting Required)

### What will happen
When you click the "Sheets" export button, your data will automatically appear in a new Google Spreadsheet -- fully populated, no copying or pasting needed. The first time you use it, Google will ask you to grant permission (one-time only). After that, every export is instant.

### How it works

1. **New Edge Function: `export-to-sheets`**
   - Receives export data (transactions, budget items, or goals) from the app
   - Checks if you've already authorized Google (stored refresh token in `user_settings`)
   - If not authorized: returns a Google authorization URL for you to grant access
   - If authorized: uses the Google Sheets API to create a new spreadsheet, populate it with your data, make it accessible, and return the URL

2. **One-time Google authorization flow**
   - First click on "Sheets" redirects to Google's consent screen
   - After you approve, Google redirects back to the app
   - The app stores your Google refresh token so you never have to authorize again
   - The pending export automatically completes

3. **Every subsequent export**
   - Click "Sheets" -> a new tab opens with your fully populated spreadsheet (2-3 seconds)

### Files to create/modify

| File | What changes |
|------|-------------|
| `supabase/functions/export-to-sheets/index.ts` | New edge function handling OAuth token exchange and Google Sheets API calls |
| `supabase/config.toml` | Add `export-to-sheets` function config |
| `src/lib/exportUtils.ts` | Rewrite `openInGoogleSheets` to call the edge function instead of clipboard |
| `src/pages/Reports.tsx` | Handle the OAuth callback redirect and update toast messages |
| `src/pages/GoogleSheetsCallback.tsx` | New page to handle the Google OAuth redirect |
| `src/App.tsx` | Add route for `/auth/google-sheets/callback` |
| Database migration | Add `google_sheets_refresh_token` column to `user_settings` table |

### Technical details

**Edge Function endpoints:**

- `POST { action: "export", data, headers, title }` -- Creates a spreadsheet and returns `{ url }`. Uses stored refresh token.
- `POST { action: "get-auth-url", redirectUri }` -- Returns `{ authUrl }` for first-time authorization.
- `POST { action: "exchange-code", code, redirectUri }` -- Exchanges the OAuth code for tokens, stores refresh token, returns success.

**OAuth redirect URI:** `https://latela.lovable.app/auth/google-sheets/callback`

**Google API scopes:** `https://www.googleapis.com/auth/spreadsheets` (create and edit sheets only)

**Security:**
- Refresh tokens stored in the `user_settings` table (protected by existing RLS policies -- only the user can read/write their own row)
- Edge function validates JWT authentication before any operation
- Google Client ID and Secret stored as Supabase secrets (already configured)

**Database change:**
- Add `google_sheets_refresh_token TEXT` column to `user_settings` (nullable, default null)

