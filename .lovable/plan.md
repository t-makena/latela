

## Fix Transaction Categorization: Negative Amounts and Miscellaneous Fallback

### Root Cause Analysis

This is a **code logic issue**, not a Lovable platform issue. Two separate bugs:

**Bug 1: Negative expenses categorized as "Other Income"**
- Transactions like "VALUE LOADED TO VIRTUAL CARD" (amount: -R140) and "IB TRANSFER TO" (amount: -R50) are expenses (negative), so they correctly skip the `amount > 0` check in `preCategorizeSmart`
- They fall through to the AI, but the AI prompt does NOT include the amount or its sign
- Without knowing the transaction is negative (an expense), the AI sees "VALUE LOADED" or "TRANSFER" and guesses "Other Income"

**Bug 2: Clear items categorized as "Miscellaneous"**
- "SUPABASE" (a tech SaaS subscription) and "ZUZS PTY LTD" (a business payment) fall through to AI
- The AI returns a category name that doesn't match any entry in `AI_TO_DB_CATEGORY_MAP`, so `resolveCategoryId` falls back to the "Miscellaneous" category

### Planned Changes

**1. `supabase/functions/categorize-transactions/index.ts` -- `preCategorizeSmart` function**

Add new rules before the AI fallback:
- "VALUE LOADED TO VIRTUAL CARD" (negative) = Transfers
- "IB TRANSFER TO" (negative) = Transfers
- "PAYMENT TO" (negative) = Transfers (catch EFT/IB payments to companies)

**2. `supabase/functions/categorize-transactions/index.ts` -- `categorizeMerchantWithAI` prompt**

Pass the amount to the AI so it knows whether the transaction is an expense or income:
- Add `Amount: R-140.00 (expense)` or `Amount: R250.00 (income)` to the prompt
- Add a rule: "Negative amounts are EXPENSES, never classify as Salary or Other Income"
- Add "Transfers" to the category list for inter-account movements
- Add a rule for SaaS/tech companies (Supabase, Vercel, etc.) = Bills

**3. `supabase/functions/categorize-transactions/index.ts` -- `AI_TO_DB_CATEGORY_MAP`**

Add missing mappings so AI responses resolve correctly:
- `'transfer'` and `'transfers'` already exist, but ensure they map correctly
- Add `'technology'` and `'software'` mapping to Bills & Subscriptions

**4. `supabase/functions/categorize-transactions/index.ts` -- `preCategorizeSmart` additions**

Expand smart detection for common South African patterns:
- SaaS keywords: SUPABASE, VERCEL, GITHUB, HEROKU, DIGITAL OCEAN = Bills
- "YOCO *" with negative amount = Shopping (point-of-sale purchase at a small vendor)
- Company payments via "IB PAYMENT TO" = Transfers

### Summary of Smart Rules Added

| Pattern | Current Result | Fixed Result |
|---------|---------------|-------------|
| VALUE LOADED TO VIRTUAL CARD (negative) | Other Income (AI) | Transfers |
| IB TRANSFER TO (negative) | Other Income (AI) | Transfers |
| IB PAYMENT TO (negative) | Miscellaneous (AI) | Transfers |
| SUPABASE (negative) | Miscellaneous (AI) | Bills |
| VERCEL (negative) | Bills | Bills (no change) |
| YOCO *VENDOR (negative) | Miscellaneous/Dining (AI) | Shopping |

### Technical Details

The key fix in `preCategorizeSmart`:
```
// Outgoing transfers and virtual card loads
if (amount < 0 && (desc.includes('VALUE LOADED TO VIRTUAL CARD') || 
    desc.includes('IB TRANSFER TO') || desc.includes('IB PAYMENT TO'))) {
  return 'Transfers';
}

// SaaS / tech subscriptions  
const saasKeywords = ['SUPABASE', 'VERCEL', 'GITHUB', 'HEROKU', 'DIGITAL OCEAN', 'FIREBASE'];
if (saasKeywords.some(k => desc.includes(k))) {
  return 'Bills';
}
```

The key fix in the AI prompt:
```
Amount: R${(Math.abs(amount) / 100).toFixed(2)} (${amount < 0 ? 'expense' : 'income'})

Rules:
- NEGATIVE amounts are EXPENSES - never classify as Salary or Other Income
```

After deploying, previously miscategorized transactions will need re-categorization (reset their `category_id` to null and re-run the function).
