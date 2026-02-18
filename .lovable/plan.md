
## Fix Sub-account Page to Match All Accounts Page Layout

### What's Wrong

Comparing the two pages side by side reveals two clear issues in `src/pages/AccountDetail.tsx`:

**Issue 1 — White wrapper/container (Mobile)**
The mobile layout root `div` has `bg-white` hardcoded:
```tsx
// AccountDetail.tsx (wrong)
<div className="min-h-screen bg-white py-6 space-y-5 animate-fade-in">

// Accounts.tsx (correct — no bg colour)
<div className="min-h-screen py-6 space-y-5 animate-fade-in">
```
Removing `bg-white` lets the shared background theme from `BackgroundProvider` show through, matching All Accounts.

**Issue 2 — Redundant bank account card (Desktop)**
The desktop layout in `AccountDetail.tsx` renders `<AccountCard>` (the credit-card-style bank card component) above the insight section:
```tsx
// AccountDetail.tsx (wrong — has extra bank card)
<div className="flex items-center justify-between">
  <AccountCard account={account} />
  <Button ...Re-categorize.../>
</div>
<FinancialInsightContent accountId={accountId} />
```
The All Accounts desktop page renders nothing but `<FinancialInsightContent />`. The sub-account page should do the same — just `<FinancialInsightContent accountId={accountId} />` — with the Re-categorize button moved to be a standalone row above it.

**Issue 3 — Loading skeleton also has `bg-white` (Mobile)**
The mobile loading skeleton also uses `bg-white`, which needs to match as well.

### Changes — `src/pages/AccountDetail.tsx` only

#### Mobile loading skeleton (lines 53-63)
Remove `bg-white` from the loading div:
```tsx
// Before
<div className="min-h-screen bg-white py-6 space-y-5">
// After
<div className="min-h-screen py-6 space-y-5">
```

#### Mobile main layout (lines 103-120)
Remove `bg-white` from the root div AND remove `<MobileAccountCard>` (the mobile card is already shown by `MobileBudgetInsightCard` scoped to the account):
```tsx
// Before
<div className="min-h-screen bg-white py-6 space-y-5 animate-fade-in">
  <MobileAccountCard account={account} />
  <div className="flex justify-end">
    <Button ...Re-categorize.../>
  </div>
  <MobileBudgetInsightCard titleKey="finance.accountInsight" accountId={accountId} />
</div>

// After
<div className="min-h-screen py-6 space-y-5 animate-fade-in">
  <div className="flex justify-end">
    <Button ...Re-categorize.../>
  </div>
  <MobileBudgetInsightCard titleKey="finance.accountInsight" accountId={accountId} />
</div>
```

#### Desktop main layout (lines 124-143)
Remove the `<AccountCard>` block, keep only `FinancialInsightContent` with the Re-categorize button as a small standalone row:
```tsx
// Before
<div className="min-h-screen bg-background px-6 pb-20">
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <AccountCard account={account} />
      <Button ...Re-categorize.../>
    </div>
    <FinancialInsightContent accountId={accountId} />
  </div>
</div>

// After
<div className="min-h-screen pt-6 px-6 pb-20">
  <div className="space-y-6">
    <div className="flex justify-end">
      <Button ...Re-categorize.../>
    </div>
    <FinancialInsightContent accountId={accountId} />
  </div>
</div>
```
Note the desktop container also changes from `bg-background` (explicit colour) to no background, and adds `pt-6` to match `Accounts.tsx` (`min-h-screen pt-6 px-6 pb-20`).

### Imports cleanup
`AccountCard` and `MobileAccountCard` will no longer be used — their imports should be removed from `AccountDetail.tsx`.

### What this does NOT change
- `MobileBudgetInsightCard` props (`titleKey="finance.accountInsight"`, `accountId`) stay exactly as-is — these correctly scope the insight data to the specific account
- `FinancialInsightContent accountId={accountId}` stays as-is
- The Re-categorize button is kept, just repositioned
- No database changes, no other files touched
