

## Fix: Username Check Constraint Violation on Signup

### Problem
Signup fails with a 500 database error because the `username` metadata sent during signup is `"FirstName LastName"` (contains a space), which violates the `valid_username` check constraint that only allows letters, numbers, and underscores.

### Solution
Update the `handle_new_user` database trigger to sanitize the username before inserting -- replace spaces with underscores and strip any other invalid characters. This way the trigger handles whatever metadata is passed without breaking.

### Changes

**1. Database migration -- update `handle_new_user` function**

Modify the trigger to sanitize the username:
- Replace spaces with underscores (`Tumiso Makena` becomes `Tumiso_Makena`)
- Strip any characters that don't match `[a-zA-Z0-9_]`
- Ensure the result starts with a letter and is 3-30 characters
- If sanitization produces an invalid username, set it to `NULL` (the constraint allows NULL)

```sql
-- Key change in the trigger:
v_username := regexp_replace(
  regexp_replace(COALESCE(v_username, ''), '\s+', '_', 'g'),
  '[^a-zA-Z0-9_]', '', 'g'
);

-- If result is too short or doesn't start with a letter, set NULL
IF v_username = '' OR length(v_username) < 3 OR v_username !~ '^[a-zA-Z]' THEN
  v_username := NULL;
END IF;
```

No frontend changes needed -- the signup form code is fine as-is.

### Technical Details

The full updated `handle_new_user` function will:
1. Read `username`, `first_name`, `last_name` from metadata (same as now)
2. Sanitize the username to comply with `valid_username` constraint
3. Parse first/last name from username if not provided directly (same as now)
4. Fall back to email prefix if no name available (same as now)
5. Insert into `user_settings` without violating the constraint

