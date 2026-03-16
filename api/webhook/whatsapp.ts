// ─────────────────────────────────────────────────────────────────────────────
// api/webhook/whatsapp.ts
// Latela WhatsApp Webhook — Vercel Serverless Function
// URL: https://latela.vercel.app/api/webhook/whatsapp
//
// NOTE: This uses Vercel's serverless format (VercelRequest/VercelResponse),
//       NOT Next.js. Your project is Vite + React.
//
// All WhatsApp messaging, command routing, and Claude integration is
// self-contained in this file to avoid import issues with Vercel functions.
// ─────────────────────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ─── Config ──────────────────────────────────────────────────────────────────

const {
  WHATSAPP_VERIFY_TOKEN,
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  META_APP_SECRET,
  ANTHROPIC_API_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_000;
const WHATSAPP_API_VERSION = "v21.0";

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Budget Buddy, Latela's WhatsApp financial assistant for South African users.

CRITICAL RULES:
1. You provide FACTUAL financial information ONLY. Never give financial advice.
2. All currency is South African Rand (ZAR). Always prefix amounts with "R".
3. Keep responses concise — WhatsApp messages should be short and scannable.
4. If the user asks for advice, respond with facts and let them draw their own conclusions.
5. If you don't have enough data to answer, say so clearly and suggest uploading a bank statement.
6. Be warm, friendly, and supportive — but never cross the line into advisory territory.
7. You can help with: spending summaries, category breakdowns, budget status, savings progress, transaction lookups, and general financial literacy questions (factual definitions only).
8. If the user seems lost, remind them they can type "menu" at any time.`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserContext {
  id: string;
  name: string;
  accounts: Array<{
    account_name: string | null;
    bank_name: string | null;
    available_balance: number | null;
    current_balance: number | null;
  }>;
  transactions: Array<{
    amount: number;
    description: string | null;
    transaction_date: string;
    parent_category_name: string | null;
  }>;
  budgetItems: Array<{ name: string; amount: number; amount_spent: number | null; frequency: string }>;
  goals: Array<{
    name: string;
    target: number;
    current_saved: number | null;
    due_date: string | null;
    monthly_allocation: number | null;
  }>;
  settings: {
    needs_percentage: number;
    wants_percentage: number;
    savings_percentage: number;
    payday_date: number | null;
    budget_method: string;
  };
  upcomingEvents: Array<{
    event_name: string;
    event_date: string;
    budgeted_amount: number;
    category: string | null;
  }>;
}

interface RouteResult {
  type: "predetermined" | "claude";
  response?: string;
  interactive?: InteractiveMessage;
}

interface InteractiveMessage {
  type: "button" | "list";
  header?: string;
  body: string;
  footer?: string;
  buttons?: Array<{ id: string; title: string }>;
  sections?: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}

type SessionState =
  | "idle"
  | "awaiting_menu"
  | "in_budget_buddy"
  | "awaiting_confirm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "");
}

// ─── Session State ───────────────────────────────────────────────────────────

async function getSessionState(phone: string): Promise<SessionState> {
  try {
    const { data } = await supabase
      .from("whatsapp_sessions")
      .select("state")
      .eq("phone_number", phone)
      .single();
    return (data?.state as SessionState) || "idle";
  } catch {
    return "idle";
  }
}

async function setSessionState(
  phone: string,
  state: SessionState,
): Promise<void> {
  try {
    await supabase
      .from("whatsapp_sessions")
      .upsert(
        { phone_number: phone, state, updated_at: new Date().toISOString() },
        { onConflict: "phone_number" },
      );
  } catch (err: any) {
    console.error("Session state error:", err.message);
  }
}

// ─── Signature Verification ──────────────────────────────────────────────────

function verifySignature(
  signatureHeader: string | undefined,
  rawBody: string,
): boolean {
  if (!signatureHeader || !META_APP_SECRET) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", META_APP_SECRET).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

// ─── WhatsApp Messaging ──────────────────────────────────────────────────────

function splitMessage(text: string, max = 4000): string[] {
  if (text.length <= max) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= max) {
      chunks.push(remaining);
      break;
    }
    let idx = remaining.lastIndexOf("\n", max);
    if (idx < max * 0.5) idx = remaining.lastIndexOf(" ", max);
    if (idx < max * 0.5) idx = max;
    chunks.push(remaining.substring(0, idx).trimEnd());
    remaining = remaining.substring(idx).trimStart();
  }
  return chunks;
}

async function waFetch<T = any>(
  endpoint: string,
  body: Record<string, any>,
): Promise<T> {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/${endpoint}`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (resp.ok) return (await resp.json()) as T;
      const error = await resp.json();
      console.error(`❌ WA API error (${attempt}/${MAX_RETRIES}):`, error);
      if (resp.status >= 400 && resp.status < 500)
        throw new Error(`WA API ${resp.status}: ${JSON.stringify(error)}`);
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    } catch (err: any) {
      if (err.message?.startsWith("WA API")) throw err;
      if (attempt === MAX_RETRIES) throw err;
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  throw new Error("WA API: max retries exceeded");
}

async function sendText(to: string, body: string): Promise<void> {
  for (const chunk of splitMessage(body)) {
    const r = await waFetch("messages", {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: chunk },
    });
    console.log(`✅ Sent to ${to}:`, r.messages?.[0]?.id);
  }
}

async function sendInteractive(
  to: string,
  msg: InteractiveMessage,
): Promise<void> {
  const base: any = {
    ...(msg.header && { header: { type: "text", text: msg.header } }),
    body: { text: msg.body },
    ...(msg.footer && { footer: { text: msg.footer } }),
  };
  const interactive =
    msg.type === "button"
      ? {
          type: "button",
          ...base,
          action: {
            buttons: (msg.buttons || []).map((b) => ({
              type: "reply",
              reply: { id: b.id, title: b.title },
            })),
          },
        }
      : {
          type: "list",
          ...base,
          action: { button: "Choose an option", sections: msg.sections || [] },
        };
  try {
    await waFetch("messages", {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive,
    });
    console.log(`✅ Interactive sent to ${to}`);
  } catch (err: any) {
    console.warn(`⚠️ Interactive failed, text fallback: ${err.message}`);
    await sendText(to, msg.body);
  }
}

async function markRead(messageId: string): Promise<void> {
  try {
    await waFetch("messages", {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    });
  } catch (err: any) {
    console.error("Mark read failed:", err.message);
  }
}

// ─── Supabase: User Context ─────────────────────────────────────────────────

async function getUserContext(phone: string): Promise<UserContext | null> {
  try {
    // Look up user via user_settings (mobile or phone_number field)
    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("user_id, first_name, last_name, display_name, needs_percentage, wants_percentage, savings_percentage, payday_date, budget_method")
      .or(`mobile.eq.${phone},phone_number.eq.${phone}`)
      .single();
    if (error || !settings) return null;

    const userId = settings.user_id;
    const name = settings.display_name || settings.first_name || "there";
    const ago30 = new Date();
    ago30.setDate(ago30.getDate() - 30);

    const [{ data: accounts }, { data: tx }, { data: budgetItems }, { data: goals }, { data: events }] =
      await Promise.all([
        supabase
          .from("accounts")
          .select("account_name, bank_name, available_balance, current_balance")
          .eq("user_id", userId)
          .eq("is_active", true),
        supabase
          .from("v_transactions_with_details")
          .select("amount, description, transaction_date, parent_category_name")
          .eq("user_id", userId)
          .gte("transaction_date", ago30.toISOString())
          .order("transaction_date", { ascending: false })
          .limit(50),
        supabase
          .from("budget_items")
          .select("name, amount, amount_spent, frequency")
          .eq("user_id", userId),
        supabase
          .from("goals")
          .select("name, target, current_saved, due_date, monthly_allocation")
          .eq("user_id", userId),
        supabase
          .from("calendar_events")
          .select("event_name, event_date, budgeted_amount, category")
          .eq("user_id", userId)
          .gte("event_date", new Date().toISOString().split("T")[0])
          .order("event_date", { ascending: true })
          .limit(10),
      ]);

    return {
      id: userId,
      name,
      accounts: accounts || [],
      transactions: tx || [],
      budgetItems: budgetItems || [],
      goals: goals || [],
      settings: {
        needs_percentage: settings.needs_percentage,
        wants_percentage: settings.wants_percentage,
        savings_percentage: settings.savings_percentage,
        payday_date: settings.payday_date,
        budget_method: settings.budget_method,
      },
      upcomingEvents: events || [],
    };
  } catch (err: any) {
    console.error("User context error:", err.message);
    return null;
  }
}

function buildContextMsg(ctx: UserContext | null): string {
  if (!ctx) return "User is not registered on Latela yet.";
  let msg = `User: ${ctx.name}\n`;
  if (ctx.accounts.length > 0) {
    msg += `\nAccounts:\n`;
    ctx.accounts.forEach((a) => {
      msg += `  - ${a.account_name || a.bank_name || "Account"}: Available R${((a.available_balance || 0) / 100).toFixed(2)}\n`;
    });
  }
  if (ctx.transactions.length > 0) {
    const spent = ctx.transactions
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const cats: Record<string, number> = {};
    ctx.transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const c = t.parent_category_name || "Uncategorized";
        cats[c] = (cats[c] || 0) + Math.abs(t.amount);
      });
    const sorted = Object.entries(cats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    msg += `\nSpending (30d): R${spent.toFixed(2)}\nTop categories:\n`;
    sorted.forEach(([c, a]) => {
      msg += `  - ${c}: R${a.toFixed(2)}\n`;
    });
  } else {
    msg += "\nNo recent transactions.\n";
  }
  if (ctx.budgetItems.length > 0) {
    msg += `\nBudget Items:\n`;
    ctx.budgetItems.forEach((b) => {
      msg += `  - ${b.name}: R${(b.amount_spent || 0).toFixed(2)} / R${b.amount} (${b.frequency})\n`;
    });
  }
  if (ctx.goals.length > 0) {
    msg += `\nGoals:\n`;
    ctx.goals.forEach((g) => {
      const saved = g.current_saved || 0;
      const p = g.target > 0 ? ((saved / g.target) * 100).toFixed(1) : "0";
      msg += `  - ${g.name}: R${saved} / R${g.target} (${p}%)\n`;
    });
  }
  if (ctx.upcomingEvents.length > 0) {
    msg += `\nUpcoming Events:\n`;
    ctx.upcomingEvents.forEach((e) => {
      msg += `  - ${e.event_name} on ${e.event_date}: R${e.budgeted_amount}\n`;
    });
  }
  msg += `\nBudget split: ${ctx.settings.needs_percentage}/${ctx.settings.wants_percentage}/${ctx.settings.savings_percentage} (Needs/Wants/Savings)`;
  return msg;
}

// ─── Conversation History ────────────────────────────────────────────────────

async function getHistory(
  phone: string,
  limit = 10,
): Promise<Array<{ role: string; content: string }>> {
  try {
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .select("role, content, created_at")
      .eq("phone_number", phone)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).reverse();
  } catch {
    return [];
  }
}

async function storeMsg(
  phone: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  try {
    await supabase
      .from("whatsapp_messages")
      .insert({
        phone_number: phone,
        role,
        content,
        created_at: new Date().toISOString(),
      });
  } catch (err: any) {
    console.error("Store message error:", err.message);
  }
}

// ─── Claude ──────────────────────────────────────────────────────────────────

async function callClaude(
  messages: Array<{ role: string; content: string }>,
  contextMsg: string,
): Promise<string> {
  const claudeMsgs = [
    { role: "user" as const, content: `[USER FINANCIAL DATA]\n${contextMsg}` },
    {
      role: "assistant" as const,
      content: "Understood. I have the user's financial context.",
    },
    ...messages,
  ];
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
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
          messages: claudeMsgs,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return (
          data.content
            ?.filter((b: any) => b.type === "text")
            .map((b: any) => b.text)
            .join("\n") || "I couldn't generate a response."
        );
      }
      const error = await resp.json();
      console.error(`❌ Claude error (${attempt}/${MAX_RETRIES}):`, error);
      if (resp.status === 401 || resp.status === 422)
        throw new Error(`Claude: ${JSON.stringify(error)}`);
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    } catch (err: any) {
      if (attempt === MAX_RETRIES)
        return "Sorry, I'm having trouble right now. Please try again in a moment!";
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  return "Sorry, I'm having trouble right now. Please try again in a moment!";
}

// ─── Command Handlers ────────────────────────────────────────────────────────

function getMainMenu(): InteractiveMessage {
  return {
    type: "list",
    header: "Latela",
    body: "What would you like to know?",
    footer: "Type 'menu' at any time to see this again",
    sections: [
      {
        title: "Options",
        rows: [
          { id: "cmd_balances", title: "Balances", description: "Available, Budget & Savings" },
          { id: "cmd_budget_plan", title: "Budget plan", description: "Your monthly budget breakdown" },
          { id: "cmd_goals", title: "Goals & progress", description: "Savings goals and progress" },
          { id: "cmd_events", title: "Upcoming events", description: "Scheduled financial events" },
          { id: "cmd_chat", title: "Chat w/ Budget Buddy", description: "Ask anything about your finances" },
        ],
      },
    ],
  };
}

async function handleGreeting(ctx: UserContext | null): Promise<string> {
  const name = ctx?.name || "there";
  return `Hi ${name}! Welcome back to Latela.\n\nWhat would you like to know?\n\n1. Balances — Available, Budget & Savings\n2. Budget plan\n3. Goals & progress\n4. Upcoming events\n5. Chat w/ Budget Buddy\n\nType a number or *menu* for the full list.`;
}

async function handleBalances(ctx: UserContext | null): Promise<string> {
  if (!ctx)
    return "I don't have your account linked yet.\n\nSign up on the Latela app.\n\nType *menu* to go back.";

  let r = `*${ctx.name}'s Balances*\n\n`;

  if (ctx.accounts.length > 0) {
    r += `*Accounts:*\n`;
    ctx.accounts.forEach((a) => {
      const aName = a.account_name || a.bank_name || "Account";
      r += `  ${aName}: R${((a.available_balance || 0) / 100).toFixed(2)}\n`;
    });
  } else {
    r += `No accounts found. Upload a bank statement on the app.\n`;
  }

  if (ctx.budgetItems.length > 0) {
    const totalBudgeted = ctx.budgetItems.reduce((s, b) => s + b.amount, 0);
    const totalSpent = ctx.budgetItems.reduce((s, b) => s + (b.amount_spent || 0), 0);
    r += `\n*Budget:*\n  Budgeted: R${totalBudgeted.toFixed(2)}\n  Spent: R${totalSpent.toFixed(2)}\n  Remaining: R${(totalBudgeted - totalSpent).toFixed(2)}\n`;
  }

  if (ctx.goals.length > 0) {
    const totalSaved = ctx.goals.reduce((s, g) => s + (g.current_saved || 0), 0);
    const totalTarget = ctx.goals.reduce((s, g) => s + g.target, 0);
    r += `\n*Savings:*\n  Saved: R${totalSaved.toFixed(2)} / R${totalTarget.toFixed(2)}\n`;
  }

  r += `\nType *menu* to go back.`;
  return r;
}

async function handleBudgetPlan(ctx: UserContext | null): Promise<string> {
  if (!ctx) return "I need your account linked.\n\nType *menu* to go back.";

  const month = new Date().toLocaleString("en-ZA", { month: "long", year: "numeric" });
  let r = `*Budget Plan — ${month}*\n\n`;
  r += `Split: ${ctx.settings.needs_percentage}% Needs / ${ctx.settings.wants_percentage}% Wants / ${ctx.settings.savings_percentage}% Savings\n`;

  if (ctx.budgetItems.length > 0) {
    r += `\n*Budget Items:*\n`;
    ctx.budgetItems.forEach((b) => {
      const spent = b.amount_spent || 0;
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      const icon = spent <= b.amount ? "✅" : "🔴";
      r += `${icon} ${b.name}: R${spent.toFixed(0)} / R${b.amount} (${pct}%) — ${b.frequency}\n`;
    });
  } else {
    r += `\nNo budget items set up yet. Create them in the Latela app.\n`;
  }

  r += `\nType *menu* to go back.`;
  return r;
}

async function handleGoals(ctx: UserContext | null): Promise<string> {
  if (!ctx) return "I need your account linked.\n\nType *menu* to go back.";
  if (ctx.goals.length === 0)
    return `No savings goals set up yet. Create one in the Latela app.\n\nType *menu* to go back.`;

  let r = `*Goals & Progress*\n\n`;
  ctx.goals.forEach((g) => {
    const saved = g.current_saved || 0;
    const pct = g.target > 0 ? Math.round((saved / g.target) * 100) : 0;
    const bar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
    r += `*${g.name}*\n  ${bar} ${pct}%\n  R${saved.toFixed(2)} / R${g.target.toFixed(2)}\n`;
    if (g.monthly_allocation) r += `  Monthly: R${g.monthly_allocation.toFixed(2)}\n`;
    if (g.due_date) r += `  Due: ${g.due_date}\n`;
    r += `\n`;
  });

  r += `Type *menu* to go back.`;
  return r;
}

async function handleEvents(ctx: UserContext | null): Promise<string> {
  if (!ctx) return "I need your account linked.\n\nType *menu* to go back.";
  if (ctx.upcomingEvents.length === 0)
    return `No upcoming events scheduled. Add events in the Latela app.\n\nType *menu* to go back.`;

  let r = `*Upcoming Events*\n\n`;
  ctx.upcomingEvents.forEach((e) => {
    r += `📅 *${e.event_name}*\n  Date: ${e.event_date}\n  Budget: R${e.budgeted_amount.toFixed(2)}`;
    if (e.category) r += `\n  Category: ${e.category}`;
    r += `\n\n`;
  });

  const totalBudget = ctx.upcomingEvents.reduce((s, e) => s + e.budgeted_amount, 0);
  r += `Total budgeted: R${totalBudget.toFixed(2)}\n\nType *menu* to go back.`;
  return r;
}

function handleHelp(): string {
  return `*Latela Commands*\n\n1️⃣ *"Balances"* — Available, Budget & Savings\n2️⃣ *"Budget"* — Monthly budget plan\n3️⃣ *"Goals"* — Savings goals & progress\n4️⃣ *"Events"* — Upcoming events\n5️⃣ *"Chat"* — Budget Buddy AI\n\n📄 *"Statement"* — Upload bank statement\n🏠 *"Menu"* — Options list\n↩️ *"Back"* — Return to menu\n❓ *"Help"* — This list\n\nOr ask anything in plain English!\n\nlatela.co.za`;
}

// ─── Router ──────────────────────────────────────────────────────────────────

async function route(
  text: string,
  phone: string,
  state: SessionState,
  btnId?: string,
): Promise<RouteResult> {
  const i = normalise(text);

  // Greetings
  if (["hi", "hello", "hey", "howzit", "hiya"].includes(i)) {
    await setSessionState(phone, "awaiting_menu");
    return { type: "predetermined" };
  }

  // Menu
  if (["menu", "start", "home"].includes(i) || btnId === "cmd_menu") {
    await setSessionState(phone, "awaiting_menu");
    return { type: "predetermined", interactive: getMainMenu() };
  }

  // Help
  if (i === "help") {
    await setSessionState(phone, "idle");
    return { type: "predetermined", response: handleHelp() };
  }

  // Back / Exit
  if (["back", "exit", "stop", "quit", "0"].includes(i)) {
    await setSessionState(phone, "awaiting_menu");
    return { type: "predetermined", interactive: getMainMenu() };
  }

  // 1. Balances
  if (i === "1" || i === "balance" || i === "balances" || btnId === "cmd_balances") {
    await setSessionState(phone, "idle");
    return { type: "predetermined" };
  }

  // 2. Budget plan
  if (i === "2" || i === "budget" || i === "budgets" || i === "budget plan" || btnId === "cmd_budget_plan") {
    await setSessionState(phone, "idle");
    return { type: "predetermined" };
  }

  // 3. Goals
  if (i === "3" || i === "goals" || i === "goals and progress" || btnId === "cmd_goals") {
    await setSessionState(phone, "idle");
    return { type: "predetermined" };
  }

  // 4. Upcoming events
  if (i === "4" || i === "events" || i === "upcoming events" || btnId === "cmd_events") {
    await setSessionState(phone, "idle");
    return { type: "predetermined" };
  }

  // 5. Chat w/ Budget Buddy
  if (
    i === "5" ||
    i === "chat" ||
    i === "buddy" ||
    i === "budget buddy" ||
    i === "chat w budget buddy" ||
    btnId === "cmd_chat"
  ) {
    await setSessionState(phone, "in_budget_buddy");
    return {
      type: "predetermined",
      response:
        "*Budget Buddy is here!*\n\nAsk me anything about your finances.\n\nType *back* to return to the menu.",
    };
  }

  // Statement upload prompt
  if (i === "statement" || i === "upload" || i === "bank statement") {
    await setSessionState(phone, "idle");
    return {
      type: "predetermined",
      response:
        "*Upload Your Bank Statement*\n\nSend me your statement as:\n📎 *PDF* — From your banking app\n📸 *Photo* — Screenshot of your statement\n\nI support FNB, Standard Bank, ABSA, Nedbank, Capitec, TymeBank, and Discovery Bank.\n\nJust send the file!",
    };
  }

  // Budget Buddy mode
  if (state === "in_budget_buddy") return { type: "claude" };

  // Awaiting menu — didn't understand
  if (state === "awaiting_menu")
    return {
      type: "predetermined",
      response:
        "I didn't catch that.\n\n1. Balances\n2. Budget plan\n3. Goals & progress\n4. Upcoming events\n5. Chat w/ Budget Buddy\n\nOr type *help* for all commands.",
    };

  // Default — show menu
  await setSessionState(phone, "awaiting_menu");
  return { type: "predetermined", interactive: getMainMenu() };
}

// ─── Process Message ─────────────────────────────────────────────────────────

async function processMessage(
  phone: string,
  text: string,
  msgId: string,
  btnId?: string,
): Promise<void> {
  try {
    await markRead(msgId);
    const state = await getSessionState(phone);
    const r = await route(text, phone, state, btnId);

    if (r.type === "predetermined") {
      if (r.interactive) {
        await sendInteractive(phone, r.interactive);
        return;
      }
      const i = normalise(text);

      // Greeting
      if (["hi", "hello", "hey", "howzit", "hiya"].includes(i)) {
        await sendText(phone, await handleGreeting(await getUserContext(phone)));
        return;
      }

      // 1. Balances
      if (i === "1" || i === "balance" || i === "balances" || btnId === "cmd_balances") {
        await sendText(phone, await handleBalances(await getUserContext(phone)));
        return;
      }

      // 2. Budget plan
      if (i === "2" || i === "budget" || i === "budgets" || i === "budget plan" || btnId === "cmd_budget_plan") {
        await sendText(phone, await handleBudgetPlan(await getUserContext(phone)));
        return;
      }

      // 3. Goals
      if (i === "3" || i === "goals" || i === "goals and progress" || btnId === "cmd_goals") {
        await sendText(phone, await handleGoals(await getUserContext(phone)));
        return;
      }

      // 4. Events
      if (i === "4" || i === "events" || i === "upcoming events" || btnId === "cmd_events") {
        await sendText(phone, await handleEvents(await getUserContext(phone)));
        return;
      }

      if (r.response) {
        await sendText(phone, r.response);
        return;
      }
    }

    if (r.type === "claude") {
      const ctx = await getUserContext(phone);
      const history = await getHistory(phone);
      await storeMsg(phone, "user", text);
      const msgs = [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text },
      ];
      const reply = await callClaude(msgs, buildContextMsg(ctx));
      await storeMsg(phone, "assistant", reply);
      await sendText(phone, reply);
    }
  } catch (err) {
    console.error("❌ Process error:", err);
    try {
      await sendText(phone, "Oops! Something went wrong. Please try again.");
    } catch {}
  }
}

// ─── Statement Upload ────────────────────────────────────────────────────────

async function processUpload(
  phone: string,
  mediaId: string,
  mime: string,
  msgId: string,
): Promise<void> {
  try {
    await markRead(msgId);
    const { data: settings } = await supabase
      .from("user_settings")
      .select("user_id, first_name, display_name")
      .or(`mobile.eq.${phone},phone_number.eq.${phone}`)
      .single();
    if (!settings) {
      await sendText(
        phone,
        "I need your account linked first.\n\nSign up on the Latela app.\n\nType *menu* for options.",
      );
      return;
    }
    const userName = settings.display_name || settings.first_name || "there";
    await sendText(phone, `Got your statement, ${userName}! Processing...`);
    await sendText(
      phone,
      "Statement received! Full WhatsApp parsing is coming soon.\n\nUpload via the Latela app for instant processing.\n\nType *menu* for options.",
    );
  } catch (err) {
    console.error("❌ Upload error:", err);
    try {
      await sendText(
        phone,
        "Something went wrong processing your statement. Try again or use the app.\n\nType *menu* for options.",
      );
    } catch {}
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ██  MAIN HANDLER                                                         ██
// ═════════════════════════════════════════════════════════════════════════════

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── GET: Webhook Verification ──
  if (req.method === "GET") {
    const mode = req.query["hub.mode"] as string;
    const token = req.query["hub.verify_token"] as string;
    const challenge = req.query["hub.challenge"] as string;
    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
      console.log("✅ Webhook verified");
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: "Verification failed" });
  }

  // ── POST: Incoming Messages ──
  if (req.method === "POST") {
    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const sig = req.headers["x-hub-signature-256"] as string | undefined;

    if (!verifySignature(sig, rawBody)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Respond 200 immediately
    res.status(200).json({ status: "ok" });

    let body: any;
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      return;
    }

    try {
      const value = body?.entry?.[0]?.changes?.[0]?.value;
      if (value?.statuses)
        console.log(
          `Status: ${value.statuses[0].id}: ${value.statuses[0].status}`,
        );

      if (value?.messages?.length > 0) {
        const msg = value.messages[0];
        const phone: string = msg.from;

        if (msg.type === "text") {
          const text = msg.text.body.trim();
          if (text) await processMessage(phone, text, msg.id);
        } else if (msg.type === "interactive") {
          const t = msg.interactive?.type;
          if (t === "button_reply")
            await processMessage(
              phone,
              msg.interactive.button_reply.title,
              msg.id,
              msg.interactive.button_reply.id,
            );
          else if (t === "list_reply")
            await processMessage(
              phone,
              msg.interactive.list_reply.title,
              msg.id,
              msg.interactive.list_reply.id,
            );
        } else if (msg.type === "document") {
          const mime = msg.document.mime_type || "application/pdf";
          if (["application/pdf", "text/csv"].some((t) => mime.includes(t)))
            await processUpload(phone, msg.document.id, mime, msg.id);
          else
            await sendText(
              phone,
              `Can't process ${mime}. Send a *PDF* or *photo*.\n\nType *menu* for options.`,
            );
        } else if (msg.type === "image") {
          await processUpload(
            phone,
            msg.image.id,
            msg.image.mime_type || "image/jpeg",
            msg.id,
          );
        } else {
          await sendText(
            phone,
            'I can read text and bank statements (PDF/photo). Type *"menu"* to start!',
          );
        }
      }
    } catch (err) {
      console.error("❌ Webhook error:", err);
    }
    return;
  }

  return res.status(405).json({ error: "Method not allowed" });
}
