
## Make Names Read-Only and Add Placeholders

### Changes to `src/pages/Settings.tsx`

**1. Make First Name and Last Name read-only (lines 281-308)**
- Add `disabled` prop and `className="bg-muted"` to both name inputs
- Remove the `onChange` and `onBlur` handlers so they cannot be edited

**2. Add "Not provided" placeholder to email and mobile fields**
- Line 325: Add `placeholder="Not provided"` to the disabled email input
- Line 352: Add `placeholder="Not provided"` to the disabled mobile input

No other changes -- the existing edit buttons and Save/Cancel flow remain as-is.
