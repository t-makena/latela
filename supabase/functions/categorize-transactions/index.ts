import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Common South African merchant aliases for fuzzy matching
 */
const MERCHANT_ALIASES: Record<string, string[]> = {
  'MCD': ['MCDONALDS', 'MCDONALD', "MCDONALD'S", 'MCDS'],
  'MCDONALDS': ['MCD', 'MCDS', "MCDONALD'S"],
  'PNP': ['PICK N PAY', 'PICKNPAY', 'PICK-N-PAY', 'PICKPAY'],
  'PICK': ['PNP', 'PICKNPAY'],
  'SHOPRITE': ['CHECKERS', 'USAVE', 'SHOPRITE CHECKERS'],
  'CHECKERS': ['SHOPRITE', 'SHOPRITE CHECKERS'],
  'SPAR': ['SUPERSPAR', 'KWIKSPAR', 'SPAR EXPRESS'],
  'SUPERSPAR': ['SPAR', 'KWIKSPAR'],
  'WOOLWORTHS': ['WOOLIES', 'W/WORTHS'],
  'WOOLIES': ['WOOLWORTHS', 'W/WORTHS'],
  'KFC': ['KENTUCKY', 'KENTUCKY FRIED'],
  'KENTUCKY': ['KFC'],
};

/**
 * Pre-AI smart detection for common transaction patterns.
 * Returns category name if pattern is detected, null otherwise.
 * This saves AI costs and ensures consistent categorization.
 */
function preCategorizeSmart(description: string, amount: number): string | null {
  const desc = description.toUpperCase();
  
  // 1. FEES - Any FEE: prefix or withdrawal fee
  if (desc.includes('FEE:') || desc.includes('WITHDRAWAL FEE') || desc.includes('ATM FEE')) {
    return 'Fees';
  }
  
  // 2. TRANSPORTATION - Fuel stations (check before other patterns)
  const fuelKeywords = ['BP ', 'C*BP', 'SHELL ', 'ENGEN ', 'SASOL ', 'CALTEX ', 'TOTAL ', 'ASTRON '];
  if (fuelKeywords.some(k => desc.includes(k))) {
    return 'Transport';
  }
  
  // 3. INCOME DETECTION - Positive amounts
  if (amount > 0) {
    if (desc.includes('SALARY') || desc.includes('WAGES')) {
      return 'Salary';
    }
    // All other incoming money = Other Income
    return 'Other Income';
  }
  
  // 4. BILLS & SUBSCRIPTIONS - Known subscription services
  const subscriptionKeywords = ['CLAUDE', 'CHATGPT', 'NETFLIX', 'SPOTIFY', 'DSTV', 'OPENAI', 
    'SHOWMAX', 'YOUTUBE', 'AMAZON PRIME', 'APPLE', 'MICROSOFT', 'GOOGLE PLAY'];
  if (subscriptionKeywords.some(k => desc.includes(k))) {
    return 'Bills';
  }
  
  // 5. ASSISTANCE/LENDING - PayShap TO a person (outgoing money)
  // Patterns: "NAME PAYSHAP PAYMENT TO", "PAYSHAP PAY BY PROXY"
  if (desc.includes('PAYSHAP') && (desc.includes(' TO') || desc.includes('PAY BY PROXY')) && amount < 0) {
    // Check if it's NOT a known subscription (handled above)
    return 'Assistance';
  }
  
  // 6. GROCERIES - Major SA grocery chains
  const groceryKeywords = ['PNP ', 'PICK N PAY', 'CHECKERS', 'SHOPRITE', 'WOOLWORTHS', 'SPAR ', 
    'SUPERSPAR', 'USAVE', 'BOXER', 'FOOD LOVER'];
  if (groceryKeywords.some(k => desc.includes(k))) {
    return 'Groceries';
  }
  
  // 7. DINING - Fast food and restaurants
  const diningKeywords = ['MCD ', 'MCDONALDS', 'KFC ', 'NANDOS', "NANDO'S", 'STEERS', 'WIMPY', 
    'SPUR ', 'DEBONAIRS', 'FISHAWAYS', 'CHICKEN LICKEN', 'BURGER'];
  if (diningKeywords.some(k => desc.includes(k))) {
    return 'Dining';
  }
  
  // 8. AIRTIME/MOBILE - Prepaid purchases
  if (desc.includes('PREPAID MOBILE') || desc.includes('VODA') || desc.includes('MTN ') || 
      desc.includes('TELKOM') || desc.includes('CELLC')) {
    return 'Bills';
  }
  
  // Let AI handle complex cases like YOCO payments
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountId } = await req.json();

    if (!accountId) {
      throw new Error('Account ID is required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch uncategorized transactions for this account
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .is('category_id', null)
      .order('transaction_date', { ascending: false });

    if (txError) {
      throw txError;
    }

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          categorized: 0,
          cached: 0,
          userMappings: 0,
          aiCalls: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch ALL user merchant mappings upfront for fuzzy matching
    const { data: userMappings } = await supabase
      .from('user_merchant_mappings')
      .select('merchant_name, merchant_pattern, display_name, category_id, subcategory_id, custom_subcategory_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    let categorizedCount = 0;
    let cachedCount = 0;
    let userMappingsCount = 0;
    let aiCallsCount = 0;

    // Process each transaction
    for (const transaction of transactions) {
      const merchantName = extractMerchantName(transaction.description);
      const merchantCore = extractMerchantCore(transaction.description);
      
      // PRIORITY 1: Check user_merchant_mappings with fuzzy matching
      const userMapping = findBestUserMapping(merchantName, merchantCore, userMappings || []);

      if (userMapping) {
        // Apply user's custom mapping with full category chain and display name
        const updateData: Record<string, unknown> = {
          category_id: userMapping.category_id,
          subcategory_id: userMapping.subcategory_id || userMapping.custom_subcategory_id || null,
          auto_categorized: false,
          user_verified: true,
          categorization_confidence: userMapping.score,
          is_categorized: true
        };

        // Apply display name if set
        if (userMapping.display_name) {
          updateData.display_merchant_name = userMapping.display_name;
        }

        await supabase
          .from('transactions')
          .update(updateData)
          .eq('id', transaction.id);

        userMappingsCount++;
        categorizedCount++;
        console.log(`✓ User mapping (score: ${userMapping.score.toFixed(2)}): ${merchantName} → category_id: ${userMapping.category_id}`);
        continue;
      }

      // PRIORITY 2: Check merchants table (cached AI categorizations)
      const { data: cachedCategory } = await supabase
        .from('merchants')
        .select('category')
        .eq('merchant_name', merchantName)
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('user_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      let categoryName: string;
      let smartDetected = false;

      // PRIORITY 2: Pre-AI smart detection (saves AI costs)
      const smartCategory = preCategorizeSmart(transaction.description, transaction.amount);
      if (smartCategory) {
        categoryName = smartCategory;
        smartDetected = true;
        console.log(`✓ Smart detection: ${merchantName} → ${categoryName}`);
      } else {
        // PRIORITY 3: Check merchants table (cached AI categorizations)
        const { data: cachedCategory } = await supabase
          .from('merchants')
          .select('category')
          .eq('merchant_name', merchantName)
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('user_id', { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        if (cachedCategory) {
          categoryName = cachedCategory.category;
          cachedCount++;
          console.log(`✓ Cached: ${merchantName} → ${categoryName}`);
        } else {
          // PRIORITY 4: Call AI for new merchant
          categoryName = await categorizeMerchantWithAI(merchantName, transaction.description);
          aiCallsCount++;
          console.log(`💰 AI Call: ${merchantName} → ${categoryName}`);

          // Save to merchants cache
          await supabase
            .from('merchants')
            .upsert({
              merchant_name: merchantName,
              category: categoryName,
              user_id: user.id,
              frequency: 1,
              confidence: 0.9,
            }, {
              onConflict: 'merchant_name,user_id'
            });
        }
      }

      // Get or create category_id from category name
      const categoryId = await getOrCreateCategory(supabase, categoryName);

      // Update transaction with category
      await supabase
        .from('transactions')
        .update({ 
          category_id: categoryId,
          auto_categorized: true,
          categorization_confidence: cachedCategory ? 1.0 : 0.9,
          is_categorized: true
        })
        .eq('id', transaction.id);

      categorizedCount++;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        categorized: categorizedCount,
        cached: cachedCount,
        userMappings: userMappingsCount,
        aiCalls: aiCallsCount,
        cost: (aiCallsCount * 0.00015).toFixed(4)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Categorization error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Extracts and normalizes merchant name from transaction description.
 * Must match the logic in src/lib/merchantUtils.ts for consistency.
 */
function extractMerchantName(description: string): string {
  if (!description) return '';
  
  let merchant = description
    .replace(/\bPURCHASE\b|\bDEBIT\b|\bCREDIT\b|\bPAYMENT\b|\bTRANSFER\b|\bPOS\b|\bATM\b|\bEFT\b/gi, '')
    .replace(/\bCARD\s+\d+/gi, '')
    .replace(/\*+\d+/g, '')
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '')
    .replace(/\d{4}-\d{2}-\d{2}/g, '')
    .replace(/\d{2}-\d{2}-\d{4}/g, '')
    .replace(/\d{2}\.\d{2}\.\d{4}/g, '')
    .replace(/\d{2}:\d{2}(:\d{2})?/g, '')
    .replace(/REF\s*[:.]?\s*\d+/gi, '')
    .replace(/\bTXN\s*[:.]?\s*\d+/gi, '')
    .replace(/R?\d+[.,]\d{2}/g, '')
    .replace(/\s+\d{6,}$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const parts = merchant.split(/\s{2,}/);
  merchant = parts[0] || merchant;
  
  return merchant.substring(0, 100).toUpperCase();
}

/**
 * Extracts the core identifier from a merchant name (first significant word).
 */
function extractMerchantCore(description: string): string {
  if (!description) return '';
  
  const normalized = extractMerchantName(description);
  
  // Skip common prefixes
  let cleaned = normalized.replace(/^(THE|A|AN)\s+/i, '');
  
  // Get the first word
  const firstWord = cleaned.split(' ')[0] || cleaned;
  
  return firstWord.length >= 2 ? firstWord : cleaned;
}

/**
 * Calculates similarity between two merchant names.
 */
function calculateMerchantSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;
  
  const normalized1 = extractMerchantName(name1);
  const normalized2 = extractMerchantName(name2);
  
  // Exact match
  if (normalized1 === normalized2) return 1.0;
  
  const core1 = extractMerchantCore(name1);
  const core2 = extractMerchantCore(name2);
  
  // Core match
  if (core1 === core2 && core1.length >= 2) return 0.95;
  
  // Check alias match
  const aliases1 = MERCHANT_ALIASES[core1] || [];
  const aliases2 = MERCHANT_ALIASES[core2] || [];
  if (aliases1.includes(core2) || aliases2.includes(core1)) return 0.9;
  
  // Prefix match
  if (normalized1.startsWith(normalized2) || normalized2.startsWith(normalized1)) {
    return 0.85;
  }
  
  // Core prefix match
  if (core1.length >= 3 && core2.length >= 3) {
    if (core1.startsWith(core2) || core2.startsWith(core1)) {
      return 0.8;
    }
  }
  
  // Contains match
  if (core1.length >= 4 && core2.length >= 4) {
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return 0.75;
    }
  }
  
  return 0;
}

interface UserMappingMatch {
  category_id: string;
  subcategory_id: string | null;
  custom_subcategory_id: string | null;
  display_name: string | null;
  score: number;
}

/**
 * Finds the best matching user mapping using fuzzy matching.
 */
function findBestUserMapping(
  merchantName: string, 
  merchantCore: string, 
  mappings: Array<{
    merchant_name: string;
    merchant_pattern: string | null;
    display_name: string | null;
    category_id: string;
    subcategory_id: string | null;
    custom_subcategory_id: string | null;
  }>
): UserMappingMatch | null {
  if (!mappings.length) return null;
  
  let bestMatch: UserMappingMatch | null = null;
  
  for (const mapping of mappings) {
    // Try exact match first
    const mappingNormalized = extractMerchantName(mapping.merchant_name);
    if (mappingNormalized === merchantName) {
      return {
        category_id: mapping.category_id,
        subcategory_id: mapping.subcategory_id,
        custom_subcategory_id: mapping.custom_subcategory_id,
        display_name: mapping.display_name,
        score: 1.0
      };
    }
    
    // Try pattern match if available
    if (mapping.merchant_pattern) {
      const patternCore = mapping.merchant_pattern.toUpperCase();
      if (patternCore === merchantCore) {
        const score = 0.95;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            category_id: mapping.category_id,
            subcategory_id: mapping.subcategory_id,
            custom_subcategory_id: mapping.custom_subcategory_id,
            display_name: mapping.display_name,
            score
          };
        }
        continue;
      }
    }
    
    // Calculate fuzzy similarity
    const score = calculateMerchantSimilarity(mapping.merchant_name, merchantName);
    if (score >= 0.7 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = {
        category_id: mapping.category_id,
        subcategory_id: mapping.subcategory_id,
        custom_subcategory_id: mapping.custom_subcategory_id,
        display_name: mapping.display_name,
        score
      };
    }
  }
  
  return bestMatch;
}

/**
 * Delays execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Categorizes a merchant using Anthropic API with retry logic and exponential backoff
 */
async function categorizeMerchantWithAI(merchantName: string, description: string, retryCount = 0): Promise<string> {
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 2000; // Start with 2 second delay
  
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 20,
        messages: [
          {
            role: 'user',
            content: `You are a financial transaction categorizer for South African transactions. Categorize this transaction into ONE category:

Merchant: ${merchantName}
Description: ${description}

Categories: Groceries, Transport, Entertainment, Utilities, Healthcare, Shopping, Dining, Bills, Assistance, Fees, Salary, Other Income, Other

Rules:
- BP, Shell, Engen, Sasol, Caltex = Transport (fuel stations)
- Netflix, Spotify, DSTV, Claude, ChatGPT = Bills (subscriptions)
- YOCO * = vendor payment, categorize by likely vendor type (food vendor = Dining, clothing = Shopping, etc.)
- Money paid to individuals (names in description) = Assistance
- FEE: or withdrawal fee = Fees
- Incoming money (not salary) = Other Income

Respond with ONLY the category name, nothing else.`
          }
        ],
      }),
    });

    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff: 2s, 4s, 8s
        console.log(`Rate limited, retrying in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await delay(delayMs);
        return categorizeMerchantWithAI(merchantName, description, retryCount + 1);
      }
      // After max retries, return 'Other' instead of failing
      console.warn(`Rate limit exceeded after ${MAX_RETRIES} retries, defaulting to 'Other'`);
      return 'Other';
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      // Return 'Other' instead of throwing to prevent full failure
      return 'Other';
    }

    const data = await response.json();
    const category = data.content?.[0]?.text?.trim() || 'Other';
    
    // Add small delay between successful calls to avoid hitting rate limits
    await delay(500);
    
    return category;
  } catch (error) {
    console.error('AI categorization error:', error);
    return 'Other';
  }
}

/**
 * Maps AI category responses to existing database category names.
 * AI returns simple names, but database has more specific names.
 */
const AI_TO_DB_CATEGORY_MAP: Record<string, string[]> = {
  'groceries': ['Food & Groceries', 'Groceries', 'Food'],
  'food': ['Food & Groceries', 'Groceries', 'Food'],
  'dining': ['Dining & Restaurants', 'Dining', 'Restaurants'],
  'restaurant': ['Dining & Restaurants', 'Dining', 'Restaurants'],
  'restaurants': ['Dining & Restaurants', 'Dining', 'Restaurants'],
  'transport': ['Transportation & Fuel', 'Transportation', 'Transport', 'Fuel'],
  'transportation': ['Transportation & Fuel', 'Transportation', 'Transport'],
  'fuel': ['Transportation & Fuel', 'Fuel', 'Transport'],
  'utilities': ['Housing & Utilities', 'Utilities', 'Bills & Subscriptions'],
  'housing': ['Housing & Utilities', 'Housing'],
  'healthcare': ['Healthcare & Medical', 'Healthcare', 'Medical'],
  'medical': ['Healthcare & Medical', 'Medical', 'Healthcare'],
  'bills': ['Bills & Subscriptions', 'Bills', 'Utilities'],
  'subscriptions': ['Bills & Subscriptions', 'Subscriptions', 'Bills'],
  'entertainment': ['Entertainment & Leisure', 'Entertainment', 'Leisure'],
  'leisure': ['Entertainment & Leisure', 'Leisure', 'Entertainment'],
  'shopping': ['Personal & Lifestyle', 'Shopping', 'Retail', 'Shopping & Retail'],
  'personal': ['Personal & Lifestyle', 'Personal', 'Lifestyle'],
  'lifestyle': ['Personal & Lifestyle', 'Lifestyle'],
  'salary': ['Salary & Wages', 'Salary/Wages', 'Salary', 'Income', 'Wages'],
  'wages': ['Salary & Wages', 'Salary/Wages', 'Wages', 'Salary'],
  'income': ['Other Income', 'Income', 'Salary & Wages'],
  'other income': ['Other Income', 'Income'],
  'transfer': ['Transfers', 'Transfer', 'Bank Transfer'],
  'transfers': ['Transfers', 'Transfer'],
  'savings': ['Savings', 'Savings & Investments'],
  'fees': ['Fees', 'Bank Fees'],
  'fee': ['Fees', 'Bank Fees'],
  'assistance': ['Assistance/Lending', 'Assistance', 'Lending'],
  'lending': ['Assistance/Lending', 'Lending', 'Assistance'],
  'other': ['Other', 'Miscellaneous', 'Other Expenses'],
};

// Fallback category ID for "Other" - will be fetched once
let fallbackCategoryId: string | null = null;

// deno-lint-ignore no-explicit-any
async function getOrCreateCategory(supabase: any, categoryName: string): Promise<string> {
  const normalizedName = categoryName.trim().toLowerCase();
  
  // Get potential matches from the mapping
  const potentialMatches = AI_TO_DB_CATEGORY_MAP[normalizedName] || [categoryName];
  
  // Try each potential match in order
  for (const matchName of potentialMatches) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', matchName)
      .maybeSingle();

    if (existing) {
      console.log(`✓ Category mapped: "${categoryName}" → "${matchName}" (${existing.id})`);
      return existing.id;
    }
  }
  
  // Try fuzzy match with LIKE
  const { data: fuzzyMatch } = await supabase
    .from('categories')
    .select('id, name')
    .ilike('name', `%${normalizedName}%`)
    .maybeSingle();
    
  if (fuzzyMatch) {
    console.log(`✓ Category fuzzy matched: "${categoryName}" → "${fuzzyMatch.name}" (${fuzzyMatch.id})`);
    return fuzzyMatch.id;
  }

  // Fallback to "Other" or first available category
  if (!fallbackCategoryId) {
    // Try to find "Other" category
    const { data: otherCategory } = await supabase
      .from('categories')
      .select('id')
      .or('name.ilike.Other,name.ilike.Miscellaneous,name.ilike.Other Expenses')
      .limit(1)
      .maybeSingle();
    
    if (otherCategory) {
      fallbackCategoryId = otherCategory.id;
    } else {
      // Get any category as absolute fallback
      const { data: anyCategory } = await supabase
        .from('categories')
        .select('id')
        .is('parent_id', null)
        .limit(1)
        .maybeSingle();
      
      fallbackCategoryId = anyCategory?.id || null;
    }
  }

  if (fallbackCategoryId) {
    console.log(`⚠ Category not found: "${categoryName}" → using fallback`);
    return fallbackCategoryId;
  }

  throw new Error(`No categories found in database for: ${categoryName}`);
}
