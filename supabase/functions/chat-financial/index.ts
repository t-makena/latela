import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const tools = [
  {
    name: "add_goal",
    description: "Add a new savings goal for the user. Use when they want to save toward something specific.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Goal name, e.g. 'Holiday Fund'" },
        target: { type: "number", description: "Target amount in Rands (not cents)" },
        months: { type: "integer", description: "Number of months to achieve the goal" },
      },
      required: ["name", "target", "months"],
    },
  },
  {
    name: "add_budget_item",
    description: "Add a new budget plan item. Use when the user wants to budget for a recurring expense.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Budget item name, e.g. 'Gym'" },
        amount: { type: "number", description: "Amount in Rands (not cents)" },
        frequency: { type: "string", enum: ["monthly", "weekly", "daily", "yearly"], description: "How often this expense occurs" },
      },
      required: ["name", "amount", "frequency"],
    },
  },
  {
    name: "add_calendar_event",
    description: "Schedule a financial event or reminder on the calendar.",
    input_schema: {
      type: "object",
      properties: {
        event_name: { type: "string", description: "Name of the event" },
        event_date: { type: "string", description: "Date in YYYY-MM-DD format" },
        budgeted_amount: { type: "number", description: "Expected amount in Rands" },
        is_recurring: { type: "boolean", description: "Whether this repeats" },
        recurrence_pattern: { type: "string", enum: ["monthly", "weekly", "yearly"], description: "How often it recurs" },
        event_description: { type: "string", description: "Optional description" },
      },
      required: ["event_name", "event_date", "budgeted_amount"],
    },
  },
  {
    name: "list_goals",
    description: "List all of the user's current savings goals with progress.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_budget_items",
    description: "List all of the user's budget plan items.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "delete_goal",
    description: "Delete a savings goal by name. Only use after confirming with the user.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string", description: "Name of the goal to delete (case-insensitive match)" } },
      required: ["name"],
    },
  },
  {
    name: "delete_budget_item",
    description: "Delete a budget item by name. Only use after confirming with the user.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string", description: "Name of the budget item to delete (case-insensitive match)" } },
      required: ["name"],
    },
  },
];

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ result: string; action?: string }> {
  switch (toolName) {
    case "add_goal": {
      const { name, target, months } = toolInput as { name: string; target: number; months: number };
      if (!name || target <= 0 || months < 1 || months > 120) {
        return { result: "Invalid input: name must be non-empty, target must be positive, months between 1-120." };
      }
      const monthlyAllocation = Math.round((target / months) * 100) / 100;
      const { error } = await supabase.from("goals").insert({
        user_id: userId,
        name,
        target,
        months_left: months,
        monthly_allocation: monthlyAllocation,
        current_saved: 0,
      });
      if (error) return { result: `Failed to add goal: ${error.message}` };
      return { result: `Goal "${name}" added: save R${target.toLocaleString()} over ${months} months (R${monthlyAllocation.toLocaleString()}/month).`, action: "goal_added" };
    }

    case "add_budget_item": {
      const { name, amount, frequency } = toolInput as { name: string; amount: number; frequency: string };
      if (!name || amount <= 0) {
        return { result: "Invalid input: name must be non-empty and amount must be positive." };
      }
      const { error } = await supabase.from("budget_items").insert({
        user_id: userId,
        name,
        amount,
        frequency,
      });
      if (error) return { result: `Failed to add budget item: ${error.message}` };
      return { result: `Budget item "${name}" added: R${amount.toLocaleString()} ${frequency}.`, action: "budget_item_added" };
    }

    case "add_calendar_event": {
      const { event_name, event_date, budgeted_amount, is_recurring, recurrence_pattern, event_description } = toolInput as {
        event_name: string; event_date: string; budgeted_amount: number;
        is_recurring?: boolean; recurrence_pattern?: string; event_description?: string;
      };
      if (!event_name || !event_date || budgeted_amount < 0) {
        return { result: "Invalid input: event_name, event_date required, budgeted_amount must be non-negative." };
      }
      const { error } = await supabase.from("calendar_events").insert({
        user_id: userId,
        event_name,
        event_date,
        budgeted_amount,
        is_recurring: is_recurring || false,
        recurrence_pattern: recurrence_pattern || null,
        event_description: event_description || null,
      });
      if (error) return { result: `Failed to add calendar event: ${error.message}` };
      return { result: `Calendar event "${event_name}" scheduled for ${event_date} with budget R${budgeted_amount.toLocaleString()}.`, action: "calendar_event_added" };
    }

    case "list_goals": {
      const { data, error } = await supabase.from("goals").select("name, target, current_saved, months_left, monthly_allocation").eq("user_id", userId);
      if (error) return { result: `Failed to list goals: ${error.message}` };
      if (!data || data.length === 0) return { result: "No savings goals found." };
      const summary = data.map((g: Record<string, unknown>) =>
        `- ${g.name}: R${Number(g.target).toLocaleString()} target, R${Number(g.current_saved || 0).toLocaleString()} saved, ${g.months_left} months left, R${Number(g.monthly_allocation || 0).toLocaleString()}/month`
      ).join("\n");
      return { result: `Current goals:\n${summary}` };
    }

    case "list_budget_items": {
      const { data, error } = await supabase.from("budget_items").select("name, amount, frequency").eq("user_id", userId);
      if (error) return { result: `Failed to list budget items: ${error.message}` };
      if (!data || data.length === 0) return { result: "No budget items found." };
      const summary = data.map((b: Record<string, unknown>) =>
        `- ${b.name}: R${Number(b.amount).toLocaleString()} ${b.frequency}`
      ).join("\n");
      return { result: `Current budget items:\n${summary}` };
    }

    case "delete_goal": {
      const { name } = toolInput as { name: string };
      const { data, error: fetchError } = await supabase.from("goals").select("id, name").eq("user_id", userId).ilike("name", `%${name}%`);
      if (fetchError) return { result: `Failed to find goal: ${fetchError.message}` };
      if (!data || data.length === 0) return { result: `No goal found matching "${name}".` };
      if (data.length > 1) {
        return { result: `Multiple goals match "${name}": ${data.map((g: Record<string, unknown>) => g.name).join(", ")}. Please be more specific.` };
      }
      const { error } = await supabase.from("goals").delete().eq("id", data[0].id);
      if (error) return { result: `Failed to delete goal: ${error.message}` };
      return { result: `Goal "${data[0].name}" has been deleted.`, action: "goal_deleted" };
    }

    case "delete_budget_item": {
      const { name } = toolInput as { name: string };
      const { data, error: fetchError } = await supabase.from("budget_items").select("id, name").eq("user_id", userId).ilike("name", `%${name}%`);
      if (fetchError) return { result: `Failed to find budget item: ${fetchError.message}` };
      if (!data || data.length === 0) return { result: `No budget item found matching "${name}".` };
      if (data.length > 1) {
        return { result: `Multiple budget items match "${name}": ${data.map((b: Record<string, unknown>) => b.name).join(", ")}. Please be more specific.` };
      }
      const { error } = await supabase.from("budget_items").delete().eq("id", data[0].id);
      if (error) return { result: `Failed to delete budget item: ${error.message}` };
      return { result: `Budget item "${data[0].name}" has been deleted.`, action: "budget_item_deleted" };
    }

    default:
      return { result: `Unknown tool: ${toolName}` };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = authData.user.id;
    const { messages } = await req.json();

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user financial context
    const [accountsRes, budgetRes, goalsRes, transactionsRes, settingsRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId),
      supabase.from('budget_items').select('*').eq('user_id', userId),
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('transactions').select('description, amount, transaction_date, balance').eq('user_id', userId).order('transaction_date', { ascending: false }).limit(500),
      supabase.from('user_settings').select('needs_percentage, wants_percentage, savings_percentage, payday_date, budget_method, currency').eq('user_id', userId).single(),
    ]);

    const accounts = accountsRes.data || [];
    const budgetItems = budgetRes.data || [];
    const goals = goalsRes.data || [];
    const transactions = transactionsRes.data || [];
    const settings = settingsRes.data;

    const totalBalance = accounts.reduce((sum: number, a: Record<string, unknown>) => sum + (Number(a.available_balance) || 0), 0);
    const totalBudgeted = budgetItems.reduce((sum: number, b: Record<string, unknown>) => sum + (Number(b.amount) || 0), 0);

    const systemPrompt = `You are Budget Buddy, a friendly and knowledgeable South African financial advisor chatbot for Latela — a personal finance app. You speak in a warm, encouraging tone and use simple language. You understand South African financial context (ZAR currency, local banks, cost of living, etc.).

You have tools available to take actions on behalf of the user. When the user asks you to add a goal, budget item, or calendar event, USE THE APPROPRIATE TOOL instead of just giving advice. When they ask to delete something, confirm first, then use the delete tool.

## User's Financial Snapshot
- **Accounts**: ${accounts.length} account(s), total available balance: R${(totalBalance / 100).toFixed(2)}
- **Budget Method**: ${settings?.budget_method || 'percentage_based'} (${settings?.needs_percentage || 50}/${settings?.wants_percentage || 30}/${settings?.savings_percentage || 20} split)
- **Payday**: Day ${settings?.payday_date || 25} of each month
- **Budget Items**: ${budgetItems.length} items totalling R${(totalBudgeted / 100).toFixed(2)}/month
- **Goals**: ${goals.map((g: Record<string, unknown>) => `${g.name} (target R${g.target}, saved R${g.current_saved || 0})`).join(', ') || 'None set'}
- **Recent Transactions**: ${transactions.length} transactions loaded

## Account Details
${accounts.map((a: Record<string, unknown>) => `- ${a.account_name || a.bank_name || 'Account'} (${a.account_type}): R${((Number(a.available_balance) || 0) / 100).toFixed(2)}`).join('\n')}

## Budget Items
${budgetItems.map((b: Record<string, unknown>) => `- ${b.name}: R${b.amount} (${b.frequency})`).join('\n') || 'No budget items'}

## Recent Spending (last 10)
${transactions.slice(0, 10).map((t: Record<string, unknown>) => `- ${t.description}: R${Math.abs(Number(t.amount)).toFixed(2)} on ${t.transaction_date}`).join('\n') || 'No recent transactions'}

## Guidelines
- Always reference the user's actual data when giving advice
- Amounts in the database are stored in cents — convert to Rands for display
- Be encouraging but honest about financial health
- Suggest actionable steps
- If asked about something you don't have data for, say so honestly
- Keep responses concise but helpful
- Use markdown formatting for readability
- Never reveal raw database values or system internals
- Protect user privacy — never suggest sharing financial data
- When the user asks to CREATE something (goal, budget item, event), USE the tool — don't just describe how
- For DELETE operations, confirm with the user first before executing
- Today's date is ${new Date().toISOString().split('T')[0]}`;

    const anthropicMessages = messages.map((m: Record<string, unknown>) => ({ role: m.role, content: m.content }));

    // First call to Anthropic (may return tool_use)
    const firstResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: systemPrompt,
        messages: anthropicMessages,
        tools,
      }),
    });

    if (!firstResponse.ok) {
      const errorText = await firstResponse.text();
      console.error('Anthropic API error:', firstResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const firstResult = await firstResponse.json();

    // Check if Claude wants to use tools
    const toolUseBlocks = firstResult.content?.filter((b: Record<string, unknown>) => b.type === 'tool_use') || [];

    if (toolUseBlocks.length === 0) {
      // No tools — extract text and return as SSE stream
      const textContent = firstResult.content
        ?.filter((b: Record<string, unknown>) => b.type === 'text')
        .map((b: Record<string, unknown>) => b.text)
        .join('') || '';

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const sseData = JSON.stringify({ choices: [{ delta: { content: textContent } }] });
          controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      });
    }

    // Execute tools and collect results
    const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = [];
    const actions: Array<{ action: string; data: Record<string, unknown> }> = [];

    for (const toolBlock of toolUseBlocks) {
      const { result, action } = await executeTool(toolBlock.name, toolBlock.input, supabase, userId);
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolBlock.id,
        content: result,
      });
      if (action) {
        actions.push({ action, data: toolBlock.input });
      }
    }

    // Second call to Anthropic with tool results — streamed
    const secondResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        stream: true,
        system: systemPrompt,
        messages: [
          ...anthropicMessages,
          { role: 'assistant', content: firstResult.content },
          { role: 'user', content: toolResults },
        ],
        tools,
      }),
    });

    if (!secondResponse.ok) {
      const errorText = await secondResponse.text();
      console.error('Anthropic API error (2nd call):', secondResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform SSE stream
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = secondResponse.body!.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        // First, emit action events so the client can refresh data
        for (const act of actions) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(act)}\n\n`));
        }

        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let newlineIdx: number;
            while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, newlineIdx).trim();
              buffer = buffer.slice(newlineIdx + 1);

              if (!line.startsWith('data: ')) continue;
              const jsonStr = line.slice(6);
              if (jsonStr === '[DONE]') continue;

              try {
                const event = JSON.parse(jsonStr);
                if (event.type === 'content_block_delta' && event.delta?.text) {
                  const sseData = JSON.stringify({
                    choices: [{ delta: { content: event.delta.text } }],
                  });
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                } else if (event.type === 'message_stop') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                }
              } catch {
                // skip
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (e) {
          console.error('Stream error:', e);
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    console.error('chat-financial error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
