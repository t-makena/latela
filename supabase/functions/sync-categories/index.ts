import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Category {
  name: string;
  color: string;
  description: string;
}

const standardCategories: Category[] = [
  {
    name: 'Housing & Utilities',
    color: '#3B82F6',
    description: 'Rent, mortgage, electricity, water, and other utilities'
  },
  {
    name: 'Personal & Lifestyle',
    color: '#8B5CF6',
    description: 'Personal care, clothing, and lifestyle expenses'
  },
  {
    name: 'Transportation & Fuel',
    color: '#F59E0B',
    description: 'Fuel, vehicle maintenance, public transport, and travel'
  },
  {
    name: 'Shopping & Retail',
    color: '#A855F7',
    description: 'Retail purchases, online shopping, and general merchandise'
  },
  {
    name: 'Healthcare & Medical',
    color: '#EF4444',
    description: 'Medical expenses, pharmacy, doctor visits, and health insurance'
  },
  {
    name: 'Miscellaneous',
    color: '#06B6D4',
    description: 'Uncategorized and other miscellaneous expenses'
  },
  {
    name: 'Savings & Investments',
    color: '#10B981',
    description: 'Savings contributions, investments, and financial growth'
  },
  {
    name: 'Food & Groceries',
    color: '#84CC16',
    description: 'Grocery shopping and food supplies'
  },
  {
    name: 'Dining & Restaurants',
    color: '#EC4899',
    description: 'Restaurants, takeaway, and dining out'
  },
  {
    name: 'Entertainment & Recreation',
    color: '#F97316',
    description: 'Entertainment, hobbies, gym, and recreational activities'
  },
  {
    name: 'Bills & Subscriptions',
    color: '#6B7280',
    description: 'Recurring bills, subscriptions, and regular payments'
  }
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting category synchronization...');

    // Delete all existing categories
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (deleteError) {
      console.error('Error deleting categories:', deleteError);
      throw deleteError;
    }

    console.log('Successfully deleted old categories');

    // Insert new standardized categories
    const { data: insertedCategories, error: insertError } = await supabase
      .from('categories')
      .insert(standardCategories)
      .select();

    if (insertError) {
      console.error('Error inserting categories:', insertError);
      throw insertError;
    }

    console.log('Successfully inserted new categories:', insertedCategories);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Categories synchronized successfully',
        categories: insertedCategories
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in sync-categories function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
