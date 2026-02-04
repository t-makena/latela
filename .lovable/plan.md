

## Auto-Detect & Auto-Add Debit Orders to Budget

### Overview

A proactive approach where the system automatically detects recurring debit orders from transaction history and adds them directly to the budget plan. Users can remove any incorrect items using the existing delete functionality.

---

### Simplified Flow

```text
Upload Statement → Transactions Parsed → Detection Runs → Budget Items Created
                                                              ↓
                                            User sees new items in Budget Plan
                                            User deletes any incorrect ones
```

No review step needed - the system acts proactively.

---

### Detection Criteria (Unchanged)

A transaction is flagged as a **recurring debit order** if:

| Condition | Criteria |
|-----------|----------|
| **Exact Amount Match** | Same merchant + exact same amount + 2+ occurrences across months |
| **Monthly Merchant** | Same merchant + appears once per month + 2+ months |
| **Explicit Keyword** | Description contains "DEBIT ORDER", "D/O", or "DEBIT ORD" |

**Excluded**: Varying amounts or multiple times per month (Betway, data top-ups)

---

### Technical Implementation

#### Database Changes

Add a column to `budget_items` to track auto-detected items:

```text
ALTER TABLE budget_items ADD COLUMN:
  - auto_detected (BOOLEAN, default false)
  - source_merchant_pattern (TEXT, nullable) - for deduplication
```

This allows:
- Showing a badge like "Auto-detected" in the UI
- Preventing duplicate detection on subsequent runs
- Easy filtering if needed

#### Edge Function: detect-recurring-transactions

```text
detect-recurring-transactions
├── Input: { user_id } (from auth JWT)
├── Process:
│   1. Query transactions (last 3-6 months)
│   2. Normalize merchant names
│   3. Group by merchant
│   4. Apply detection rules:
│      - Exact amount match (2+ same amount)
│      - Monthly merchant (once per month, 2+ months)
│      - Explicit keyword (DEBIT ORDER, D/O)
│   5. Check existing budget_items to avoid duplicates
│   6. INSERT new budget_items directly (auto_detected = true)
├── Output: { added: number, skipped: number, items: [...] }
```

#### Duplicate Prevention

Before inserting, check if:
- A budget_item with same `source_merchant_pattern` already exists
- A budget_item with similar name already exists (fuzzy match)

```text
// Skip if already exists
SELECT * FROM budget_items 
WHERE user_id = ? 
AND (source_merchant_pattern = ? OR LOWER(name) LIKE ?)
```

#### Trigger Points

The detection runs automatically after:
1. **Statement upload** - When `parse-statement` completes
2. **Manual trigger** - Button on Budget page: "Scan for Debit Orders"

#### Integration with parse-statement

Modify the existing `parse-statement` edge function to call detection:

```text
// At end of parse-statement, after transactions inserted:
await supabase.functions.invoke('detect-recurring-transactions', {
  body: { lookbackMonths: 3 }
});
```

---

### UI Changes

#### Budget Items Table

Add visual indicator for auto-detected items:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Category/Merchant │ Frequency │ Amount │ Monthly │ Spent │      │
├──────────────────────────────────────────────────────────────────┤
│ Rent              │ Monthly   │ R5,000 │ R5,000  │ R5,000│ [🗑] │
│ CLAUDE 🔄         │ Monthly   │ R350   │ R350    │ R350  │ [🗑] │
│ GODADDY 🔄        │ Monthly   │ R178   │ R178    │ R0    │ [🗑] │
└──────────────────────────────────────────────────────────────────┘
                    🔄 = Auto-detected debit order
```

#### Optional: Toast Notification

After statement upload, show:
```text
"✓ Statement uploaded. Added 2 detected debit orders to your budget."
```

#### Scan Button (Optional)

Add a button to manually trigger detection:
```text
┌─────────────────────────────────────────────────────┐
│ Budget Plan                              [+] [🔄]  │
└─────────────────────────────────────────────────────┘
                                            ↑
                                   "Scan for Debit Orders"
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| New migration | Create | Add `auto_detected` and `source_merchant_pattern` to `budget_items` |
| `supabase/functions/detect-recurring-transactions/index.ts` | Create | Detection + auto-insert logic |
| `supabase/functions/parse-statement/index.ts` | Modify | Call detection after parsing |
| `src/hooks/useBudgetItems.ts` | Modify | Include `auto_detected` in queries |
| `src/components/dashboard/BudgetItemsCard.tsx` | Modify | Show auto-detected badge |
| `src/integrations/supabase/types.ts` | Auto-update | Will reflect new columns |

---

### Detection Function Logic

```text
async function detectAndAddRecurring(userId: string):
  
  // 1. Get transactions (last 3 months)
  transactions = await getTransactions(userId, months=3)
  
  // 2. Get existing budget items (for dedup)
  existingItems = await getBudgetItems(userId)
  existingPatterns = existingItems.map(i => i.source_merchant_pattern)
  
  // 3. Normalize and group
  groups = groupByMerchant(normalize(transactions))
  
  // 4. Detect patterns
  detected = []
  for group in groups:
    
    // Skip if already in budget
    if existingPatterns.includes(group.pattern):
      continue
    
    // Check explicit keyword
    if group.hasKeyword('DEBIT ORDER', 'D/O'):
      detected.push({ ...group, type: 'keyword' })
      continue
    
    // Check exact amount match
    if group.uniqueAmounts.length == 1 && group.count >= 2:
      detected.push({ ...group, type: 'exact_amount' })
      continue
    
    // Check monthly merchant
    if group.avgPerMonth == 1 && group.monthsPresent >= 2:
      if group.amountVariance < 0.15:
        detected.push({ ...group, type: 'monthly' })
  
  // 5. Insert into budget_items
  for item in detected:
    await supabase.from('budget_items').insert({
      user_id: userId,
      name: item.displayName,
      frequency: 'Monthly',
      amount: item.averageAmount,
      auto_detected: true,
      source_merchant_pattern: item.pattern
    })
  
  return { added: detected.length }
```

---

### Merchant Normalization Examples

| Raw Description | Normalized Pattern | Display Name |
|-----------------|-------------------|--------------|
| `CLAUDE PAYSHAP PAYMENT` | `CLAUDE` | Claude |
| `GODADDY RENEWAL 123456` | `GODADDY` | GoDaddy |
| `DISCOVERY D/O PREMIUM` | `DISCOVERY` | Discovery |
| `NETFLIX.COM 8888888888` | `NETFLIX` | Netflix |
| `DSTV SUBSCRIPTION FEE` | `DSTV` | DStv |

---

### Expected Results

After uploading 2+ months of statements:

| Merchant | Pattern | Auto-Added? | Reason |
|----------|---------|-------------|--------|
| CLAUDE R350 (once per month) | Monthly merchant | Yes | Once per month, consistent |
| GODADDY R178.25 (once per month) | Monthly merchant | Yes | Once per month |
| DISCOVERY D/O R1200 | Keyword | Yes | Contains "D/O" |
| BETWAY R10, R50, R1000 | - | No | Varying amounts, multiple per month |
| PREPAID MOBILE R5, R10 | - | No | Varying amounts |

---

### User Experience

1. User uploads bank statement
2. Transactions are parsed and categorized
3. System automatically detects CLAUDE, GODADDY as debit orders
4. Budget Items table shows new entries with 🔄 badge
5. Toast: "Added 2 detected debit orders to your budget"
6. If incorrect, user clicks trash icon to remove

No extra clicks needed - the system is proactive.

