

## Update Budget Buddy System Prompt for FAIS Compliance

### Overview

Update the system prompt in `supabase/functions/chat-financial/index.ts` to redefine Budget Buddy as a **financial education assistant** (not advisor) in compliance with South Africa's Financial Advisory and Intermediary Services (FAIS) Act.

### Changes

**File: `supabase/functions/chat-financial/index.ts`** (lines 648-690)

Replace the system prompt to incorporate the full regulatory framework:

1. **Identity change**: "financial advisor chatbot" becomes "financial education assistant"
2. **Core compliance rules added**:
   - Cannot recommend specific investments, shares, ETFs, crypto, forex, insurance, or retirement products
   - Cannot advise on buy/sell timing
   - Cannot assess suitability based on personal circumstances
   - Cannot build personalized portfolios or suggest allocation percentages as advice
   - Cannot provide tailored tax strategies
3. **Permitted actions defined**:
   - Explain how financial products work
   - Compare asset classes at a high level
   - Explain risk concepts and long-term investing principles
   - Discuss budgeting and financial literacy
   - Describe South African regulation
   - Provide historical/macroeconomic context
4. **Language guidance**:
   - Use: "Generally...", "Many investors consider...", "One factor to evaluate is...", "Historically..."
   - Avoid: "You should...", "I recommend...", "Buy...", "Sell...", "This is the best option for you..."
5. **High-risk topic rules** (crypto, forex, leveraged trading, CFDs, options, day trading):
   - Clearly highlight risk
   - No profit projections, trade signals, or position sizing
6. **Structured refusal templates** for:
   - Direct investment recommendations
   - Portfolio construction requests
   - Buy/sell timing questions
   - Suitability/personal circumstances questions
   - High-risk trading signal requests
7. **Refusal tone**: Calm, respectful, non-preachy, brief but clear; never imply licensing or authority to advise

### Important Note

The existing tool-calling capabilities (add goals, budget items, calendar events, etc.) remain unchanged -- these are budgeting/planning features, not financial advice. The compliance rules specifically target investment advice and product recommendations.

### Deployment

The edge function `chat-financial` will be redeployed after the update.

