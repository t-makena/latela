import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  id: string;
  description: string;
  amount: number;
  transaction_date: string;
  display_merchant_name?: string;
}

interface MerchantGroup {
  pattern: string;
  displayName: string;
  transactions: Transaction[];
  amounts: number[];
  months: Set<string>;
  hasDebitOrderKeyword: boolean;
}

interface DetectedItem {
  pattern: string;
  displayName: string;
  averageAmount: number;
  detectionType: 'exact_amount' | 'monthly_merchant' | 'explicit_keyword';
  occurrenceCount: number;
}

// Normalize merchant names to create patterns for matching
function normalizeMerchantName(description: string): string {
  if (!description) return '';
  
  let normalized = description.toUpperCase();
  
  // Remove common transaction prefixes
  normalized = normalized.replace(/^(PURCHASE|DEBIT|CREDIT|PAYMENT|TRANSFER|POS|ATM|EFT|VAS\d+|PAYSHAP)\s*/gi, '');
  
  // Remove card numbers and references
  normalized = normalized.replace(/\*{2,}\d+/g, '');
  normalized = normalized.replace(/\b\d{6,}\b/g, '');
  normalized = normalized.replace(/CARD\s*\d+/gi, '');
  
  // Remove dates
  normalized = normalized.replace(/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{2,4}/g, '');
  normalized = normalized.replace(/\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}/g, '');
  
  // Remove times
  normalized = normalized.replace(/\d{2}:\d{2}(:\d{2})?/g, '');
  
  // Remove currency amounts
  normalized = normalized.replace(/R?\s*\d+[.,]\d{2}/g, '');
  
  // Remove reference numbers
  normalized = normalized.replace(/REF[:\s]*\d+/gi, '');
  normalized = normalized.replace(/TXN[:\s]*\d+/gi, '');
  
  // Clean up whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Extract first significant word(s) as the core pattern
  const words = normalized.split(' ').filter(w => w.length >= 2);
  
  // Return first 1-2 significant words
  if (words.length >= 1) {
    // For known patterns, use first word only
    const firstWord = words[0];
    if (['NETFLIX', 'SPOTIFY', 'DSTV', 'CLAUDE', 'GODADDY', 'DISCOVERY', 'BETWAY', 'PREPAID'].includes(firstWord)) {
      return firstWord;
    }
    // Otherwise use up to 2 words for more specificity
    return words.slice(0, 2).join(' ');
  }
  
  return normalized;
}

// Create a user-friendly display name from the pattern
function createDisplayName(pattern: string): string {
  if (!pattern) return 'Unknown';
  
  // Capitalize first letter of each word
  return pattern
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Check if description contains debit order keywords
function hasDebitOrderKeyword(description: string): boolean {
  const keywords = /\b(DEBIT\s*ORDER|D\/O|DEBIT\s*ORD)\b/i;
  return keywords.test(description);
}

// Get month key from date string (YYYY-MM)
function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Calculate amount variance
function calculateVariance(amounts: number[]): number {
  if (amounts.length < 2) return 0;
  
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const max = Math.max(...amounts);
  const min = Math.min(...amounts);
  
  if (avg === 0) return 0;
  return (max - min) / avg;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[DETECT-RECURRING] ========== Starting Detection ==========');

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[AUTH] User authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AUTH] User:', user.id);

    // Get lookback period from request body (default 3 months)
    let lookbackMonths = 3;
    try {
      const body = await req.json();
      if (body.lookbackMonths) {
        lookbackMonths = Math.min(Math.max(body.lookbackMonths, 1), 12);
      }
    } catch {
      // No body or invalid JSON, use default
    }

    const lookbackDate = new Date();
    lookbackDate.setMonth(lookbackDate.getMonth() - lookbackMonths);
    const lookbackDateStr = lookbackDate.toISOString().split('T')[0];

    console.log('[QUERY] Fetching transactions since:', lookbackDateStr);

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, description, amount, transaction_date, display_merchant_name')
      .eq('user_id', user.id)
      .gte('transaction_date', lookbackDateStr)
      .order('transaction_date', { ascending: false });

    if (txError) {
      console.error('[QUERY] Transaction fetch error:', txError);
      throw txError;
    }

    console.log('[QUERY] Found', transactions?.length || 0, 'transactions');

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, added: 0, skipped: 0, items: [], message: 'No transactions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing budget items to check for duplicates
    const { data: existingItems, error: budgetError } = await supabase
      .from('budget_items')
      .select('id, name, source_merchant_pattern')
      .eq('user_id', user.id);

    if (budgetError) {
      console.error('[QUERY] Budget items fetch error:', budgetError);
      throw budgetError;
    }

    const existingPatterns = new Set(
      (existingItems || [])
        .filter(item => item.source_merchant_pattern)
        .map(item => item.source_merchant_pattern!.toUpperCase())
    );
    const existingNames = new Set(
      (existingItems || []).map(item => item.name.toUpperCase())
    );

    console.log('[DEDUP] Existing patterns:', existingPatterns.size);
    console.log('[DEDUP] Existing names:', existingNames.size);

    // Group transactions by normalized merchant pattern
    const merchantGroups = new Map<string, MerchantGroup>();

    for (const tx of transactions) {
      const description = tx.description || '';
      const pattern = normalizeMerchantName(description);
      
      if (!pattern || pattern.length < 2) continue;

      if (!merchantGroups.has(pattern)) {
        merchantGroups.set(pattern, {
          pattern,
          displayName: tx.display_merchant_name || createDisplayName(pattern),
          transactions: [],
          amounts: [],
          months: new Set(),
          hasDebitOrderKeyword: false,
        });
      }

      const group = merchantGroups.get(pattern)!;
      group.transactions.push(tx);
      group.amounts.push(Math.abs(tx.amount));
      group.months.add(getMonthKey(tx.transaction_date));
      
      if (hasDebitOrderKeyword(description)) {
        group.hasDebitOrderKeyword = true;
      }
    }

    console.log('[GROUPS] Created', merchantGroups.size, 'merchant groups');

    // Detect recurring patterns
    const detectedItems: DetectedItem[] = [];

    for (const [pattern, group] of merchantGroups) {
      // Skip if already in budget
      if (existingPatterns.has(pattern.toUpperCase())) {
        console.log('[SKIP] Pattern already exists:', pattern);
        continue;
      }
      
      if (existingNames.has(group.displayName.toUpperCase())) {
        console.log('[SKIP] Name already exists:', group.displayName);
        continue;
      }

      // Check for explicit keyword first
      if (group.hasDebitOrderKeyword) {
        const avgAmount = group.amounts.reduce((a, b) => a + b, 0) / group.amounts.length;
        detectedItems.push({
          pattern,
          displayName: group.displayName,
          averageAmount: Math.round(avgAmount * 100) / 100,
          detectionType: 'explicit_keyword',
          occurrenceCount: group.transactions.length,
        });
        console.log('[DETECT] Keyword match:', pattern, '| Amount:', avgAmount);
        continue;
      }

      // Check for exact amount match (same amount 2+ times across different months)
      const uniqueAmounts = [...new Set(group.amounts.map(a => Math.round(a * 100)))];
      
      if (uniqueAmounts.length === 1 && group.transactions.length >= 2 && group.months.size >= 2) {
        const exactAmount = group.amounts[0];
        detectedItems.push({
          pattern,
          displayName: group.displayName,
          averageAmount: Math.round(exactAmount * 100) / 100,
          detectionType: 'exact_amount',
          occurrenceCount: group.transactions.length,
        });
        console.log('[DETECT] Exact amount match:', pattern, '| Amount:', exactAmount);
        continue;
      }

      // Check for monthly merchant pattern (once per month, 2+ months, low variance)
      const avgPerMonth = group.transactions.length / group.months.size;
      const variance = calculateVariance(group.amounts);

      if (
        Math.abs(avgPerMonth - 1) < 0.3 && // Approximately once per month
        group.months.size >= 2 && // Present in 2+ months
        variance < 0.15 // Less than 15% amount variance
      ) {
        const avgAmount = group.amounts.reduce((a, b) => a + b, 0) / group.amounts.length;
        detectedItems.push({
          pattern,
          displayName: group.displayName,
          averageAmount: Math.round(avgAmount * 100) / 100,
          detectionType: 'monthly_merchant',
          occurrenceCount: group.transactions.length,
        });
        console.log('[DETECT] Monthly pattern:', pattern, '| Avg:', avgAmount, '| Variance:', variance);
        continue;
      }

      // Skip items that don't match criteria
      console.log('[SKIP] No pattern match:', pattern, 
        '| Count:', group.transactions.length,
        '| Months:', group.months.size,
        '| Unique amounts:', uniqueAmounts.length,
        '| Avg/month:', avgPerMonth.toFixed(2),
        '| Variance:', variance.toFixed(2)
      );
    }

    console.log('[RESULT] Detected', detectedItems.length, 'recurring items');

    // Insert detected items into budget_items
    const insertedItems: Array<{ name: string; amount: number; type: string }> = [];
    let skipped = 0;

    for (const item of detectedItems) {
      // Double-check for duplicates by name (case-insensitive)
      const { data: existing } = await supabase
        .from('budget_items')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', item.displayName)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log('[INSERT] Skipping duplicate:', item.displayName);
        skipped++;
        continue;
      }

      const { error: insertError } = await supabase
        .from('budget_items')
        .insert({
          user_id: user.id,
          name: item.displayName,
          frequency: 'Monthly',
          amount: item.averageAmount,
          auto_detected: true,
          source_merchant_pattern: item.pattern,
        });

      if (insertError) {
        console.error('[INSERT] Error inserting:', item.displayName, insertError);
        skipped++;
      } else {
        console.log('[INSERT] Added:', item.displayName, '| R', item.averageAmount);
        insertedItems.push({
          name: item.displayName,
          amount: item.averageAmount,
          type: item.detectionType,
        });
      }
    }

    console.log('[COMPLETE] Added:', insertedItems.length, '| Skipped:', skipped);

    return new Response(
      JSON.stringify({
        success: true,
        added: insertedItems.length,
        skipped,
        items: insertedItems,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ERROR]', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
