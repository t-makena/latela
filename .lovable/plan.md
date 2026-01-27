
## Replace "Balance" with "Available Balance" in Latela Score Card

### Summary
Update the label in the Key Metrics section to display "Available Balance" instead of "Balance" by using the existing translation key.

### Change Required

**File: `src/components/budget/LatelaScoreCard.tsx`**

Line 198 - Update the MetricBox label:

```typescript
// Current:
label={t('finance.balance') || 'Balance'}

// Change to:
label={t('finance.availableBalance') || 'Available Balance'}
```

### Why This Works
- The translation key `finance.availableBalance` already exists in all 11 locale files
- No need to add any new translation keys
- Consistent with terminology used elsewhere in the app (Financial Summary, Accounts page)
