import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParsedItem {
  name: string;
  quantity: number;
  raw_text: string;
}

interface ProductMatch {
  id: string;
  name: string;
  brand: string | null;
  cheapest_price_cents: number;
  cheapest_store: string;
  store_count: number;
}

interface GroceryItem {
  id: string;
  raw_text: string;
  name: string;
  quantity: number;
  confidence: "high" | "medium" | "low";
  needs_clarification: boolean;
  matches: ProductMatch[];
}

const storeDisplayNames: Record<string, string> = {
  pnp: "Pick n Pay",
  checkers: "Checkers",
  shoprite: "Shoprite",
  woolworths: "Woolworths",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ success: false, error: "Image is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Extract base64 data and media type
    let imageData: string;
    let mediaType: string;

    if (image.startsWith("data:")) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid image format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      mediaType = matches[1];
      imageData = matches[2];
    } else {
      mediaType = "image/jpeg";
      imageData = image;
    }

    // Call Anthropic Claude Vision API
    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: imageData,
                  },
                },
                {
                  type: "text",
                  text: `Analyze this grocery list image and extract all items. For each item, identify:
1. The item name (normalized to common grocery terms)
2. The quantity (default to 1 if not specified)
3. The exact text as written

Return a JSON array with this structure:
[{"name": "item name", "quantity": 1, "raw_text": "original text"}]

Important:
- Normalize item names to common grocery terms (e.g., "2L milk" -> "milk", "white bread loaf" -> "bread")
- Extract quantities from text like "2x", "x3", "2 of", etc.
- If you can't read an item clearly, include it with best guess
- Focus on food and household items

Return ONLY the JSON array, no additional text.`,
                },
              ],
            },
          ],
        }),
      },
    );

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to analyze image" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = anthropicData.content?.[0]?.text || "[]";

    let parsedItems: ParsedItem[];
    try {
      // Extract JSON from response (it might be wrapped in markdown code blocks)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          parsedItems = JSON.parse(jsonMatch[0]);
        } catch (parseErr) {
          console.error("Failed to parse grocery list JSON:", parseErr);
          parsedItems = [];
        }
      } else {
        parsedItems = [];
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", responseText);
      parsedItems = [];
    }

    // Search for product matches for each item
    const groceryItems: GroceryItem[] = await Promise.all(
      parsedItems.map(async (item, index) => {
        const { data: searchResults } = await supabase.rpc("search_products", {
          search_query: item.name,
          result_limit: 5,
        });

        const matches: ProductMatch[] = (searchResults || []).map(
          (product: any) => {
            const offers = product.offers || [];
            const sortedOffers = [...offers].sort(
              (a: any, b: any) => a.price_cents - b.price_cents,
            );
            const cheapestOffer = sortedOffers[0];

            return {
              id: product.id,
              name: product.name,
              brand: product.brand,
              cheapest_price_cents: cheapestOffer?.price_cents || 0,
              cheapest_store: cheapestOffer
                ? storeDisplayNames[cheapestOffer.store] || cheapestOffer.store
                : "Unknown",
              store_count: offers.length,
            };
          },
        );

        // Determine confidence and clarification needs
        const hasExactMatch = matches.some(
          (m) =>
            m.name.toLowerCase().includes(item.name.toLowerCase()) ||
            item.name
              .toLowerCase()
              .includes(m.name.toLowerCase().split(" ")[0]),
        );

        const confidence: "high" | "medium" | "low" =
          matches.length === 1
            ? "high"
            : matches.length > 1 && hasExactMatch
              ? "medium"
              : "low";

        const needsClarification = matches.length !== 1;

        return {
          id: `item-${index}-${Date.now()}`,
          raw_text: item.raw_text,
          name: item.name,
          quantity: item.quantity || 1,
          confidence,
          needs_clarification: needsClarification,
          matches,
        };
      }),
    );

    const needsClarificationCount = groceryItems.filter(
      (item) => item.needs_clarification,
    ).length;

    return new Response(
      JSON.stringify({
        success: true,
        items: groceryItems,
        total_items: groceryItems.length,
        needs_clarification: needsClarificationCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
