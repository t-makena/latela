

## Fix: Add Offertory/Charity to Categorization Logic

### Problem
"Church Project" (and similar church/charity transactions) get categorized as "Miscellaneous" because:
1. `preCategorizeSmart` has no keywords for church/charity/donation patterns
2. The AI prompt's category list does not include "Offertory/Charity" -- the AI can only pick from categories it's told about
3. `AI_TO_DB_CATEGORY_MAP` has no entries for charity, offertory, donation, church, or tithe

### Changes

**File: `supabase/functions/categorize-transactions/index.ts`**

1. **Add to `AI_TO_DB_CATEGORY_MAP`** -- new entries so AI responses resolve correctly:
   - `'charity'` -> `['Offertory/Charity', 'Miscellaneous']`
   - `'offertory'` -> `['Offertory/Charity']`
   - `'donation'` -> `['Offertory/Charity']`
   - `'donations'` -> `['Offertory/Charity']`
   - `'church'` -> `['Offertory/Charity']`
   - `'tithe'` -> `['Offertory/Charity']`
   - `'offertory/charity'` -> `['Offertory/Charity']`

2. **Add smart detection in `preCategorizeSmart`** -- catch obvious church/charity keywords before hitting the AI:
   ```
   const charityKeywords = ['CHURCH', 'TITHE', 'OFFERTORY', 'DONATION', 'CHARITY', 'OFFERING'];
   if (amount < 0 && charityKeywords.some(k => desc.includes(k))) {
     return 'Offertory/Charity';
   }
   ```

3. **Add "Offertory/Charity" to the AI prompt's category list** so the AI knows it can use this category for ambiguous cases (e.g., "Church Project" where "Church" alone might not be keyword-matched but the AI can infer intent).

### Result

| Transaction | Before | After |
|------------|--------|-------|
| CHURCH PROJECT (negative) | Miscellaneous | Offertory/Charity |
| TITHE PAYMENT (negative) | Miscellaneous | Offertory/Charity |
| DONATION TO X (negative) | Miscellaneous | Offertory/Charity |

