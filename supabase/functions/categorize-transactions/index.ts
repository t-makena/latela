import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Max transactions to process per invocation to stay within CPU limits
const BATCH_LIMIT = 50;

function preCategorizeSmart(description: string, amount: number): string | null {
  const desc = description.toUpperCase();
  
  if (desc.includes('FEE:') || desc.includes('WITHDRAWAL FEE') || desc.includes('ATM FEE')) {
    return 'Fees';
  }
  
  const fuelKeywords = ['BP ', 'C*BP', 'SHELL ', 'ENGEN ', 'SASOL ', 'CALTEX ', 'TOTAL ', 'ASTRON '];
  if (fuelKeywords.some(k => desc.includes(k))) {
    return 'Transport';
  }
  
  if (amount > 0) {
    if (desc.includes('SALARY') || desc.includes('WAGES')) {
      return 'Salary';
    }
    return 'Other Income';
  }
  
  const subscriptionKeywords = ['CLAUDE', 'CHATGPT', 'NETFLIX', 'SPOTIFY', 'DSTV', 'OPENAI', 
    'SHOWMAX', 'YOUTUBE', 'AMAZON PRIME', 'APPLE', 'MICROSOFT', 'GOOGLE PLAY'];
  if (subscriptionKeywords.some(k => desc.includes(k))) {
    return 'Bills';
  }
  
  if (desc.includes('PAYSHAP') && (desc.includes(' TO') || desc.includes('PAY BY PROXY')) && amount < 0) {
    return 'Assistance';
  }
  
  const groceryKeywords = ['PNP ', 'PICK N PAY', 'CHECKERS', 'SHOPRITE', 'WOOLWORTHS', 'SPAR ', 
    'SUPERSPAR', 'USAVE', 'BOXER', 'FOOD LOVER'];
  if (groceryKeywords.some(k => desc.includes(k))) {
    return 'Groceries';
  }
  
  const diningKeywords = ['MCD ', 'MCDONALDS', 'KFC ', 'NANDOS', "NANDO'S", 'STEERS', 'WIMPY', 
    'SPUR ', 'DEBONAIRS', 'FISHAWAYS', 'CHICKEN LICKEN', 'BURGER'];
  if (diningKeywords.some(k => desc.includes(k))) {
    return 'Dining';
  }
  
  if (desc.includes('PREPAID MOBILE') || desc.includes('VODA') || desc.includes('MTN ') || 
      desc.includes('TELKOM') || desc.includes('CELLC')) {
    return 'Bills';
  }
  
  return null;
}

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

function extractMerchantCore(description: string): string {
  if (!description) return '';
  const normalized = extractMerchantName(description);
  let cleaned = normalized.replace(/^(THE|A|AN)\s+/i, '');
  const firstWord = cleaned.split(' ')[0] || cleaned;
  return firstWord.length >= 2 ? firstWord : cleaned;
}

function calculateMerchantSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;
  const normalized1 = extractMerchantName(name1);
  const normalized2 = extractMerchantName(name2);
  if (normalized1 === normalized2) return 1.0;
  const core1 = extractMerchantCore(name1);
  const core2 = extractMerchantCore(name2);
  if (core1 === core2 && core1.length >= 2) return 0.95;
  const aliases1 = MERCHANT_ALIASES[core1] || [];
  const aliases2 = MERCHANT_ALIASES[core2] || [];
  if (aliases1.includes(core2) || aliases2.includes(core1)) return 0.9;
  if (normalized1.startsWith(normalized2) || normalized2.startsWith(normalized1)) return 0.85;
  if (core1.length >= 3 && core2.length >= 3) {
    if (core1.startsWith(core2) || core2.startsWith(core1)) return 0.8;
  }
  if (core1.length >= 4 && core2.length >= 4) {
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.75;
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
    
    if (mapping.merchant_pattern) {
      const patternCore = mapping.merchant_pattern.toUpperCase();
      if (patternCore === merchantCore) {
        const score = 0.95;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { category_id: mapping.category_id, subcategory_id: mapping.subcategory_id, custom_subcategory_id: mapping.custom_subcategory_id, display_name: mapping.display_name, score };
        }
        continue;
      }
    }
    
    const score = calculateMerchantSimilarity(mapping.merchant_name, merchantName);
    if (score >= 0.7 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category_id: mapping.category_id, subcategory_id: mapping.subcategory_id, custom_subcategory_id: mapping.custom_subcategory_id, display_name: mapping.display_name, score };
    }
  }
  
  return bestMatch;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function categorizeMerchantWithAI(merchantName: string, description: string, retryCount = 0): Promise<string> {
  const MAX_RETRIES = 2;
  const BASE_DELAY_MS = 1000;
  
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
        messages: [{
          role: 'user',
          content: `Categorize this South African transaction into ONE category.

Merchant: ${merchantName}
Description: ${description}

Categories: Groceries, Transport, Entertainment, Utilities, Healthcare, Shopping, Dining, Bills, Assistance, Fees, Salary, Other Income, Other

Rules:
- BP, Shell, Engen, Sasol, Caltex = Transport
- Netflix, Spotify, DSTV, Claude, ChatGPT = Bills
- YOCO * = categorize by likely vendor type
- Money to individuals = Assistance
- FEE: = Fees

Respond with ONLY the category name.`
        }],
      }),
    });

    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, retryCount);
        console.log(`Rate limited, retrying in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await delay(delayMs);
        return categorizeMerchantWithAI(merchantName, description, retryCount + 1);
      }
      console.warn(`Rate limit exceeded after ${MAX_RETRIES} retries, defaulting to 'Other'`);
      return 'Other';
    }

    if (!response.ok) {
      console.error('Anthropic API error:', response.status);
      return 'Other';
    }

    const data = await response.json();
    return data.content?.[0]?.text?.trim() || 'Other';
  } catch (error) {
    console.error('AI categorization error:', error);
    return 'Other';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountId } = await req.json();
    if (!accountId) throw new Error('Account ID is required');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Fetch uncategorized transactions - LIMIT to batch size
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, description, amount, account_id')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .is('category_id', null)
      .order('transaction_date', { ascending: false })
      .limit(BATCH_LIMIT);

    if (txError) throw txError;

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, categorized: 0, cached: 0, userMappings: 0, aiCalls: 0, remaining: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all data needed upfront in parallel
    const [userMappingsResult, categoriesResult, merchantsCacheResult] = await Promise.all([
      supabase
        .from('user_merchant_mappings')
        .select('merchant_name, merchant_pattern, display_name, category_id, subcategory_id, custom_subcategory_id')
        .eq('user_id', user.id)
        .eq('is_active', true),
      supabase
        .from('categories')
        .select('id, name, parent_id'),
      supabase
        .from('merchants')
        .select('merchant_name, category')
        .or(`user_id.eq.${user.id},user_id.is.null`)
    ]);

    const userMappings = userMappingsResult.data || [];
    const allCategories = categoriesResult.data || [];
    const merchantsCache = merchantsCacheResult.data || [];

    // Build category lookup maps in memory
    const categoryByNameLower = new Map<string, string>();
    for (const cat of allCategories) {
      categoryByNameLower.set(cat.name.toLowerCase(), cat.id);
    }

    // Build merchants cache map
    const merchantsCacheMap = new Map<string, string>();
    for (const m of merchantsCache) {
      merchantsCacheMap.set(m.merchant_name.toUpperCase(), m.category);
    }

    // Find fallback category ID
    let fallbackCategoryId: string | null = null;
    for (const name of ['other', 'miscellaneous', 'other expenses']) {
      const id = categoryByNameLower.get(name);
      if (id) { fallbackCategoryId = id; break; }
    }
    if (!fallbackCategoryId && allCategories.length > 0) {
      const rootCat = allCategories.find(c => !c.parent_id);
      fallbackCategoryId = rootCat?.id || allCategories[0].id;
    }

    // Resolve category name to ID using in-memory maps
    function resolveCategoryId(categoryName: string): string {
      const normalizedName = categoryName.trim().toLowerCase();
      
      // Direct match
      const directId = categoryByNameLower.get(normalizedName);
      if (directId) return directId;
      
      // Try mapped names
      const potentialMatches = AI_TO_DB_CATEGORY_MAP[normalizedName] || [categoryName];
      for (const matchName of potentialMatches) {
        const id = categoryByNameLower.get(matchName.toLowerCase());
        if (id) return id;
      }
      
      // Fuzzy: find any category containing the name
      for (const [catName, catId] of categoryByNameLower) {
        if (catName.includes(normalizedName) || normalizedName.includes(catName)) {
          return catId;
        }
      }
      
      return fallbackCategoryId || '';
    }

    let categorizedCount = 0;
    let cachedCount = 0;
    let userMappingsCount = 0;
    let aiCallsCount = 0;

    // Collect batch updates
    const updates: Array<{ id: string; data: Record<string, unknown> }> = [];
    const newMerchants: Array<{ merchant_name: string; category: string; user_id: string }> = [];

    // Process each transaction - no DB calls in the loop except AI
    for (const transaction of transactions) {
      const merchantName = extractMerchantName(transaction.description);
      const merchantCore = extractMerchantCore(transaction.description);
      
      // PRIORITY 1: User merchant mappings (in-memory)
      const userMapping = findBestUserMapping(merchantName, merchantCore, userMappings);
      if (userMapping) {
        const updateData: Record<string, unknown> = {
          category_id: userMapping.category_id,
          subcategory_id: userMapping.subcategory_id || userMapping.custom_subcategory_id || null,
          auto_categorized: false,
          user_verified: true,
          categorization_confidence: userMapping.score,
          is_categorized: true
        };
        if (userMapping.display_name) {
          updateData.display_merchant_name = userMapping.display_name;
        }
        updates.push({ id: transaction.id, data: updateData });
        userMappingsCount++;
        categorizedCount++;
        continue;
      }

      // PRIORITY 2: Smart detection (in-memory)
      const smartCategory = preCategorizeSmart(transaction.description, transaction.amount);
      if (smartCategory) {
        const categoryId = resolveCategoryId(smartCategory);
        updates.push({
          id: transaction.id,
          data: { category_id: categoryId, auto_categorized: true, categorization_confidence: 1.0, is_categorized: true }
        });
        categorizedCount++;
        continue;
      }

      // PRIORITY 3: Merchants cache (in-memory)
      const cachedCategory = merchantsCacheMap.get(merchantName);
      if (cachedCategory) {
        const categoryId = resolveCategoryId(cachedCategory);
        updates.push({
          id: transaction.id,
          data: { category_id: categoryId, auto_categorized: true, categorization_confidence: 1.0, is_categorized: true }
        });
        cachedCount++;
        categorizedCount++;
        continue;
      }

      // PRIORITY 4: AI call (only network call in loop)
      const aiCategory = await categorizeMerchantWithAI(merchantName, transaction.description);
      aiCallsCount++;
      const categoryId = resolveCategoryId(aiCategory);
      updates.push({
        id: transaction.id,
        data: { category_id: categoryId, auto_categorized: true, categorization_confidence: 0.9, is_categorized: true }
      });
      newMerchants.push({ merchant_name: merchantName, category: aiCategory, user_id: user.id });
      categorizedCount++;
    }

    // Apply all updates in parallel batches of 10
    const UPDATE_BATCH_SIZE = 10;
    for (let i = 0; i < updates.length; i += UPDATE_BATCH_SIZE) {
      const batch = updates.slice(i, i + UPDATE_BATCH_SIZE);
      await Promise.all(
        batch.map(u => supabase.from('transactions').update(u.data).eq('id', u.id))
      );
    }

    // Save new merchants to cache in parallel
    if (newMerchants.length > 0) {
      await Promise.all(
        newMerchants.map(m =>
          supabase.from('merchants').upsert({
            merchant_name: m.merchant_name,
            category: m.category,
            user_id: m.user_id,
            frequency: 1,
            confidence: 0.9,
          }, { onConflict: 'merchant_name,user_id' })
        )
      );
    }

    // Check if there are remaining uncategorized transactions
    const { count: remainingCount } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .is('category_id', null);

    return new Response(
      JSON.stringify({ 
        success: true, 
        categorized: categorizedCount,
        cached: cachedCount,
        userMappings: userMappingsCount,
        aiCalls: aiCallsCount,
        remaining: remainingCount || 0,
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
