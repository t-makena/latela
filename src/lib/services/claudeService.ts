// src/lib/services/claudeService.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface TransactionData {
  description: string;
  amount: number;
  merchant?: string;
  date?: string;
}

export interface CategorizationResult {
  category: string;
  subcategory?: string;
  confidence: number;
  reasoning: string;
  suggestedBudgetType: 'essential' | 'lifestyle' | 'savings' | 'irregular';
}

export const SOUTH_AFRICAN_CATEGORIES = [
  'Food & Dining',
  'Transport & Fuel', 
  'Shopping & Retail',
  'Bills & Utilities',
  'Healthcare & Medical',
  'Entertainment & Recreation',
  'Education & Learning',
  'Banking & Fees',
  'Insurance',
  'Investments & Savings',
  'Home & Garden',
  'Travel & Accommodation',
  'Income & Salary',
  'Government & Taxes',
  'Other'
] as const;

export async function categorizeTransaction(
  transaction: TransactionData
): Promise<CategorizationResult> {
  
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const prompt = `
You are a South African financial advisor helping categorize a transaction. 

Transaction Details:
- Description: "${transaction.description}"
- Amount: R${transaction.amount}${transaction.merchant ? `\n- Merchant: ${transaction.merchant}` : ''}${transaction.date ? `\n- Date: ${transaction.date}` : ''}

Categories to choose from:
${SOUTH_AFRICAN_CATEGORIES.map(cat => `- ${cat}`).join('\n')}

Consider South African context:
- Common SA retailers (Woolworths, Pick n Pay, Checkers, etc.)
- SA fuel brands (Shell, BP, Engen, Sasol)
- SA banks (FNB, Standard Bank, ABSA, Nedbank, Capitec)
- Common ZAR amounts and spending patterns
- South African lifestyle and business types

Respond in this exact JSON format:
{
  "category": "exact category from the list",
  "subcategory": "more specific classification",
  "confidence": 0.85,
  "reasoning": "brief explanation of why this category was chosen",
  "suggestedBudgetType": "essential|lifestyle|savings|irregular"
}

Budget type guidelines:
- essential: groceries, rent, utilities, medical
- lifestyle: dining out, entertainment, shopping
- savings: investments, savings transfers
- irregular: one-time purchases, annual fees
`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Concatenate all text from content blocks of type 'text'
    const responseText = message.content
      .filter((block: any) => block.type === 'text' && typeof block.text === 'string')
      .map((block: any) => block.text)
      .join('\n');
    
    // Parse JSON response
    try {
      const result = JSON.parse(responseText) as CategorizationResult;
      
      // Validate the category is in our allowed list
      if (!SOUTH_AFRICAN_CATEGORIES.includes(result.category as any)) {
        result.category = 'Other';
        result.confidence = Math.max(0.3, result.confidence - 0.2);
      }
      
      return result;
      
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        category: 'Other',
        confidence: 0.3,
        reasoning: 'Unable to parse categorization response',
        suggestedBudgetType: 'lifestyle'
      };
    }

  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Transaction categorization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function categorizeBulkTransactions(
  transactions: TransactionData[]
): Promise<CategorizationResult[]> {
  
  const results: CategorizationResult[] = [];
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < transactions.length; i += 5) {
    const batch = transactions.slice(i, i + 5);
    const batchPromises = batch.map(tx => 
      categorizeTransaction(tx).catch(error => ({
        category: 'Other',
        confidence: 0.2,
        reasoning: `Error: ${error.message}`,
        suggestedBudgetType: 'lifestyle' as const
      }))
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + 5 < transactions.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}