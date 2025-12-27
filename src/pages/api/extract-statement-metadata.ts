// src/pages/api/extract-statement-metadata.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-haiku-4-5-20251001';

async function extractStatementMetadata(
  documentBase64: string,
  isPDF: boolean = true
) {
  const mediaType = isPDF ? 'application/pdf' : 'image/jpeg';

  const prompt = `You are a financial data extraction assistant. Extract the following from this bank statement:

1. BANK STATEMENT METADATA:
   - Bank name (e.g., Standard Bank, ABSA, FNB, Nedbank, Capitec)
   - Account number (full account number from the statement)
   - Statement date (the date the statement was generated)
   - Statement period start date
   - Statement period end date
   - Account holder name (if visible)

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks, no explanation). Use this exact structure:

{
  "bank_name": "Standard Bank",
  "account_number": "5239123456789407",
  "account_first_four": "5239",
  "account_last_four": "9407",
  "account_holder_name": "MR. TUMISO MAKENA",
  "statement_date": "2025-12-06",
  "period_start": "2025-09-07",
  "period_end": "2025-12-06"
}`;

  try {
    const contentBlocks: any[] = [{ type: 'text', text: prompt }];

    if (isPDF) {
      contentBlocks.push({
        type: 'document' as const,
        source: {
          type: 'base64' as const,
          media_type: 'application/pdf' as const,
          data: documentBase64,
        },
      });
    } else {
      contentBlocks.push({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: 'image/jpeg' as const,
          data: documentBase64,
        },
      });
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: contentBlocks,
        },
      ],
    });

    const textContent = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n');

    // Clean JSON response
    let cleanJson = textContent.trim();
    cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    const metadata = JSON.parse(cleanJson);
    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentBase64, isPDF = true } = req.body;

    if (!documentBase64) {
      return res.status(400).json({ error: 'Missing documentBase64' });
    }

    const metadata = await extractStatementMetadata(documentBase64, isPDF);

    return res.status(200).json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}