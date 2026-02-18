
## Fix: Miscellaneous Overflow from Missing "Transfers" Category & Stale Categorization

### Root Cause Summary

There are two distinct problems causing the Miscellaneous flood:

**Problem 1 - Missing "Transfers" category in the database**

The edge function's `preCategorizeSmart` correctly identifies "VALUE LOADED TO VIRTUAL CARD" and "IB TRANSFER TO" as `'Transfers'`. However, the `resolveCategoryId` function then searches the categories table for a category named "Transfers" — and it doesn't exist. The fallback fires and lands them in Miscellaneous (65 transactions).

**Problem 2 - Already-categorized transactions are never fixed**

The edge function has `IS NULL` filter on `category_id`, meaning once a transaction is in Miscellaneous, it is permanently stuck there. There is no way for corrected logic to re-process them.

### Fix Plan

#### Part A: Add "Transfers" as a proper subcategory in the database

A migration will insert a "Transfers" subcategory under the "Discretionary" parent (same parent as Miscellaneous). This will make `resolveCategoryId('Transfers')` find a real category instead of falling back.

```sql
INSERT INTO categories (name, parent_id, color, description)
VALUES (
  'Transfers',
  (SELECT id FROM categories WHERE name = 'Discretionary' AND parent_id IS NULL LIMIT 1),
  '#64748B',
  'Bank transfers, virtual card loads, inter-account movements'
)
ON CONFLICT DO NOTHING;
```

#### Part B: Bulk re-categorize the stuck Miscellaneous transactions

A second migration will retroactively fix the 65 Miscellaneous transactions that match known "Transfers" patterns (VALUE LOADED TO VIRTUAL CARD, IB TRANSFER TO, IB PAYMENT TO, INSTANTMON, CASH WITHDRAWAL).

```sql
UPDATE transactions
SET 
  category_id = (SELECT id FROM categories WHERE name = 'Transfers' LIMIT 1),
  auto_categorized = true,
  categorization_confidence = 1.0,
  is_categorized = true
WHERE 
  category_id = (SELECT id FROM categories WHERE name = 'Miscellaneous' LIMIT 1)
  AND (
    description ILIKE '%VALUE LOADED TO VIRTUAL CARD%'
    OR description ILIKE '%IB TRANSFER TO%'
    OR description ILIKE '%IB PAYMENT TO%'
    OR description ILIKE '%INSTANT MONEY%'
    OR description ILIKE '%INSTANTMON%'
    OR description ILIKE '%CASH WITHDRAWAL%'
  );
```

#### Part C: Add "Transfers" to the category mapping in code

Update `src/lib/categoryMapping.ts` to add `'Transfers'` to `SUBCATEGORY_NAME_TO_BUDGET_CATEGORY` so the charts map it correctly:

```typescript
'Transfers': 'wants',  // or exclude from budget charts entirely
```

Also update `AI_TO_DB_CATEGORY_MAP` in the edge function to ensure `'transfer'` and `'transfers'` map to the new `'Transfers'` category name (it currently maps to `['Transfers', 'Transfer', 'Bank Transfer']` which will now find a match).

#### Part D: Add Transfers to the detailed chart color map in BudgetBreakdown.tsx

```typescript
"Transfers": "#64748B",  // Slate grey
```

### What this does NOT touch
- No changes to the AI model or prompt
- No changes to `preCategorizeSmart` logic (it already handles this correctly)
- No changes to RLS policies
- Income transactions are unaffected

### Expected Result

| Before | After |
|--------|-------|
| 65 transactions in Miscellaneous | Transfers/virtual card loads in "Transfers" |
| `resolveCategoryId('Transfers')` → Miscellaneous | `resolveCategoryId('Transfers')` → Transfers category |
| Charts show large Miscellaneous slice | Charts show accurate Transfers slice |
| Future transfers still land in Miscellaneous | Future transfers correctly categorized |
