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

      if (cachedCategory) {
        categoryName = cachedCategory.category;
        cachedCount++;
        console.log(`✓ Cached: ${merchantName} → ${categoryName}`);
      } else {
        // PRIORITY 3: Call AI for new merchant
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

async function categorizeMerchantWithAI(merchantName: string, description: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        {
          role: 'system',
          content: 'You are a financial transaction categorizer for South African transactions. Respond with ONLY the category name, nothing else.'
        },
        {
          role: 'user',
          content: `Categorize this South African transaction into ONE category:

Merchant: ${merchantName}
Description: ${description}

Categories: Groceries, Transport, Entertainment, Utilities, Healthcare, Shopping, Dining, Bills, Salary, Transfer, Other

Respond with ONLY the category name.`
        }
      ],
      max_tokens: 20,
    }),
  });

  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  if (response.status === 402) {
    throw new Error('AI credits exhausted. Please add credits to your workspace.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error('AI categorization failed');
  }

  const data = await response.json();
  const category = data.choices?.[0]?.message?.content?.trim() || 'Other';
  
  return category;
}

// deno-lint-ignore no-explicit-any
async function getOrCreateCategory(supabase: any, categoryName: string): Promise<string> {
  // Try to find existing category
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', categoryName)
    .is('parent_id', null)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  // Create new category (this requires appropriate permissions)
  const { data: newCategory, error } = await supabase
    .from('categories')
    .insert({ name: categoryName })
    .select('id')
    .single();

  if (error) {
    // If we can't create, try to find "Other" category as fallback
    const { data: otherCategory } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', 'Other')
      .is('parent_id', null)
      .maybeSingle();
    
    if (otherCategory) {
      return otherCategory.id;
    }
    throw error;
  }

  return newCategory.id;
}
