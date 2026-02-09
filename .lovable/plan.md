

## Budget Buddy - AI Financial Chatbot

### Overview

A conversational AI chatbot page where users can interact with their financial data using Anthropic's Claude Sonnet 4.5. The chatbot will have access to the user's transactions, budget items, goals, and account balances to provide personalized financial advice.

### What It Does

- Users can ask questions like "How much did I spend on groceries this month?" or "Am I on track with my savings?"
- The AI responds with insights based on actual financial data from the database
- Streaming responses for a smooth chat experience (tokens appear as they're generated)
- Chat history persists during the session
- Mobile-friendly, matching the app's existing design language

---

### Architecture

The chatbot follows a backend-first approach:

1. **Frontend** sends the user's message to an edge function
2. **Edge function** fetches the user's financial data from Supabase (transactions, budget, goals, accounts)
3. **Edge function** constructs a system prompt with the financial context and sends it to Anthropic's API
4. **Response streams** back to the frontend token-by-token via SSE

This keeps the Anthropic API key secure and ensures financial data context is assembled server-side.

---

### Technical Implementation

#### 1. Edge Function: `chat-financial`

- Authenticates the user via JWT
- Fetches the user's financial snapshot:
  - Recent transactions (last 3 months, up to 500)
  - Budget items with spending data
  - Goals and savings progress
  - Account balances
- Constructs a system prompt containing this data as context
- Streams the response from Anthropic's `claude-sonnet-4-5-20241022` model
- Returns SSE stream to the frontend

**System prompt** will include:
- Current date and user's financial summary
- Transaction history formatted as a table
- Budget allocations vs actual spending
- Savings goals and progress
- Account balances
- Instructions to be a helpful South African financial advisor using Rand (R) currency

#### 2. New Page: `/chat`

A clean chat interface with:
- Message list showing user and assistant messages
- Text input with send button at the bottom
- Streaming token display for AI responses
- Markdown rendering for formatted responses (tables, lists, bold text)
- Empty state with suggested questions to get started
- Mobile-responsive layout matching the app's rounded card style

#### 3. Navigation Update

- Add "Budget Buddy" to the sidebar navigation with a `MessageCircle` icon
- Position it after "Grocery Budget" in the nav list
- Add translation key for the nav item

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/chat-financial/index.ts` | Create | Edge function with Anthropic streaming + financial data context |
| `supabase/config.toml` | Modify | Add `chat-financial` function config with `verify_jwt = false` (manual auth) |
| `src/pages/Chat.tsx` | Create | Chat page with message list, input, and streaming display |
| `src/hooks/useFinancialChat.ts` | Create | Hook for managing chat state and SSE streaming |
| `src/App.tsx` | Modify | Add `/chat` route |
| `src/components/layout/Navbar.tsx` | Modify | Add "Budget Buddy" nav item |
| `src/locales/en.json` | Modify | Add translation keys |

---

### Edge Function Details

The edge function will:

1. Accept `{ messages: Array<{role, content}> }` in the request body
2. Authenticate via the Authorization header
3. Fetch financial data using the authenticated Supabase client:
   - `accounts` - balances, types
   - `v_transactions_with_details` - recent transactions with categories
   - `budget_items` - budget allocations
   - `goals` - savings goals and progress
4. Build a system prompt with this data injected
5. Call Anthropic's API with streaming enabled (`stream: true`)
6. Pipe the SSE stream back to the client

**Model**: `claude-sonnet-4-5-20241022` (as requested)

**Rate limiting**: The function will handle Anthropic API errors (429, 500) gracefully and return appropriate error messages.

#### 4. Frontend Chat UI

The chat page will include:
- A scrollable message area with auto-scroll on new messages
- User messages styled differently from AI messages (right-aligned vs left-aligned)
- A fixed input area at the bottom
- Suggested starter questions like:
  - "How much did I spend this month?"
  - "What are my biggest expenses?"
  - "Am I on track with my savings goals?"
  - "Where can I cut spending?"
- Loading indicator while AI is responding
- Error handling with toast notifications for API failures

**Markdown support**: AI responses will be rendered with `react-markdown` (needs to be added as a dependency) for proper formatting of tables, lists, and emphasis.

---

### Dependencies

- `react-markdown` - For rendering AI responses with proper formatting (tables, lists, code blocks)

### Existing Resources Used

- `ANTHROPIC_API_KEY` - Already configured as a Supabase secret
- `@anthropic-ai/sdk` - Already installed (though the edge function will use the REST API directly for streaming compatibility with Deno)

