

## Make Budget Buddy Agentic with Tool Calling

Transform Budget Buddy from a read-only advisor into an agent that can **take actions** on behalf of the user -- adding goals, creating budget items, scheduling calendar events, and more.

### How It Works

The approach uses **Anthropic's native tool calling** (already supported by the Claude model in use). The AI decides when to call a tool based on the user's message, the edge function executes the action against the database, and the result is fed back to Claude for a natural confirmation response.

```text
User: "Add a goal: Save R40,000 in 6 months"
  |
  v
Edge Function sends messages + tool definitions to Claude
  |
  v
Claude responds with tool_use: add_goal({ name: "Save R40,000", target: 40000, months: 6 })
  |
  v
Edge Function executes the INSERT on Supabase (using user's auth)
  |
  v
Tool result sent back to Claude
  |
  v
Claude streams a friendly confirmation: "Done! I've added your goal..."
  |
  v
Client receives streamed response + action metadata for UI refresh
```

### Available Tools (Phase 1)

| Tool | Description | Example Prompt |
|------|-------------|----------------|
| `add_goal` | Create a new savings goal | "Save R40,000 in 6 months" |
| `add_budget_item` | Add a budget plan item | "Add R500/month for gym" |
| `add_calendar_event` | Schedule a financial event | "Remind me to pay rent on the 1st" |
| `list_goals` | Show current goals summary | "What are my goals?" |
| `list_budget_items` | Show budget plan items | "Show my budget plan" |
| `delete_goal` | Remove a goal by name | "Remove the holiday goal" |
| `delete_budget_item` | Remove a budget item by name | "Delete the gym budget item" |

### Changes Required

**1. Edge Function: `supabase/functions/chat-financial/index.ts`**

- Define Anthropic tool schemas (add_goal, add_budget_item, add_calendar_event, list_goals, list_budget_items, delete_goal, delete_budget_item)
- After initial Claude response, check for `tool_use` content blocks
- Execute each tool call against Supabase using the user's authenticated client
- Send tool results back to Claude in a follow-up request for the final streamed response
- Include action metadata in SSE events so the client knows to refresh data
- Update system prompt to inform Claude about available tools and when to use them

**2. Frontend: `src/pages/Chat.tsx`**

- Parse a new SSE event type `action` that carries tool execution results
- When an action is received (e.g., `goal_added`, `budget_item_added`), trigger a data refresh via React Query invalidation or hook callbacks
- Show a small inline confirmation chip/toast when an action completes (e.g., "Goal added" with a link to the Goals page)

### Technical Details

**Tool Definition Example (Anthropic format):**
```json
{
  "name": "add_goal",
  "description": "Add a new savings goal for the user. Use when they want to save toward something.",
  "input_schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Goal name, e.g. 'Holiday Fund'" },
      "target": { "type": "number", "description": "Target amount in Rands (not cents)" },
      "months": { "type": "integer", "description": "Number of months to achieve the goal" },
      "monthly_allocation": { "type": "number", "description": "Optional monthly savings amount in Rands" }
    },
    "required": ["name", "target", "months"]
  }
}
```

**Tool Execution Flow in Edge Function:**
```text
1. Send messages + tools to Anthropic
2. If response has stop_reason === "tool_use":
   a. Extract tool calls from content blocks
   b. Execute each (e.g., supabase.from('goals').insert(...))
   c. Build tool_result messages
   d. Call Anthropic again with original messages + assistant tool_use + tool_results
   e. Stream the final text response to client
3. If response has stop_reason === "end_turn":
   a. Stream text directly (no tools needed)
```

**Action SSE Event (new event type for client):**
```json
{"action": "goal_added", "data": {"name": "Holiday Fund", "target": 40000}}
```

**Client-Side Refresh Pattern:**
```typescript
// In Chat.tsx, when action event is received:
if (parsed.action) {
  // Invalidate relevant React Query caches
  queryClient.invalidateQueries({ queryKey: ['goals'] });
  queryClient.invalidateQueries({ queryKey: ['budget-items'] });
}
```

### Safety Guardrails

- All database writes use the **user's own auth token** (RLS enforced) -- the agent cannot access other users' data
- Tool inputs are validated server-side before execution (e.g., target must be positive, name must be non-empty, months between 1-120)
- Delete operations match by name within the user's own records -- Claude will confirm before deleting if ambiguous
- The system prompt instructs Claude to **always confirm destructive actions** before executing them
- Monthly allocation is auto-calculated as `target / months` if not explicitly provided

### What Will NOT Change

- The streaming UI and conversation history system remain the same
- The existing financial context fetching stays intact
- No database schema changes needed -- all tools operate on existing tables (goals, budget_items, calendar_events)

