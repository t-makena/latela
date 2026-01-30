

## Smarter Transaction Categorization

### Problem Summary
The current categorization logic doesn't handle several common transaction patterns correctly:

1. **YOCO payments** - Treated as vendor payments but vendor type unclear
2. **PayShap with service names** (like "Claude") - Should be Bills & Subscriptions
3. **PayShap with person names** - Should be Assistance/Lending (money sent to people)
4. **Non-salary income** (transfers in, PayShap from) - Should be Other Income
5. **Fuel stations** (BP, Sasol) - Should be Transportation & Fuel

### Database Categories (Reference)

| Category | Parent | ID |
|----------|--------|-----|
| Transportation & Fuel | Necessities | `10235bed-...` |
| Bills & Subscriptions | Necessities | `af6ce140-...` |
| Fees | Necessities | `04c66707-...` |
| Food & Groceries | Necessities | `0b2596ef-...` |
| Assistance/Lending | Discretionary | `408395e2-...` |
| Dining & Restaurants | Discretionary | `98a43caa-...` |
| Other Income | Income | `0a29792e-...` |
| Salary & Wages | Income | `f055c472-...` |

---

### Technical Changes

#### File 1: `src/lib/transactionCategories.ts`

Add these keyword mappings:

```text
// Transportation & Fuel - add fuel station brands
'bp': 'Transportation & Fuel',
'caltex': 'Transportation & Fuel',
'sasol': 'Transportation & Fuel',
'total': 'Transportation & Fuel',
'astron': 'Transportation & Fuel',

// Bills & Subscriptions - add known services
'claude': 'Bills & Subscriptions',
'chatgpt': 'Bills & Subscriptions',
'openai': 'Bills & Subscriptions',
'amazon prime': 'Bills & Subscriptions',
'youtube': 'Bills & Subscriptions',
'apple': 'Bills & Subscriptions',
'google': 'Bills & Subscriptions',
'microsoft': 'Bills & Subscriptions',

// Fees category
'fee:': 'Fees',
'cash withdrawal fee': 'Fees',

// Airtime/Mobile
'prepaid mobile': 'Bills & Subscriptions',
'voda': 'Bills & Subscriptions',
'mtn': 'Bills & Subscriptions',
'telkom': 'Bills & Subscriptions',
```

---

#### File 2: `supabase/functions/categorize-transactions/index.ts`

**Add pre-AI smart detection function (~line 145, before AI call):**

```text
function preCategorizeSmart(description: string, amount: number): string | null {
  const desc = description.toUpperCase();
  
  // 1. FEES - Any FEE: prefix or withdrawal fee
  if (desc.includes('FEE:') || desc.includes('WITHDRAWAL FEE')) {
    return 'Fees';
  }
  
  // 2. TRANSPORTATION - Fuel stations
  const fuelKeywords = ['BP ', 'C*BP', 'SHELL', 'ENGEN', 'SASOL', 'CALTEX', 'TOTAL '];
  if (fuelKeywords.some(k => desc.includes(k))) {
    return 'Transport';
  }
  
  // 3. INCOME DETECTION - Positive amounts or PAYMENT FROM
  if (amount > 0) {
    if (desc.includes('SALARY') || desc.includes('WAGES')) {
      return 'Salary';
    }
    // All other incoming money = Other Income
    return 'Other Income';
  }
  
  // 4. BILLS & SUBSCRIPTIONS - Known services via PayShap
  const subscriptionKeywords = ['CLAUDE', 'CHATGPT', 'NETFLIX', 'SPOTIFY', 'DSTV', 'OPENAI'];
  if (desc.includes('PAYSHAP') && subscriptionKeywords.some(k => desc.includes(k))) {
    return 'Bills';
  }
  
  // 5. ASSISTANCE/LENDING - PayShap TO a person (outgoing)
  if (desc.includes('PAYSHAP') && desc.includes(' TO') && amount < 0) {
    return 'Assistance';
  }
  
  // 6. YOCO payments - These are vendor payments, let AI determine type
  // (Could be food, retail, services)
  
  return null; // Let AI handle
}
```

**Update AI prompt (~line 406):**

```text
Categories: Groceries, Transport, Entertainment, Utilities, Healthcare, Shopping, Dining, Bills, Assistance, Fees, Salary, Other Income, Other

Rules:
- BP, Shell, Engen, Sasol, Caltex = Transport (fuel stations)
- Netflix, Spotify, DSTV, subscriptions = Bills
- YOCO * = vendor payment, categorize by likely vendor type (food vendor, retail, etc.)
- Money paid to individuals = Assistance (unless it's a known business)
- FEE: or withdrawal fee = Fees
```

**Update AI_TO_DB_CATEGORY_MAP (~line 456):**

Add these mappings:

```text
'fees': ['Fees', 'Bank Fees'],
'fee': ['Fees', 'Bank Fees'],
'assistance': ['Assistance/Lending', 'Assistance', 'Lending'],
'lending': ['Assistance/Lending', 'Lending'],
'other income': ['Other Income', 'Income', 'Other'],
```

**Integrate pre-categorization (before line 147):**

Before calling AI, check smart detection:

```text
// Before: categoryName = await categorizeMerchantWithAI(...)
// After:
const smartCategory = preCategorizeSmart(transaction.description, transaction.amount);
if (smartCategory) {
  categoryName = smartCategory;
  console.log(`✓ Smart detection: ${merchantName} → ${categoryName}`);
} else {
  categoryName = await categorizeMerchantWithAI(merchantName, transaction.description);
  aiCallsCount++;
}
```

---

### Files Modified

| File | Change |
|------|--------|
| `src/lib/transactionCategories.ts` | Add fuel brands, subscription services, fees keywords |
| `supabase/functions/categorize-transactions/index.ts` | Add smart pre-categorization, update AI prompt, expand mappings |

---

### Expected Results

| Description | Before | After |
|-------------|--------|-------|
| `C*BP RUSLOO` | Uncategorized | Transportation & Fuel |
| `CLAUDE PAYSHAP PAY` | Uncategorized | Bills & Subscriptions |
| `PULE PAYSHAP PAYMENT TO` | Uncategorized | Assistance/Lending |
| `HLONI TICKETS PAYSHAP PAYMENT FROM` (positive) | Uncategorized | Other Income |
| `IB TRANSFER FROM` (positive) | Uncategorized | Other Income |
| `YOCO *ZODWA` | Uncategorized | Dining (AI determines) |
| `YOCO *LIMIT` | Uncategorized | Dining/Shopping (AI determines) |
| `FEE: PAYSHAP PAYMENT` | Uncategorized | Fees |
| `SASOL BOKSBURG` | Uncategorized | Transportation & Fuel |

---

### Benefits

- **Reduces AI costs** - Common patterns detected without calling AI
- **More accurate** - Amount-based income detection is reliable
- **Context-aware** - Uses PayShap direction (TO vs FROM) for categorization
- **User-friendly** - Categories match user expectations

