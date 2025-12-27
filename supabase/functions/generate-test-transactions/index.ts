import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  account_id: string;
  user_id: string;
  amount: number;
  description: string;
  transaction_date: string;
  transaction_code: string;
  balance: number;
  cleared: boolean;
  auto_categorized: boolean;
}

// Realistic transaction descriptions and categories
const transactionTemplates = [
  { desc: 'WOOLWORTHS', code: 'DR', range: [200, 1500] },
  { desc: 'PICK N PAY', code: 'DR', range: [300, 2000] },
  { desc: 'CHECKERS', code: 'DR', range: [250, 1800] },
  { desc: 'UBER', code: 'DR', range: [50, 300] },
  { desc: 'NETFLIX', code: 'DR', range: [99, 199] },
  { desc: 'TAKEALOT.COM', code: 'DR', range: [150, 3000] },
  { desc: 'SHELL', code: 'DR', range: [400, 800] },
  { desc: 'ENGEN', code: 'DR', range: [350, 750] },
  { desc: 'MCDONALDS', code: 'DR', range: [50, 200] },
  { desc: 'KFC', code: 'DR', range: [60, 180] },
  { desc: 'NANDOS', code: 'DR', range: [100, 300] },
  { desc: 'DISCHEM', code: 'DR', range: [80, 500] },
  { desc: 'CLICKS', code: 'DR', range: [70, 400] },
  { desc: 'SALARY CREDIT', code: 'CR', range: [15000, 35000] },
  { desc: 'FREELANCE PAYMENT', code: 'CR', range: [2000, 8000] },
  { desc: 'REFUND', code: 'CR', range: [100, 500] },
  { desc: 'MR PRICE', code: 'DR', range: [200, 1500] },
  { desc: 'EDGARS', code: 'DR', range: [300, 2000] },
  { desc: 'GAME STORES', code: 'DR', range: [200, 3000] },
  { desc: 'CAPITEC ATM', code: 'DR', range: [500, 2000] },
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating transactions for user:', user.id);

    // Get user's account
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('id, balance, current_balance')
      .eq('user_id', user.id)
      .limit(1);

    if (accountError || !accounts || accounts.length === 0) {
      console.error('Account fetch error:', accountError);
      return new Response(
        JSON.stringify({ error: 'No account found for user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const account = accounts[0];
    console.log('Found account:', account.id);

    // Parse request body for count (default to 50)
    let transactionCount = 50;
    try {
      const body = await req.json();
      if (body.count && typeof body.count === 'number') {
        transactionCount = Math.min(Math.max(body.count, 1), 200); // Between 1 and 200
      }
    } catch {
      // Use default if no body or invalid JSON
    }

    // Generate random transactions
    const transactions: Transaction[] = [];
    let currentBalance = account.balance || account.current_balance || 50000; // Start with existing balance or default
    const now = new Date();

    for (let i = 0; i < transactionCount; i++) {
      // Random date within last 90 days
      const daysAgo = Math.floor(Math.random() * 90);
      const transactionDate = new Date(now);
      transactionDate.setDate(transactionDate.getDate() - daysAgo);

      // Pick random transaction template
      const template = transactionTemplates[Math.floor(Math.random() * transactionTemplates.length)];
      
      // Generate random amount within range
      const amount = Math.floor(
        Math.random() * (template.range[1] - template.range[0]) + template.range[0]
      );

      // Update balance
      if (template.code === 'DR') {
        currentBalance -= amount;
      } else {
        currentBalance += amount;
      }

      transactions.push({
        account_id: account.id,
        user_id: user.id,
        amount: amount,
        description: template.desc,
        transaction_date: transactionDate.toISOString(),
        transaction_code: template.code,
        balance: currentBalance,
        cleared: true,
        auto_categorized: false,
      });
    }

    // Sort by date (oldest first)
    transactions.sort((a, b) => 
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    // Recalculate balances in chronological order
    let runningBalance = (account.balance || account.current_balance || 50000) - 
      transactions.reduce((sum, t) => sum + (t.transaction_code === 'DR' ? t.amount : -t.amount), 0);
    
    transactions.forEach(t => {
      if (t.transaction_code === 'DR') {
        runningBalance -= t.amount;
      } else {
        runningBalance += t.amount;
      }
      t.balance = runningBalance;
    });

    console.log(`Inserting ${transactions.length} transactions`);

    // Insert transactions
    const { data: insertedData, error: insertError } = await supabase
      .from('transactions')
      .insert(transactions)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert transactions', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully inserted ${insertedData?.length || 0} transactions`);

    return new Response(
      JSON.stringify({
        success: true,
        count: insertedData?.length || 0,
        message: `Generated ${insertedData?.length || 0} test transactions`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
