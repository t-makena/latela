

## Update Sign Up Form: Add First/Last Name, Remove ID Field

### What changes

The signup form currently has: Username, Mobile, Email, ID/Passport, Password, Confirm Password.

After this change it will have: **First Name**, **Last Name**, Mobile, Email, Password, Confirm Password.

- The "Username" field is replaced by separate "First Name" and "Last Name" fields
- The "ID/Passport Number" field is completely removed
- The auth metadata sent to Supabase will include `first_name` and `last_name` instead of `username` and `id_passport`
- The `handle_new_user` trigger already supports `first_name` and `last_name` from metadata, so no database changes are needed

### File changed

| File | What changes |
|------|-------------|
| `src/pages/Auth.tsx` | Replace `username` and `idPassport` in signup state with `firstName` and `lastName`. Update form fields, validation, and the `signUp` metadata payload. |

### Technical details

**State change:**
```
// Before
{ username, mobile, email, idPassport, password, confirmPassword }

// After
{ firstName, lastName, mobile, email, password, confirmPassword }
```

**Auth metadata change:**
```
// Before
data: { username: signupData.username, mobile, id_passport }

// After
data: { first_name: signupData.firstName, last_name: signupData.lastName, username: `${firstName} ${lastName}`, mobile }
```

The `username` metadata field is kept as a concatenation of first + last name for backward compatibility with existing code that reads `user_metadata.username` (e.g., the backfill logic in `useUserProfile`).

**Validation:**
- First Name: required, non-empty
- Last Name: required, non-empty
- ID/Passport validation removed entirely

