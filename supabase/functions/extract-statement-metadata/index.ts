import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const KIMI_MODEL = "moonshot-v1-32k";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentBase64, isPDF = true } = await req.json();

    if (!documentBase64) {
      return new Response(JSON.stringify({ error: "Missing documentBase64" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const KIMI_API_KEY = Deno.env.get("KIMI_API_KEY")?.trim();
    console.log("[KIMI-DEBUG] Key present:", !!KIMI_API_KEY, "Length:", KIMI_API_KEY?.length);
    console.log("[KIMI-DEBUG] Auth header preview:", `Bearer ${KIMI_API_KEY?.slice(0, 10)}...`);
    if (!KIMI_API_KEY) {
      throw new Error("KIMI_API_KEY is not configured");
    }

    console.log("[METADATA] Starting Kimi extraction with", KIMI_MODEL);
    console.log("[METADATA] Document type:", isPDF ? "PDF" : "Image");
    console.log("[METADATA] Base64 length:", documentBase64.length);

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

    // Extract raw text from the document using Kimi Files API, then send to chat
    let statementText: string;

    if (isPDF) {
      // Decode base64 → bytes → upload to Kimi Files API
      const pdfDecoded = atob(documentBase64);
      const pdfBytes = Uint8Array.from(pdfDecoded, (c) => c.charCodeAt(0));
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", blob, "statement.pdf");
      formData.append("purpose", "file-extract");

      const uploadRes = await fetch("https://api.moonshot.ai/v1/files", {
        method: "POST",
        headers: { Authorization: `Bearer ${KIMI_API_KEY}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        throw new Error(`Kimi upload failed: ${uploadRes.status} - ${err}`);
      }

      const fileData = await uploadRes.json();
      const fileId = fileData.id as string;
      console.log("[METADATA] Kimi file uploaded, id:", fileId);

      try {
        const contentRes = await fetch(
          `https://api.moonshot.ai/v1/files/${fileId}/content`,
          { headers: { Authorization: `Bearer ${KIMI_API_KEY}` } },
        );
        if (!contentRes.ok) {
          const err = await contentRes.text();
          throw new Error(`Kimi content fetch failed: ${contentRes.status} - ${err}`);
        }
        const contentData = await contentRes.json();
        statementText = contentData.content ?? "";
      } finally {
        await fetch(`https://api.moonshot.ai/v1/files/${fileId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${KIMI_API_KEY}` },
        }).catch((e) => console.warn("[METADATA] File cleanup failed:", e));
      }
    } else {
      // For images, pass base64 as a data URI in the user message
      statementText = `[Image data provided as base64 — extract metadata from it]\ndata:image/jpeg;base64,${documentBase64}`;
    }

    console.log("[METADATA] Statement text length:", statementText.length);

    const response = await fetch("https://api.moonshot.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KIMI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${userPrompt}\n\n---\n\n${statementText}` },
        ],
      }),
    });

    if (response.status === 429) {
      console.error("[METADATA] Rate limit exceeded");
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[METADATA] Kimi API error:", response.status, errorText);
      throw new Error(`AI extraction failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content || "";

    console.log("[METADATA] Raw AI response:", textContent.substring(0, 500));

    // Clean JSON response - handle markdown code blocks
    let cleanJson = textContent.trim();
    cleanJson = cleanJson.replace(/```json\n?/g, "").replace(/```\n?/g, "");

    // Extract JSON object if wrapped in other text
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    let metadata;
    try {
      try {
        metadata = JSON.parse(cleanJson);
      } catch (parseErr) {
        console.error("Failed to parse statement metadata JSON:", parseErr);
        return new Response(
          JSON.stringify({ error: "Failed to parse AI response" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
      console.log(
        "[METADATA] Parsed successfully:",
        JSON.stringify(metadata, null, 2),
      );
    } catch (parseError) {
      console.error("[METADATA] JSON parse error:", parseError);
      console.error("[METADATA] Failed to parse:", cleanJson);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify({ success: true, metadata }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[METADATA] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
