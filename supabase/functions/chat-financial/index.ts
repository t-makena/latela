import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    const { messages, conversationId } = await req.json();

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

    const totalBalance = accounts.reduce((sum: number, a: any) => sum + (Number(a.available_balance) || 0), 0);
    const totalBudgeted = budgetItems.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);

    const systemPrompt = `You are Budget Buddy, a friendly and knowledgeable South African financial advisor chatbot for Latela — a personal finance app. You speak in a warm, encouraging tone and use simple language. You understand South African financial context (ZAR currency, local banks, cost of living, etc.).

## User's Financial Snapshot
- **Accounts**: ${accounts.length} account(s), total available balance: R${(totalBalance / 100).toFixed(2)}
- **Budget Method**: ${settings?.budget_method || 'percentage_based'} (${settings?.needs_percentage || 50}/${settings?.wants_percentage || 30}/${settings?.savings_percentage || 20} split)
- **Payday**: Day ${settings?.payday_date || 25} of each month
- **Budget Items**: ${budgetItems.length} items totalling R${(totalBudgeted / 100).toFixed(2)}/month
- **Goals**: ${goals.map((g: any) => `${g.name} (target R${g.target}, saved R${g.current_saved || 0})`).join(', ') || 'None set'}
- **Recent Transactions**: ${transactions.length} transactions loaded

## Account Details
${accounts.map((a: any) => `- ${a.account_name || a.bank_name || 'Account'} (${a.account_type}): R${((Number(a.available_balance) || 0) / 100).toFixed(2)}`).join('\n')}

## Budget Items
${budgetItems.map((b: any) => `- ${b.name}: R${b.amount} (${b.frequency})`).join('\n') || 'No budget items'}

## Recent Spending (last 10)
${transactions.slice(0, 10).map((t: any) => `- ${t.description}: R${Math.abs(t.amount).toFixed(2)} on ${t.transaction_date}`).join('\n') || 'No recent transactions'}

## Guidelines
- Always reference the user's actual data when giving advice
- Amounts in the database are stored in cents — convert to Rands for display
- Be encouraging but honest about financial health
- Suggest actionable steps
- If asked about something you don't have data for, say so honestly
- Keep responses concise but helpful
- Use markdown formatting for readability
- Never reveal raw database values or system internals
- Protect user privacy — never suggest sharing financial data`;

    // Call Anthropic Claude API with streaming
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', anthropicResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform Anthropic SSE to OpenAI-compatible SSE format for the client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = anthropicResponse.body!.getReader();

    const stream = new ReadableStream({
      async start(controller) {
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
                  // Re-emit as OpenAI-compatible SSE
                  const sseData = JSON.stringify({
                    choices: [{ delta: { content: event.delta.text } }],
                  });
                  controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
                } else if (event.type === 'message_stop') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                }
              } catch {
                // skip unparseable lines
              }
            }
          }
          // Final done signal
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
