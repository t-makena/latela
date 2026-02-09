import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    console.log(`Chat request from user: ${userId}`);

    // Parse request body
    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch financial data in parallel
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoStr = threeMonthsAgo.toISOString();

    const [accountsRes, transactionsRes, budgetItemsRes, goalsRes, settingsRes] =
      await Promise.all([
        supabase
          .from("accounts")
          .select("id, account_name, bank_name, account_type, available_balance, current_balance, currency")
          .eq("user_id", userId),
        supabase
          .from("v_transactions_with_details")
          .select("transaction_date, amount, description, display_merchant_name, parent_category_name, subcategory_name, balance")
          .eq("user_id", userId)
          .gte("transaction_date", threeMonthsAgoStr)
          .order("transaction_date", { ascending: false })
          .limit(500),
        supabase
          .from("budget_items")
          .select("name, amount, frequency, amount_spent, auto_detected")
          .eq("user_id", userId),
        supabase
          .from("goals")
          .select("name, target, current_saved, monthly_allocation, due_date, months_left")
          .eq("user_id", userId),
        supabase
          .from("user_settings")
          .select("payday_date, income_frequency, savings_percentage, needs_percentage, wants_percentage, currency")
          .eq("user_id", userId)
          .single(),
      ]);

    console.log(
      `Fetched: ${accountsRes.data?.length ?? 0} accounts, ${transactionsRes.data?.length ?? 0} transactions, ${budgetItemsRes.data?.length ?? 0} budget items, ${goalsRes.data?.length ?? 0} goals`
    );

    // Build financial context
    const accounts = accountsRes.data || [];
    const transactions = transactionsRes.data || [];
    const budgetItems = budgetItemsRes.data || [];
    const goals = goalsRes.data || [];
    const settings = settingsRes.data;

    // Format accounts
    const accountsSummary = accounts
      .map(
        (a) =>
          `- ${a.account_name || a.bank_name || "Account"} (${a.account_type}): Available R${((a.available_balance || 0) / 100).toFixed(2)}, Current R${((a.current_balance || 0) / 100).toFixed(2)}`
      )
      .join("\n");

    // Format recent transactions (last 50 for context)
    const recentTx = transactions.slice(0, 50);
    const txSummary = recentTx
      .map((t) => {
        const merchant = t.display_merchant_name || t.description || "Unknown";
        const category = t.parent_category_name || "Uncategorized";
        const amount = (t.amount / 100).toFixed(2);
        const date = t.transaction_date
          ? new Date(t.transaction_date).toLocaleDateString("en-ZA")
          : "N/A";
        return `| ${date} | ${merchant} | ${category} | R${amount} |`;
      })
      .join("\n");

    // Calculate spending by category (last 3 months)
    const categorySpending: Record<string, number> = {};
    for (const t of transactions) {
      if (t.amount < 0) {
        const cat = t.parent_category_name || "Uncategorized";
        categorySpending[cat] = (categorySpending[cat] || 0) + Math.abs(t.amount);
      }
    }
    const categoryBreakdown = Object.entries(categorySpending)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amt]) => `- ${cat}: R${(amt / 100).toFixed(2)}`)
      .join("\n");

    // Format budget items
    const budgetSummary = budgetItems
      .map((b) => {
        const spent = b.amount_spent ? (b.amount_spent / 100).toFixed(2) : "0.00";
        return `- ${b.name} (${b.frequency}): Budgeted R${(b.amount / 100).toFixed(2)}, Spent R${spent}${b.auto_detected ? " [auto-detected]" : ""}`;
      })
      .join("\n");

    // Format goals
    const goalsSummary = goals
      .map((g) => {
        const saved = ((g.current_saved || 0) / 100).toFixed(2);
        const target = (g.target / 100).toFixed(2);
        const monthly = ((g.monthly_allocation || 0) / 100).toFixed(2);
        const pct = g.target > 0 ? (((g.current_saved || 0) / g.target) * 100).toFixed(1) : "0";
        return `- ${g.name}: R${saved} / R${target} (${pct}%), Monthly allocation: R${monthly}, Due: ${g.due_date || "N/A"}`;
      })
      .join("\n");

    // Total balance
    const totalAvailable = accounts.reduce(
      (sum, a) => sum + (a.available_balance || 0),
      0
    );

    const today = new Date().toLocaleDateString("en-ZA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const systemPrompt = `You are Budget Buddy, a friendly and knowledgeable South African financial advisor built into the Latela budgeting app. You help users understand and manage their personal finances.

## Important Rules
- Always use South African Rand (R) for currency
- Be conversational, warm, and encouraging
- When presenting numbers, format them clearly (e.g., R1,234.56)
- Use markdown for formatting (tables, bold, lists) when helpful
- Keep responses concise but thorough
- If asked about data you don't have, say so honestly
- Never make up financial data - only use what's provided below
- When calculating monthly spending, note the data covers the last 3 months
- All amounts in the data below are already converted to Rands

## Today's Date
${today}

## User Settings
- Payday: Day ${settings?.payday_date || 25} of each month
- Income frequency: ${settings?.income_frequency || "monthly"}
- Budget split: ${settings?.needs_percentage || 50}% needs, ${settings?.wants_percentage || 30}% wants, ${settings?.savings_percentage || 20}% savings

## Account Balances
Total available: R${(totalAvailable / 100).toFixed(2)}
${accountsSummary || "No accounts found."}

## Budget Items
${budgetSummary || "No budget items set up yet."}

## Savings Goals
${goalsSummary || "No savings goals set up yet."}

## Spending by Category (Last 3 Months)
${categoryBreakdown || "No spending data available."}

## Recent Transactions (Last 50)
| Date | Merchant | Category | Amount |
|------|----------|----------|--------|
${txSummary || "No recent transactions."}`;

    // Call Anthropic API with streaming
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      console.error("ANTHROPIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const anthropicMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    console.log(`Calling Anthropic with ${anthropicMessages.length} messages`);

    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20241022",
          max_tokens: 2048,
          system: systemPrompt,
          messages: anthropicMessages,
          stream: true,
        }),
      }
    );

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error(`Anthropic error ${anthropicResponse.status}: ${errorText}`);

      const statusCode =
        anthropicResponse.status === 429 ? 429 : 500;
      const userMessage =
        statusCode === 429
          ? "Too many requests. Please wait a moment and try again."
          : "Failed to get AI response. Please try again.";

      return new Response(JSON.stringify({ error: userMessage }), {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response back
    console.log("Streaming Anthropic response back to client");
    return new Response(anthropicResponse.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
