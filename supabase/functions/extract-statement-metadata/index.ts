import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODEL = 'google/gemini-2.5-flash';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentBase64, isPDF = true } = await req.json();

    if (!documentBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing documentBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('[METADATA] Starting AI extraction with', MODEL);
    console.log('[METADATA] Document type:', isPDF ? 'PDF' : 'Image');
    console.log('[METADATA] Base64 length:', documentBase64.length);

    const systemPrompt = `You are a financial data extraction assistant specializing in South African bank statements. Extract metadata accurately from bank statements.

IMPORTANT: Return ONLY a valid JSON object with no additional text, no markdown code blocks, and no explanation.

Use this exact structure:
{
  "bank_name": "Standard Bank",
  "account_number": "5239123456789407",
  "account_first_four": "5239",
  "account_last_four": "9407",
  "account_holder_name": "MR. TUMISO MAKENA",
  "statement_date": "2025-12-06",
  "period_start": "2025-09-07",
  "period_end": "2025-12-06"
}

Common South African banks to look for:
- Standard Bank
- ABSA
- FNB (First National Bank)
- Nedbank
- Capitec
- Investec
- African Bank
- Discovery Bank

If a field cannot be determined, use null for that field.`;

    const userPrompt = `Extract the following from this bank statement:

1. BANK STATEMENT METADATA:
   - Bank name (e.g., Standard Bank, ABSA, FNB, Nedbank, Capitec)
   - Account number (full account number from the statement)
   - First four digits of the account number
   - Last four digits of the account number
   - Statement date (the date the statement was generated)
   - Statement period start date
   - Statement period end date
   - Account holder name (if visible)

Return ONLY a valid JSON object with no code blocks or markdown.`;

    // Build document content based on file type
    const mediaType = isPDF ? 'application/pdf' : 'image/jpeg';
    const dataUrl = `data:${mediaType};base64,${documentBase64}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
              { type: 'text', text: userPrompt }
            ]
          }
        ]
      }),
    });

    if (response.status === 429) {
      console.error('[METADATA] Rate limit exceeded');
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (response.status === 402) {
      console.error('[METADATA] Payment required');
      return new Response(
        JSON.stringify({ error: 'Payment required. Please add funds to your Lovable AI workspace.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[METADATA] AI Gateway error:', response.status, errorText);
      throw new Error(`AI extraction failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content || '';
    
    console.log('[METADATA] Raw AI response:', textContent.substring(0, 500));

    // Clean JSON response - handle markdown code blocks
    let cleanJson = textContent.trim();
    cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    // Extract JSON object if wrapped in other text
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    let metadata;
    try {
      metadata = JSON.parse(cleanJson);
      console.log('[METADATA] Parsed successfully:', JSON.stringify(metadata, null, 2));
    } catch (parseError) {
      console.error('[METADATA] JSON parse error:', parseError);
      console.error('[METADATA] Failed to parse:', cleanJson);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(
      JSON.stringify({ success: true, metadata }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[METADATA] Error:', error);
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
