import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ProductOffer {
  store: string;
  price_cents: number;
  unit_price_cents: number | null;
  in_stock: boolean;
  on_sale: boolean;
  promotion_text: string | null;
  product_url: string | null;
}

interface SearchProduct {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  quantity_value: number | null;
  quantity_unit: string | null;
  image_url: string | null;
  offers: ProductOffer[];
}

const storeDisplayNames: Record<string, string> = {
  pnp: 'Pick n Pay',
  checkers: 'Checkers',
  shoprite: 'Shoprite',
  woolworths: 'Woolworths'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call the search_products function
    const { data, error } = await supabase.rpc('search_products', {
      search_query: query.trim(),
      result_limit: 20
    });

    if (error) {
      console.error('Search error:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enrich the results with calculated fields
    const products = (data as SearchProduct[]).map(product => {
      const offers = product.offers || [];
      const sortedOffers = [...offers].sort((a, b) => a.price_cents - b.price_cents);
      
      const cheapestOffer = sortedOffers[0];
      const mostExpensiveOffer = sortedOffers[sortedOffers.length - 1];
      
      const enrichedOffers = sortedOffers.map(offer => ({
        ...offer,
        store_display_name: storeDisplayNames[offer.store] || offer.store
      }));

      return {
        ...product,
        offers: enrichedOffers,
        cheapest_store: cheapestOffer ? storeDisplayNames[cheapestOffer.store] || cheapestOffer.store : null,
        cheapest_price_cents: cheapestOffer?.price_cents || null,
        potential_savings_cents: cheapestOffer && mostExpensiveOffer && sortedOffers.length > 1
          ? mostExpensiveOffer.price_cents - cheapestOffer.price_cents
          : 0,
        store_count: offers.length
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        query: query.trim(),
        total_results: products.length,
        products
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
