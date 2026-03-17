

## Plan: C-2, H-10, H-11, H-12

Four tasks across admin auth, analytics, merchant search, and income settings migration.

---

### C-2: useIsAdmin Hook

**Create `src/hooks/useIsAdmin.ts`**
- The `is_current_user_admin` RPC already exists in the database
- Auth context lives in `src/contexts/AuthContext.tsx` (exports `useAuth`), not `src/hooks/useAuth` — will import from the correct location
- Hook calls `supabase.rpc('is_current_user_admin')`, returns `{ isAdmin, isLoading, error }`
- `staleTime: 300000` (5 min), `enabled: !!user`

**Update `src/pages/AdminWaitlist.tsx`**
- Replace the hardcoded `ADMIN_EMAIL` check with `useIsAdmin()`
- Show skeleton while `isLoading`, show access denied if `!isAdmin`
- Remove the `const ADMIN_EMAIL = "info@latela.co.za"` constant and client-side email comparison

**Note**: `src/integrations/supabase/types.ts` is auto-generated and cannot be edited. The `is_admin` field already exists on `profiles` in the DB. The RPC handles it server-side so no type change is needed.

---

### H-10: Wire Analytics Page to Real Supabase Data

**Create `src/hooks/useAnalyticsData.ts`**
- Accepts `{ startDate, endDate }` params
- Parallel `useQuery` calls to 4 existing RPCs: `get_spending_by_category`, `get_monthly_spending_trends`, `get_top_merchants`, `get_daily_spending`
- All amounts returned in cents, divided by 100 for display
- Returns `{ categoryData, monthlyTrends, topMerchants, dailySpending, isLoading }`

**Rewrite `src/pages/Analytics.tsx`**
- Remove mock `monthlySpending` import from `@/lib/data`
- Add date range state with presets (This Month, Last Month, Last 3 Months, Last 6 Months, YTD)
- Add 4 summary cards: Total Spend, Avg Daily Spend, Transaction Count, Top Category
- Wire `SpendingChart` or inline recharts with real data from the hook
- Skeleton loading states, empty state message
- Format with `R` currency prefix (cents / 100)

---

### H-11: Move EditTransactionDialog Fuzzy Matching Server-Side

**Create `src/hooks/useMerchantSearch.ts`**
- Takes `searchTerm` string, uses `useDeferredValue` for debouncing
- Calls `fuzzy_match_merchant` and `search_transaction_descriptions` RPCs in parallel
- Deduplicates results by description, keeps highest similarity score
- Returns `{ suggestions, isSearching }`
- Only queries when `searchTerm.length >= 2`

**Update `src/components/financial-insight/EditTransactionDialog.tsx`**
- The current `updateMatchingTransactions` fetches ALL user transactions client-side and runs `isFuzzyMerchantMatch` on each — this will be replaced
- Add `useMerchantSearch(merchantName)` for suggestions dropdown below Merchant Name input
- Dropdown: absolute positioned, shows merchant name + category + similarity badge
- On suggestion click: auto-fill merchant name and category
- Keep the existing `handleSave` logic (merchant mapping upsert + retroactive update) but the retroactive update should also move to using server-side matching via the DB trigger `apply_user_merchant_mapping` that already exists
- Remove client-side `updateMatchingTransactions` function, rely on the existing DB trigger for future transactions, and use an RPC or simpler server query for retroactive updates

---

### H-12: Migrate useIncomeSettings from localStorage to Supabase

**Rewrite `src/hooks/useIncomeSettings.ts`**
- Remove all `localStorage` reads/writes
- Use `useQuery` to fetch from `get_or_create_user_settings` RPC (already exists)
- Use `useMutation` calling `update_income_settings` RPC (already exists) for saves
- The `user_settings` table already has `income_amount_cents`, `income_frequency`, `payday`, `income_sources` columns
- One-time migration: if Supabase has `income_amount_cents === 0` but localStorage has data, migrate then clear localStorage
- Keep all existing helper functions (`getNextPayday`, `getNthPayday`, `countPayPeriods`, etc.) — they derive from the same state values
- Maintain backward-compatible return interface so consumers (`Settings.tsx`, `Goals.tsx`, `AddGoalDialog.tsx`, `useBudgetScore.ts`) don't break
- Add `isLoading` to return value; consumers should handle loading state

**Update consumers** (4 files):
- `src/pages/Settings.tsx` — update calls to match new async `updateIncomeSettings`
- `src/pages/Goals.tsx`, `src/components/goals/AddGoalDialog.tsx`, `src/hooks/useBudgetScore.ts` — add loading guards where needed

---

### Files Modified

| File | Task |
|------|------|
| `src/hooks/useIsAdmin.ts` (new) | C-2 |
| `src/pages/AdminWaitlist.tsx` | C-2 |
| `src/hooks/useAnalyticsData.ts` (new) | H-10 |
| `src/pages/Analytics.tsx` | H-10 |
| `src/hooks/useMerchantSearch.ts` (new) | H-11 |
| `src/components/financial-insight/EditTransactionDialog.tsx` | H-11 |
| `src/hooks/useIncomeSettings.ts` | H-12 |
| `src/pages/Settings.tsx` | H-12 |
| `src/pages/Goals.tsx` | H-12 |
| `src/components/goals/AddGoalDialog.tsx` | H-12 |
| `src/hooks/useBudgetScore.ts` | H-12 |

No database migrations needed — all required tables, RPCs, and columns already exist.

