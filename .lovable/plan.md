

## Expand Budget Buddy's Agentic Capabilities

### Overview

Add new tools to the `chat-financial` edge function so Budget Buddy can perform nearly any user action, and update the client to handle the new action events for UI refresh.

### New Tools to Add (Edge Function)

The following tools will be added to `supabase/functions/chat-financial/index.ts`:

| Tool | Description | DB Table / Column |
|------|-------------|-------------------|
| `update_budget_method` | Switch between `zero_based` and `percentage_based` | `user_settings.budget_method` |
| `update_budget_percentages` | Change needs/wants/savings split (must sum to 100) | `user_settings.needs_percentage`, etc. |
| `update_payday` | Change payday date (1-31) | `user_settings.payday_date` |
| `update_income_frequency` | Change income frequency | `user_settings.income_frequency` |
| `delete_account` | Delete an account by name (with confirmation) | `accounts` table |
| `list_accounts` | List all accounts with balances | `accounts` table |
| `update_goal` | Update a goal's target, name, or current saved amount | `goals` table |
| `update_budget_item` | Update a budget item's amount, frequency, or name | `budget_items` table |
| `delete_calendar_event` | Delete a calendar event by name | `calendar_events` table |
| `list_calendar_events` | List upcoming calendar events | `calendar_events` table |
| `update_calendar_event` | Update a calendar event's date, amount, or name | `calendar_events` table |
| `get_spending_summary` | Get spending breakdown by category for a date range | `transactions` table |
| `update_profile` | Update display name, first/last name, bio, etc. (NOT username) | `user_settings` table |
| `update_notifications` | Toggle notification preferences | `user_settings` table |

### Explicitly Blocked Actions (in System Prompt)

The system prompt will explicitly instruct the AI to **refuse** requests to:
- Change password
- Change username
- Add a new bank account (direct user to the app)

### File Changes

**1. `supabase/functions/chat-financial/index.ts`**

- Add 14 new tool definitions to the `tools` array
- Add 14 new cases to the `executeTool` switch statement
- Update the system prompt to mention the new capabilities and the blocked actions
- Input validation on all tools (e.g., percentages must sum to 100, payday 1-31)

**2. `src/pages/Chat.tsx`**

- Add query invalidation for new action types:
  - `settings` actions invalidate `['user-settings']`
  - `account` actions invalidate `['accounts']`
  - `profile` actions invalidate `['user-profile']`

### Tool Implementation Details

**update_budget_method**
- Input: `{ method: "zero_based" | "percentage_based" }`
- Executes: `UPDATE user_settings SET budget_method = $method WHERE user_id = $userId`

**update_budget_percentages**
- Input: `{ needs: number, wants: number, savings: number }`
- Validates sum equals 100
- Executes: `UPDATE user_settings SET needs_percentage, wants_percentage, savings_percentage`

**update_payday**
- Input: `{ day: number }` (1-31)
- Executes: `UPDATE user_settings SET payday_date = $day`

**update_income_frequency**
- Input: `{ frequency: "monthly" | "bi-weekly" | "weekly" }`
- Executes: `UPDATE user_settings SET income_frequency = $frequency`

**delete_account**
- Input: `{ name: string }`
- Finds account by name (ilike match), deletes associated transactions first, then the account
- Returns confirmation with account name and balance

**list_accounts**
- No input
- Returns all accounts with name, type, bank, balance

**update_goal**
- Input: `{ name: string, new_name?: string, target?: number, current_saved?: number }`
- Finds by name, updates provided fields

**update_budget_item**
- Input: `{ name: string, new_name?: string, amount?: number, frequency?: string }`
- Finds by name, updates provided fields

**delete_calendar_event**
- Input: `{ name: string }`
- Finds by event_name (ilike), deletes

**list_calendar_events**
- No input, returns upcoming events

**update_calendar_event**
- Input: `{ name: string, new_name?: string, event_date?: string, budgeted_amount?: number }`
- Finds by name, updates provided fields

**get_spending_summary**
- Input: `{ days?: number }` (default 30)
- Aggregates transaction amounts grouped by category for the period

**update_profile**
- Input: `{ display_name?: string, first_name?: string, last_name?: string, bio?: string }`
- Updates user_settings fields (NOT username, NOT email)

**update_notifications**
- Input: `{ notifications_enabled?: boolean, email_notifications?: boolean, push_notifications?: boolean }`
- Updates user_settings notification preferences

### Security Considerations

- All operations use the authenticated Supabase client (user's JWT), so RLS policies enforce access control
- Account deletion cascades through transactions via the existing trigger
- Username and password changes are explicitly blocked in the system prompt and have no corresponding tools
- Input validation prevents invalid values (e.g., negative amounts, invalid dates)

