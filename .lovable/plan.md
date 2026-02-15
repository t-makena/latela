

## Auto-populate Profile Name from Auth Metadata

### The Problem

When you signed up, you provided "Tumišo Makena" as your username in the auth metadata. However, nothing copies that into your `user_settings` table's `first_name` and `last_name` columns -- they remain empty.

### The Fix

Two changes are needed:

**1. Database trigger (new users going forward)**

Create a trigger on `auth.users` that, when a new user signs up, automatically populates the `user_settings` row with `first_name` and `last_name` parsed from the `username` metadata field (or email as fallback).

**2. Backfill your existing profile (one-time fix)**

Update the `useUserProfile` hook so that when it loads a profile with empty `first_name`/`last_name`, it checks the auth user metadata for a name and writes it back to `user_settings`. This handles your existing account without needing a manual SQL update.

### Technical Details

| Change | File |
|--------|------|
| Database migration | New trigger `handle_new_user_settings` on `auth.users` AFTER INSERT -- parses `raw_user_meta_data->>'username'` into first/last name and inserts into `user_settings` |
| Frontend backfill | `src/hooks/useUserProfile.ts` -- in `fetchProfile`, if `first_name` is empty and auth metadata has a username, call `updateProfile` to save parsed name |

**Trigger logic:**
- Takes `raw_user_meta_data->>'username'` (e.g. "Tumišo Makena")
- Splits on space: first word = `first_name`, rest = `last_name`
- Falls back to email prefix if no username metadata exists

**Frontend backfill logic (in `fetchProfile`):**
- After fetching the profile, check if `first_name` is null/empty
- If so, read the auth user's `user_metadata.username`
- Split it into first/last name and call `updateProfile` to persist
- This runs once and self-heals -- next load the data is already there

