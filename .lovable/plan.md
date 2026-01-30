
## Intelligent Merchant Name Shortening

### Problem
Transaction descriptions from bank statements are verbose and hard to read. Examples:
- `"FEE: PAYSHAP PAYMENT FEE: PAYSHAP PAYMENT"` → Should display as `"Payshap Fee"`
- `"PNP CRP VOSLO 5222*2822 16 JAN CHEQUE CARD PURCHASE"` → Should be `"PnP Vosloorus"`
- `"MEATEXPRESS 5222*2822 28 JAN CHEQUE CARD PURCHASE"` → Should be `"Meatexpress"`
- `"WOOLWORTHS 5222*2822 24 JAN CHEQUE CARD PURCHASE"` → Should be `"Woolworths"`

### Solution
Create a smart display name extraction function that intelligently shortens and formats merchant names while preserving meaningful context.

---

### Technical Changes

#### File 1: `src/lib/merchantUtils.ts`

**Add a new function `smartDisplayName` that:**

1. **Remove noise patterns:**
   - Card numbers: `5222*2822`, `****1234`
   - Dates: `28 JAN`, `16 JAN`, `2026-01-28`
   - Timestamps: `17H33:45`, `10H31`
   - Transaction types: `CHEQUE CARD PURCHASE`, `PREPAID MOBILE PURCHASE`, `AUTOBANK CASH WITHDRAWAL AT`
   - Reference numbers: `VAS00182812693`, `0000B867`
   - Location codes: `ZAF`, `ZA`

2. **Handle fee transactions specially:**
   - `FEE: PAYSHAP PAYMENT` → `Payshap Fee`
   - `FEE: PREPAID MOBILE PURCHASE` → `Airtime Fee`
   - `CASH WITHDRAWAL FEE` → `ATM Fee`
   - Remove duplicate fee suffixes (`FEE: X FEE: X` → `X Fee`)

3. **Expand known South African abbreviations:**
   - `PNP` → `Pick n Pay`
   - `VOSL` / `VOSLO` → `Vosloorus`
   - `CRP` → remove (corp store indicator)
   - `FAM` → remove (family store indicator)
   - `CHRI` → `Christiana` (or similar)
   - `VC` → remove (store type code)

4. **Brand-specific formatting:**
   - `YOCO *ZODWA` → `Zodwa (via Yoco)`
   - `C*BP RUSLOO` → `BP Ruslof`
   - `DNH*GODADDY.C` → `GoDaddy`
   - `S2S*TAMIRA` → `Tamira`

5. **Apply title case formatting**

**New function signature:**
```text
export const smartDisplayName = (description: string): string
```

**Add a mapping dictionary for known merchants:**
```text
const DISPLAY_NAME_MAP: Record<string, string> = {
  'PNP': 'Pick n Pay',
  'SHOPRITE': 'Shoprite',
  'SUPERSPAR': 'SuperSpar',
  'WOOLWORTHS': 'Woolworths',
  'KFC': 'KFC',
  'MCD': "McDonald's",
  // ... etc
};
```

**Add a mapping for location abbreviations:**
```text
const LOCATION_ABBREVS: Record<string, string> = {
  'VOSL': 'Vosloorus',
  'VOSLO': 'Vosloorus',
  'JHB': 'Johannesburg',
  'PTA': 'Pretoria',
  'CPT': 'Cape Town',
  // ... etc
};
```

---

#### File 2: `src/lib/merchantUtils.ts` - Update `extractDisplayMerchantName`

Replace the simple title-case logic with a call to `smartDisplayName`:

```text
export const extractDisplayMerchantName = (description: string): string => {
  if (!description) return '';
  return smartDisplayName(description);
};
```

---

### Transformation Examples

| Input Description | Output Display Name |
|-------------------|---------------------|
| `FEE: PAYSHAP PAYMENT FEE: PAYSHAP PAYMENT` | `Payshap Fee` |
| `PNP CRP VOSLO 5222*2822 16 JAN CHEQUE CARD PURCHASE` | `Pick n Pay Vosloorus` |
| `MEATEXPRESS 5222*2822 28 JAN CHEQUE CARD PURCHASE` | `Meatexpress` |
| `WOOLWORTHS 5222*2822 24 JAN CHEQUE CARD PURCHASE` | `Woolworths` |
| `YOCO *ZODWA 5222*2822 18 JAN CHEQUE CARD PURCHASE` | `Zodwa` |
| `VAS00182812693 VODA0636844044 PREPAID MOBILE PURCHASE` | `Vodacom Airtime` |
| `0000B867 2026-01-05T10:34:59 5222*2822 AUTOBANK CASH WITHDRAWAL AT` | `ATM Withdrawal` |
| `**2095407 10H31 **2822 IB TRANSFER FROM` | `Transfer In` |
| `CASH WITHDRAWAL FEE CASH WITHDRAWAL FEE` | `ATM Fee` |
| `SUPERSPAR VC 5222*2822 09 JAN CHEQUE CARD PURCHASE` | `SuperSpar` |
| `C*BP RUSLOO 5222*2822 21 JAN CHEQUE CARD PURCHASE` | `BP Rusloo` |
| `PULE PAYSHAP PAYMENT TO` | `Pule` |
| `FOSCHINI CHRI 5222*2822 22 JAN CHEQUE CARD PURCHASE` | `Foschini` |

---

### Files Modified

| File | Change |
|------|--------|
| `src/lib/merchantUtils.ts` | Add `smartDisplayName` function and update `extractDisplayMerchantName` |

---

### How It Works

The function processes descriptions in this order:

1. **Detect transaction type** (fee, transfer, purchase, withdrawal)
2. **Remove noise** (card numbers, dates, reference codes)
3. **Handle prefixes** (YOCO *, C*, DNH*, S2S*, VAS*)
4. **Expand abbreviations** (PNP, VOSL, etc.)
5. **Apply brand formatting** (maintain correct casing for brands)
6. **Title case remaining words**

---

### Benefits

- **User-friendly display** - Transactions are instantly recognizable
- **Consistent formatting** - All merchants displayed uniformly
- **Maintains accuracy** - Original description preserved in database for categorization
- **Extensible** - Easy to add new merchant mappings and abbreviations
