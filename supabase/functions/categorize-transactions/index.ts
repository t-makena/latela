import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    let categorizedCount = 0;
    let cachedCount = 0;
    let userMappingsCount = 0;
    let aiCallsCount = 0;

    // Process each transaction
    for (const transaction of transactions) {
      const merchantName = extractMerchantName(transaction.description);
      
      // PRIORITY 1: Check user_merchant_mappings first (user's custom settings)
      const { data: userMapping } = await supabase
        .from('user_merchant_mappings')
        .select('category_id, subcategory_id, custom_subcategory_id')
        .eq('user_id', user.id)
        .ilike('merchant_name', merchantName)
        .eq('is_active', true)
        .maybeSingle();

      if (userMapping) {
        // Apply user's custom mapping with full category chain
        const updateData: Record<string, unknown> = {
          category_id: userMapping.category_id,
          subcategory_id: userMapping.subcategory_id || userMapping.custom_subcategory_id || null,
          auto_categorized: false,
          user_verified: true,
          categorization_confidence: 1.0,
          is_categorized: true
        };

        await supabase
          .from('transactions')
          .update(updateData)
          .eq('id', transaction.id);

        userMappingsCount++;
        categorizedCount++;
        console.log(`✓ User mapping: ${merchantName} → category_id: ${userMapping.category_id}`);
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

async function getOrCreateCategory(supabase: ReturnType<typeof createClient>, categoryName: string): Promise<string> {
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
