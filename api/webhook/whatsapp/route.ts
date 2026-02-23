// ─────────────────────────────────────────────────────────────────────────────
// app/api/webhook/whatsapp/route.ts
// Latela WhatsApp Webhook — Next.js App Router
// URL: https://your-domain.com/api/webhook/whatsapp
//
// Architecture:
//   Incoming message → Signature check → Command Router → Handler
//
//   The Command Router inspects the message and decides:
//     • Predetermined response (menu, balance, score, help, etc.)
//     • Claude AI free-form response (Budget Buddy)
//
//   This allows structured conversational flows (numbered menus, quick replies)
//   alongside natural language AI responses — all in one webhook.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendTextMessage,
  sendInteractiveMessage,
  markAsRead,
  type InteractiveMessage,
} from "@/lib/whatsapp";
import {
  processStatement,
  formatParseResultMessage,
} from "@/lib/statementParser";

// ─── Config ──────────────────────────────────────────────────────────────────

const {
  WHATSAPP_VERIFY_TOKEN,
  META_APP_SECRET,
  ANTHROPIC_API_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_000;

// ─── System Prompt (used only for Claude AI path) ────────────────────────────

const SYSTEM_PROMPT = `You are Budget Buddy, Latela's WhatsApp financial assistant for South African users.

CRITICAL RULES:
1. You provide FACTUAL financial information ONLY. Never give financial advice.
   ✅ "Your grocery spending this month is R2,340, which is 23% higher than last month."
   ✅ "You have R52 available per day for the remainder of this week."
   ✅ "Your top 3 spending categories are: Groceries (R3,200), Transport (R1,800), Dining (R950)."
   ❌ NEVER say "You should reduce spending on..." or "I recommend..." or "Consider saving..."

2. All currency is South African Rand (ZAR). Always prefix amounts with "R" (e.g., R1,500).

3. Keep responses concise — WhatsApp messages should be short and scannable.
   Use line breaks for readability. Avoid walls of text.

4. If the user asks for advice, respond with facts and let them draw their own conclusions.
   Example: Instead of "You should cut dining out", say "Your dining spending is R950 this month, up from R620 last month — a 53% increase."

5. If you don't have enough data to answer, say so clearly and suggest the user upload their latest bank statement on the Latela app.

6. Be warm, friendly, and supportive — but never cross the line into advisory territory.

7. You can help with: spending summaries, category breakdowns, budget status, savings progress, transaction lookups, and general financial literacy questions (factual definitions only).

8. If the user seems lost or asks for a menu, remind them they can type "menu" at any time.`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserContext {
  id: string;
  name: string;
  transactions: Array<{
    amount: number;
    category: string | null;
    description: string | null;
    date: string;
  }>;
  budgets: Array<{
    category: string;
    amount: number;
    spent: number | null;
  }>;
  goals: Array<{
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string | null;
  }>;
}

/** The result returned by the command router */
interface RouteResult {
  /** "predetermined" = static/template response, "claude" = forward to AI */
  type: "predetermined" | "claude";
  /** The response text (only for predetermined) */
  response?: string;
  /** Whether to use interactive message templates */
  interactive?: InteractiveMessage;
}

// ─── Session State (Supabase) ────────────────────────────────────────────────
// Tracks where the user is in a conversational flow (e.g. "awaiting_menu_choice")

type SessionState =
  | "idle" // No active flow — default
  | "awaiting_menu" // User was shown the main menu
  | "in_budget_buddy" // User is chatting with Claude
  | "awaiting_confirm"; // Awaiting a yes/no confirmation

async function getSessionState(phoneNumber: string): Promise<SessionState> {
  try {
    const { data } = await supabase
      .from("whatsapp_sessions")
      .select("state")
      .eq("phone_number", phoneNumber)
      .single();

    return (data?.state as SessionState) || "idle";
  } catch {
    return "idle";
  }
}

async function setSessionState(
  phoneNumber: string,
  state: SessionState,
): Promise<void> {
  try {
    await supabase.from("whatsapp_sessions").upsert(
      {
        phone_number: phoneNumber,
        state,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "phone_number" },
    );
  } catch (err: any) {
    console.error("Error setting session state:", err.message);
  }
}

// ─── Utility Helpers ─────────────────────────────────────────────────────────

/** Sleep utility for Claude API retry delays */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Normalise user input for command matching */
function normalise(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "");
}

// ─── Webhook Signature Verification ──────────────────────────────────────────

function verifyWebhookSignature(req: NextRequest, rawBody: string): boolean {
  const signature = req.headers.get("x-hub-signature-256");
  if (!signature || !META_APP_SECRET) return false;

  const expectedSig =
    "sha256=" +
    crypto.createHmac("sha256", META_APP_SECRET).update(rawBody).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig),
    );
  } catch {
    return false;
  }
}

// ─── Supabase: User Context ─────────────────────────────────────────────────
// WhatsApp messaging functions (sendTextMessage, sendInteractiveMessage,
// markAsRead) are imported from @/lib/whatsapp

async function getUserContext(
  phoneNumber: string,
): Promise<UserContext | null> {
  try {
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id, full_name, phone_number")
      .eq("phone_number", phoneNumber)
      .single();

    if (userError || !user) return null;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [{ data: transactions }, { data: budgets }, { data: goals }] =
      await Promise.all([
        supabase
          .from("transactions")
          .select("amount, category, description, date")
          .eq("user_id", user.id)
          .gte("date", thirtyDaysAgo.toISOString())
          .order("date", { ascending: false })
          .limit(50),
        supabase
          .from("budgets")
          .select("category, amount, spent")
          .eq("user_id", user.id)
          .eq("is_active", true),
        supabase
          .from("savings_goals")
          .select("name, target_amount, current_amount, target_date")
          .eq("user_id", user.id),
      ]);

    return {
      id: user.id,
      name: user.full_name,
      transactions: transactions || [],
      budgets: budgets || [],
      goals: goals || [],
    };
  } catch (err: any) {
    console.error("Error fetching user context:", err.message);
    return null;
  }
}

function buildUserContextMessage(context: UserContext | null): string {
  if (!context) {
    return "The user is not registered on Latela yet. Encourage them to sign up at the Latela app to get personalized financial insights.";
  }

  let msg = `User: ${context.name}\n`;

  if (context.transactions.length > 0) {
    const totalSpent = context.transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const categories: Record<string, number> = {};
    context.transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const cat = t.category || "Uncategorized";
        categories[cat] = (categories[cat] || 0) + Math.abs(t.amount);
      });

    const sortedCategories = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    msg += `\nLast 30 days spending: R${totalSpent.toFixed(2)}`;
    msg += `\nTop categories:\n`;
    sortedCategories.forEach(([cat, amount]) => {
      msg += `  - ${cat}: R${amount.toFixed(2)}\n`;
    });
    msg += `Recent transactions: ${context.transactions.length} in the last 30 days.\n`;
  } else {
    msg +=
      "\nNo recent transactions found. The user may need to upload a bank statement.\n";
  }

  if (context.budgets.length > 0) {
    msg += `\nActive budgets:\n`;
    context.budgets.forEach((b) => {
      const remaining = b.amount - (b.spent || 0);
      msg += `  - ${b.category}: R${b.amount} budget, R${(b.spent || 0).toFixed(2)} spent, R${remaining.toFixed(2)} remaining\n`;
    });
  }

  if (context.goals.length > 0) {
    msg += `\nSavings goals:\n`;
    context.goals.forEach((g) => {
      const progress =
        g.target_amount > 0
          ? ((g.current_amount / g.target_amount) * 100).toFixed(1)
          : "0";
      msg += `  - ${g.name}: R${g.current_amount} / R${g.target_amount} (${progress}%)\n`;
    });
  }

  return msg;
}

// ─── Supabase: Conversation History ─────────────────────────────────────────

async function getConversationHistory(
  phoneNumber: string,
  limit = 10,
): Promise<Array<{ role: string; content: string }>> {
  try {
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("role, content, created_at")
      .eq("phone_number", phoneNumber)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).reverse();
  } catch (err: any) {
    console.error("Error fetching conversation history:", err.message);
    return [];
  }
}

async function storeMessage(
  phoneNumber: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  try {
    await supabase.from("whatsapp_messages").insert({
      phone_number: phoneNumber,
      role,
      content,
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Error storing message:", err.message);
  }
}

// ─── Claude Haiku Integration ────────────────────────────────────────────────

async function callClaude(
  messages: Array<{ role: string; content: string }>,
  userContextMessage: string,
): Promise<string> {
  const url = "https://api.anthropic.com/v1/messages";

  const claudeMessages = [
    {
      role: "user" as const,
      content: `[USER FINANCIAL DATA — for reference only, do not repeat raw data back]\n${userContextMessage}`,
    },
    {
      role: "assistant" as const,
      content:
        "Understood. I have the user's financial context and will provide factual insights only.",
    },
    ...messages,
  ];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: claudeMessages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.content
          ?.filter((block: any) => block.type === "text")
          .map((block: any) => block.text)
          .join("\n");

        return text || "I couldn't generate a response. Please try again.";
      }

      const error = await response.json();
      console.error(
        `❌ Claude API error (attempt ${attempt}/${MAX_RETRIES}):`,
        error,
      );

      if (response.status === 401 || response.status === 422) {
        throw new Error(`Claude API error: ${JSON.stringify(error)}`);
      }

      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    } catch (err: any) {
      console.error(
        `❌ Claude call failed (attempt ${attempt}/${MAX_RETRIES}):`,
        err.message,
      );
      if (attempt === MAX_RETRIES) {
        return "Sorry, I'm having trouble right now. Please try again in a moment! 🙏";
      }
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  return "Sorry, I'm having trouble right now. Please try again in a moment! 🙏";
}

// ═════════════════════════════════════════════════════════════════════════════
// ██  COMMAND ROUTER                                                       ██
// ═════════════════════════════════════════════════════════════════════════════
//
// This is the brain of the webhook. It inspects each incoming message and
// decides whether to respond with a predetermined template or forward to
// Claude for a natural AI response.
//
// Flow:
//   "hi" / "menu" / "start"  →  Show main menu (interactive buttons)
//   "1" / "balance"          →  Predetermined balance lookup from Supabase
//   "2" / "score"            →  Predetermined Latela Score response
//   "3" / "chat" / "buddy"   →  Enter Budget Buddy (Claude AI) mode
//   "back" / "exit"          →  Return to main menu from any flow
//   (anything else)          →  Depends on session state
//
// ─── Adding New Commands ─────────────────────────────────────────────────
// To add a new predetermined flow:
//   1. Add a new match condition in routeCommand()
//   2. Create a handler function (like handleBalanceCommand)
//   3. Wire it into processMessage()
//   4. Optionally add a button/list entry in getMainMenu()
//
// To add a new Claude-powered flow with a different system prompt:
//   1. Create a new system prompt constant
//   2. Add a new SessionState value
//   3. Route to a variant of callClaude() with the new prompt
// ═════════════════════════════════════════════════════════════════════════════

/** Predetermined response: Main menu with interactive buttons */
function getMainMenu(): InteractiveMessage {
  return {
    type: "button",
    header: "Latela 💰",
    body: "Hi there! 👋 How can I help you today?\n\nPlease choose an option below, or type your choice:",
    footer: "Type 'menu' at any time to see this again",
    buttons: [
      { id: "cmd_balance", title: "💳 Balance" },
      { id: "cmd_score", title: "📊 Latela Score" },
      { id: "cmd_chat", title: "💬 Budget Buddy" },
    ],
  };
}

/** Predetermined response: Balance summary (no AI needed — pure Supabase) */
async function handleBalanceCommand(
  userContext: UserContext | null,
): Promise<string> {
  if (!userContext) {
    return "I don't have your account linked yet. 🔗\n\nPlease sign up on the Latela app and connect your bank account to see your balance here.\n\nType *menu* to go back.";
  }

  const { transactions, budgets } = userContext;

  if (transactions.length === 0) {
    return `Hi ${userContext.name}! 👋\n\nI don't see any recent transactions. Please upload your latest bank statement on the Latela app so I can give you an overview.\n\nType *menu* to go back.`;
  }

  const totalSpent = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  let response = `💳 *${userContext.name}'s 30-Day Summary*\n\n`;
  response += `Income: R${totalIncome.toFixed(2)}\n`;
  response += `Spending: R${totalSpent.toFixed(2)}\n`;
  response += `Net: R${(totalIncome - totalSpent).toFixed(2)}\n`;

  if (budgets.length > 0) {
    response += `\n📋 *Budget Status:*\n`;
    budgets.forEach((b) => {
      const spent = b.spent || 0;
      const remaining = b.amount - spent;
      const pct = ((spent / b.amount) * 100).toFixed(0);
      const bar = remaining > 0 ? "✅" : "🔴";
      response += `${bar} ${b.category}: R${spent.toFixed(0)} / R${b.amount} (${pct}%)\n`;
    });
  }

  response += `\nType *menu* to go back or *3* to chat with Budget Buddy.`;
  return response;
}

/** Predetermined response: Latela Score */
async function handleScoreCommand(
  userContext: UserContext | null,
): Promise<string> {
  if (!userContext) {
    return "I need your account linked to calculate your Latela Score. 📊\n\nSign up on the Latela app to get started!\n\nType *menu* to go back.";
  }

  // TODO: Replace with actual score calculation from a `latela_scores` table
  // This is a placeholder heuristic to demonstrate the flow
  const { transactions, budgets, goals } = userContext;

  let score = 50; // Base score
  const breakdown: string[] = [];

  // Factor 1: Tracking activity
  if (transactions.length > 10) {
    score += 10;
    breakdown.push("✅ Active tracking (+10)");
  } else if (transactions.length > 0) {
    score += 5;
    breakdown.push("🟡 Some tracking (+5)");
  } else {
    breakdown.push("❌ No tracking (0)");
  }

  // Factor 2: Budgets set
  if (budgets.length > 0) {
    score += 15;
    breakdown.push("✅ Budgets active (+15)");

    // Factor 3: Under budget?
    const underBudget = budgets.filter(
      (b) => (b.spent || 0) <= b.amount,
    ).length;
    if (underBudget === budgets.length) {
      score += 10;
      breakdown.push("✅ All under budget (+10)");
    } else {
      score += 5;
      breakdown.push("🟡 Some over budget (+5)");
    }
  } else {
    breakdown.push("❌ No budgets set (0)");
  }

  // Factor 4: Savings goals
  if (goals.length > 0) {
    score += 10;
    breakdown.push("✅ Savings goals set (+10)");

    const avgProgress =
      goals.reduce((sum, g) => {
        return (
          sum + (g.target_amount > 0 ? g.current_amount / g.target_amount : 0)
        );
      }, 0) / goals.length;

    if (avgProgress > 0.5) {
      score += 5;
      breakdown.push("✅ Good savings progress (+5)");
    }
  }

  score = Math.min(score, 100);

  let emoji = "🔴";
  if (score >= 80) emoji = "🟢";
  else if (score >= 60) emoji = "🟡";

  let response = `📊 *Your Latela Score: ${emoji} ${score}/100*\n\n`;
  response += `*Breakdown:*\n${breakdown.join("\n")}\n\n`;

  if (score < 60) {
    response += `💡 *To improve:* Set budgets, track spending regularly, and create a savings goal on the Latela app.`;
  } else if (score < 80) {
    response += `💡 *Almost there:* Keep tracking and stay within your budgets to push past 80!`;
  } else {
    response += `🎉 *Great work!* You're on top of your finances.`;
  }

  response += `\n\nType *menu* to go back or *3* to chat with Budget Buddy.`;
  return response;
}

/** Predetermined response: Personalised greeting */
async function handleGreetingCommand(
  userContext: UserContext | null,
): Promise<string> {
  const name = userContext?.name || "there";

  return (
    `Hi ${name}! Welcome back to Latela. 👋\n\n` +
    `Here's what I can help with:\n` +
    `💳 *"Balance"* — See your 30-day summary\n` +
    `📊 *"Score"* — Your Latela Score\n` +
    `💰 *"Budget"* — Monthly budget status\n` +
    `📂 *"Spending"* — Category breakdown\n` +
    `💬 *"Chat"* — Talk to Budget Buddy (AI)\n` +
    `❓ *"Help"* — Full command list\n\n` +
    `What would you like to know?`
  );
}

/** Predetermined response: Current month budget status */
async function handleBudgetCommand(
  phoneNumber: string,
  userContext: UserContext | null,
): Promise<string> {
  if (!userContext) {
    return "I need your account linked to check your budget. 🔗\n\nSign up on the Latela app to get started!\n\nType *menu* to go back.";
  }

  // Get current month's transactions directly (more precise than the 30-day window)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, category")
    .eq("user_id", userContext.id)
    .gte("date", startOfMonth.toISOString());

  const totalSpent =
    transactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

  // Check for a monthly overall budget
  const { data: budget } = await supabase
    .from("budgets")
    .select("amount")
    .eq("user_id", userContext.id)
    .eq("is_active", true)
    .eq("category", "Overall")
    .single();

  const limit = budget?.amount || 0;
  const remaining = limit - totalSpent;
  const pct = limit > 0 ? Math.round((totalSpent / limit) * 100) : 0;

  const monthLabel = new Date().toLocaleString("en-ZA", {
    month: "long",
    year: "numeric",
  });

  let response = `💰 *Budget Status — ${monthLabel}*\n\n`;
  response += `Total Spent: R${totalSpent.toFixed(2)}\n`;

  if (limit > 0) {
    response += `Budget Limit: R${limit.toFixed(2)}\n`;
    response += `Remaining: R${remaining.toFixed(2)}\n`;
    response += `Used: ${pct}%\n\n`;
    response +=
      pct > 90
        ? "⚠️ You're close to your limit!"
        : "✅ Looking good, keep it up!";
  } else {
    response += `\nYou don't have an overall monthly budget set yet. You can create one in the Latela app.`;
  }

  // Also show per-category budgets if they exist
  if (userContext.budgets.length > 0) {
    response += `\n\n📋 *Category Budgets:*\n`;
    userContext.budgets.forEach((b) => {
      const spent = b.spent || 0;
      const catRemaining = b.amount - spent;
      const catPct = ((spent / b.amount) * 100).toFixed(0);
      const icon = catRemaining > 0 ? "✅" : "🔴";
      response += `${icon} ${b.category}: R${spent.toFixed(0)} / R${b.amount} (${catPct}%)\n`;
    });
  }

  response += `\n\nType *menu* to go back.`;
  return response;
}

/** Predetermined response: Spending category breakdown */
async function handleSpendingCommand(
  userContext: UserContext | null,
): Promise<string> {
  if (!userContext) {
    return "I need your account linked to show spending. 🔗\n\nSign up on the Latela app to get started!\n\nType *menu* to go back.";
  }

  const { transactions } = userContext;
  const expenses = transactions.filter((t) => t.amount < 0);

  if (expenses.length === 0) {
    return `Hi ${userContext.name}! 👋\n\nNo spending data found for the last 30 days. Upload your latest bank statement on the Latela app.\n\nType *menu* to go back.`;
  }

  const totalSpent = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Build category breakdown
  const categories: Record<string, number> = {};
  expenses.forEach((t) => {
    const cat = t.category || "Uncategorized";
    categories[cat] = (categories[cat] || 0) + Math.abs(t.amount);
  });

  const sorted = Object.entries(categories).sort(([, a], [, b]) => b - a);

  let response = `📂 *Spending Breakdown (Last 30 Days)*\n\n`;
  response += `Total: R${totalSpent.toFixed(2)}\n\n`;

  sorted.forEach(([cat, amount], i) => {
    const pct = ((amount / totalSpent) * 100).toFixed(0);
    const bar = i === 0 ? "🔴" : i < 3 ? "🟡" : "🟢";
    response += `${bar} ${cat}: R${amount.toFixed(2)} (${pct}%)\n`;
  });

  response += `\n${sorted.length} categories across ${expenses.length} transactions.`;
  response += `\n\nType *menu* to go back or *3* to ask Budget Buddy more.`;
  return response;
}

/** Predetermined response: Help / full command list */
function handleHelpCommand(): string {
  return (
    `📖 *Latela — Full Command List*\n\n` +
    `💳 *"Balance"* — 30-day income & spending summary\n` +
    `💰 *"Budget"* — Monthly budget status with limits\n` +
    `📂 *"Spending"* — Category breakdown of your spending\n` +
    `📊 *"Score"* — Your Latela financial health score\n` +
    `📄 *"Statement"* — Upload a bank statement (PDF or photo)\n` +
    `💬 *"Chat"* or *"3"* — Talk to Budget Buddy (AI)\n` +
    `🏠 *"Menu"* — Main menu with quick buttons\n` +
    `↩️ *"Back"* — Return to main menu\n\n` +
    `Or just ask a question in plain English and Budget Buddy will help!\n\n` +
    `Manage your account at latela.co.za`
  );
}
async function routeCommand(
  messageText: string,
  phoneNumber: string,
  sessionState: SessionState,
  buttonId?: string, // from interactive button replies
): Promise<RouteResult> {
  const input = normalise(messageText);

  // ── Global commands (work from ANY state, including Budget Buddy) ────────

  // Greeting — personalised welcome with quick options
  if (["hi", "hello", "hey", "howzit", "hiya"].includes(input)) {
    await setSessionState(phoneNumber, "awaiting_menu");
    return { type: "predetermined" }; // "greeting" handler in processMessage
  }

  // Main menu — interactive buttons
  if (["menu", "start", "home"].includes(input) || buttonId === "cmd_menu") {
    await setSessionState(phoneNumber, "awaiting_menu");
    return { type: "predetermined", interactive: getMainMenu() };
  }

  // Help — full text command list
  if (input === "help") {
    await setSessionState(phoneNumber, "idle");
    return { type: "predetermined", response: handleHelpCommand() };
  }

  // Exit / back — return to menu
  if (["back", "exit", "stop", "quit", "0"].includes(input)) {
    await setSessionState(phoneNumber, "awaiting_menu");
    return { type: "predetermined", interactive: getMainMenu() };
  }

  // ── Numbered menu options ────────────────────────────────────────────────

  // 1 / Balance
  if (input === "1" || input === "balance" || buttonId === "cmd_balance") {
    await setSessionState(phoneNumber, "idle");
    return { type: "predetermined" }; // handler in processMessage
  }

  // 2 / Latela Score
  if (
    input === "2" ||
    input === "score" ||
    input === "latela score" ||
    buttonId === "cmd_score"
  ) {
    await setSessionState(phoneNumber, "idle");
    return { type: "predetermined" }; // handler in processMessage
  }

  // 3 / Chat with Budget Buddy (enter Claude AI mode)
  if (
    input === "3" ||
    input === "chat" ||
    input === "buddy" ||
    input === "budget buddy" ||
    buttonId === "cmd_chat"
  ) {
    await setSessionState(phoneNumber, "in_budget_buddy");
    return {
      type: "predetermined",
      response:
        "💬 *Budget Buddy is here!*\n\nAsk me anything about your finances — spending breakdown, budget status, savings progress, or just a quick summary.\n\nType *back* to return to the menu.",
    };
  }

  // ── Keyword commands ─────────────────────────────────────────────────────

  // Budget status
  if (input === "budget" || input === "budgets") {
    await setSessionState(phoneNumber, "idle");
    return { type: "predetermined" }; // handler in processMessage
  }

  // Spending / category breakdown
  if (input === "spending" || input === "categories" || input === "breakdown") {
    await setSessionState(phoneNumber, "idle");
    return { type: "predetermined" }; // handler in processMessage
  }

  // Statement upload prompt
  if (
    input === "statement" ||
    input === "upload" ||
    input === "bank statement"
  ) {
    await setSessionState(phoneNumber, "idle");
    return {
      type: "predetermined",
      response:
        "📄 *Upload Your Bank Statement*\n\n" +
        "Send me your statement as:\n\n" +
        "📎 *PDF* — Download from your banking app and send it here\n" +
        "📸 *Photo* — Take a screenshot or photo of your statement\n\n" +
        "I support FNB, Standard Bank, ABSA, Nedbank, Capitec, TymeBank, and Discovery Bank.\n\n" +
        "Just send the file and I'll process it automatically! 🚀",
    };
  }

  // ── Session-aware routing ────────────────────────────────────────────────

  // If user is in Budget Buddy mode, forward everything to Claude
  if (sessionState === "in_budget_buddy") {
    return { type: "claude" };
  }

  // If user was shown the menu and typed something unexpected
  if (sessionState === "awaiting_menu") {
    return {
      type: "predetermined",
      response:
        "I didn't quite catch that. 🤔\n\nPlease choose:\n1️⃣ Balance\n2️⃣ Latela Score\n3️⃣ Chat with Budget Buddy\n\nOr type *budget*, *spending*, or *help* for more.\n\nType *menu* to see the buttons again.",
    };
  }

  // ── Default: First-time user or idle — show menu ─────────────────────────
  await setSessionState(phoneNumber, "awaiting_menu");
  return { type: "predetermined", interactive: getMainMenu() };
}

// ─── Message Processing Pipeline ─────────────────────────────────────────────

async function processMessage(
  userPhone: string,
  messageText: string,
  messageId: string,
  buttonId?: string,
): Promise<void> {
  try {
    // 1. Mark as read
    await markAsRead(messageId);

    // 2. Get session state
    const sessionState = await getSessionState(userPhone);

    // 3. Route the command
    const route = await routeCommand(
      messageText,
      userPhone,
      sessionState,
      buttonId,
    );

    // 4. Handle predetermined responses
    if (route.type === "predetermined") {
      // Interactive message (buttons/list)
      if (route.interactive) {
        await sendInteractiveMessage(userPhone, route.interactive);
        return;
      }

      // Predetermined handlers that need Supabase data
      const input = normalise(messageText);

      // Greeting
      if (["hi", "hello", "hey", "howzit", "hiya"].includes(input)) {
        const userContext = await getUserContext(userPhone);
        const response = await handleGreetingCommand(userContext);
        await sendTextMessage(userPhone, response);
        return;
      }

      // Balance
      if (input === "1" || input === "balance" || buttonId === "cmd_balance") {
        const userContext = await getUserContext(userPhone);
        const response = await handleBalanceCommand(userContext);
        await sendTextMessage(userPhone, response);
        return;
      }

      // Latela Score
      if (
        input === "2" ||
        input === "score" ||
        input === "latela score" ||
        buttonId === "cmd_score"
      ) {
        const userContext = await getUserContext(userPhone);
        const response = await handleScoreCommand(userContext);
        await sendTextMessage(userPhone, response);
        return;
      }

      // Budget status
      if (input === "budget" || input === "budgets") {
        const userContext = await getUserContext(userPhone);
        const response = await handleBudgetCommand(userPhone, userContext);
        await sendTextMessage(userPhone, response);
        return;
      }

      // Spending / category breakdown
      if (
        input === "spending" ||
        input === "categories" ||
        input === "breakdown"
      ) {
        const userContext = await getUserContext(userPhone);
        const response = await handleSpendingCommand(userContext);
        await sendTextMessage(userPhone, response);
        return;
      }

      // Generic predetermined text response (help, error messages, etc.)
      if (route.response) {
        await sendTextMessage(userPhone, route.response);
        return;
      }
    }

    // 5. Handle Claude AI path (Budget Buddy)
    if (route.type === "claude") {
      const userContext = await getUserContext(userPhone);
      const userContextMessage = buildUserContextMessage(userContext);

      const history = await getConversationHistory(userPhone);

      await storeMessage(userPhone, "user", messageText);

      const messages = [
        ...history.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user", content: messageText },
      ];

      const claudeResponse = await callClaude(messages, userContextMessage);

      await storeMessage(userPhone, "assistant", claudeResponse);

      await sendTextMessage(userPhone, claudeResponse);
    }
  } catch (err) {
    console.error("❌ Error processing message:", err);

    try {
      await sendTextMessage(
        userPhone,
        "Oops! Something went wrong on my end. Please try again in a moment. 🙏",
      );
    } catch (sendErr: any) {
      console.error("❌ Failed to send error message:", sendErr.message);
    }
  }
}

// ─── Statement Upload Processing ─────────────────────────────────────────────

/**
 * Handle a document or image sent via WhatsApp — assumed to be a bank statement.
 */
async function processStatementUpload(
  userPhone: string,
  mediaId: string,
  mimeType: string,
  messageId: string,
): Promise<void> {
  try {
    await markAsRead(messageId);

    // Look up the user
    const { data: user } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("phone_number", userPhone)
      .single();

    if (!user) {
      await sendTextMessage(
        userPhone,
        "I'd love to process your statement, but I don't have your account linked yet. 🔗\n\nPlease sign up on the Latela app first, then try sending your statement again.\n\nType *menu* for options.",
      );
      return;
    }

    // Let the user know we're working on it (statements take a few seconds)
    await sendTextMessage(
      userPhone,
      `📄 Got your statement, ${user.full_name}! Hang tight — I'm reading through it now... ⏳`,
    );

    // Process the statement
    const result = await processStatement(mediaId, mimeType, user.id);

    // Send the result
    const message = formatParseResultMessage(result);
    await sendTextMessage(userPhone, message);
  } catch (err) {
    console.error("❌ Error processing statement:", err);

    try {
      await sendTextMessage(
        userPhone,
        "Oops! Something went wrong while processing your statement. Please try again or upload it via the Latela app.\n\nType *menu* for options.",
      );
    } catch (sendErr: any) {
      console.error("❌ Failed to send error message:", sendErr.message);
    }
  }
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

/**
 * GET /api/whatsapp/webhook — Meta webhook verification
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("⚠️ Webhook verification failed");
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * POST /api/whatsapp/webhook — Incoming messages & status updates
 */
export async function POST(req: NextRequest) {
  // ── Verify signature ─────────────────────────────────────────────────────
  const rawBody = await req.text();

  if (!verifyWebhookSignature(req, rawBody)) {
    console.warn("⚠️ Invalid webhook signature — rejecting request");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.warn("⚠️ Malformed JSON payload — rejecting request");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // ── Status updates ───────────────────────────────────────────────────
    if (value?.statuses) {
      const status = value.statuses[0];
      console.log(`Message ${status.id}: ${status.status}`);
    }

    // ── Incoming messages ────────────────────────────────────────────────
    if (value?.messages && value.messages.length > 0) {
      const message = value.messages[0];
      const userPhone: string = message.from;

      // Handle text messages
      if (message.type === "text") {
        const messageText = message.text.body.trim();
        if (!messageText) return NextResponse.json({ status: "ok" });

        console.log(
          `📩 Text from ${userPhone}: ${messageText.substring(0, 100)}`,
        );
        await processMessage(userPhone, messageText, message.id);
      }

      // Handle interactive button replies (when user taps a button)
      else if (message.type === "interactive") {
        const interactiveType = message.interactive?.type;

        if (interactiveType === "button_reply") {
          const buttonId = message.interactive.button_reply.id;
          const buttonTitle = message.interactive.button_reply.title;

          console.log(
            `🔘 Button from ${userPhone}: ${buttonTitle} (${buttonId})`,
          );
          await processMessage(userPhone, buttonTitle, message.id, buttonId);
        } else if (interactiveType === "list_reply") {
          const listId = message.interactive.list_reply.id;
          const listTitle = message.interactive.list_reply.title;

          console.log(
            `📋 List selection from ${userPhone}: ${listTitle} (${listId})`,
          );
          await processMessage(userPhone, listTitle, message.id, listId);
        }
      }

      // Handle document uploads (PDF bank statements)
      else if (message.type === "document") {
        const doc = message.document;
        const mimeType = doc.mime_type || "application/pdf";

        // Accept PDFs and common document types
        const supportedDocTypes = [
          "application/pdf",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "text/csv",
        ];

        if (
          supportedDocTypes.some((t) => mimeType.includes(t) || mimeType === t)
        ) {
          console.log(
            `📄 Document from ${userPhone}: ${doc.filename || "unnamed"} (${mimeType})`,
          );
          await processStatementUpload(userPhone, doc.id, mimeType, message.id);
        } else {
          await sendTextMessage(
            userPhone,
            `I can't process that file type (${mimeType}). Please send your bank statement as a *PDF* or take a *photo/screenshot* of it.\n\nType *menu* for options.`,
          );
        }
      }

      // Handle image uploads (photos/screenshots of statements)
      else if (message.type === "image") {
        const image = message.image;
        const mimeType = image.mime_type || "image/jpeg";

        console.log(`🖼️ Image from ${userPhone}: ${mimeType}`);
        await processStatementUpload(userPhone, image.id, mimeType, message.id);
      }

      // Handle unsupported message types (audio, video, stickers, etc.)
      else {
        await sendTextMessage(
          userPhone,
          'Hey there! 👋 I can read text messages and bank statements (PDF or photo).\n\nSend me a message like *"menu"* to get started, or send your bank statement to upload it!',
        );
      }
    }
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
  }

  return NextResponse.json({ status: "ok" });
}
