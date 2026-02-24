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
  transactions: Array<{
    amount: number;
    category: string | null;
    description: string | null;
    date: string;
  }>;
  budgets: Array<{ category: string; amount: number; spent: number | null }>;
  goals: Array<{
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string | null;
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
    const { data: user, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone_number")
      .eq("phone_number", phone)
      .single();
    if (error || !user) return null;
    const ago30 = new Date();
    ago30.setDate(ago30.getDate() - 30);
    const [{ data: tx }, { data: budgets }, { data: goals }] =
      await Promise.all([
        supabase
          .from("transactions")
          .select("amount, category, description, date")
          .eq("user_id", user.id)
          .gte("date", ago30.toISOString())
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
      transactions: tx || [],
      budgets: budgets || [],
      goals: goals || [],
    };
  } catch (err: any) {
    console.error("User context error:", err.message);
    return null;
  }
}

function buildContextMsg(ctx: UserContext | null): string {
  if (!ctx) return "User is not registered on Latela yet.";
  let msg = `User: ${ctx.name}\n`;
  if (ctx.transactions.length > 0) {
    const spent = ctx.transactions
      .filter((t) => t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const cats: Record<string, number> = {};
    ctx.transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const c = t.category || "Uncategorized";
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
  if (ctx.budgets.length > 0) {
    msg += `\nBudgets:\n`;
    ctx.budgets.forEach((b) => {
      msg += `  - ${b.category}: R${(b.spent || 0).toFixed(2)} / R${b.amount}\n`;
    });
  }
  if (ctx.goals.length > 0) {
    msg += `\nGoals:\n`;
    ctx.goals.forEach((g) => {
      const p =
        g.target_amount > 0
          ? ((g.current_amount / g.target_amount) * 100).toFixed(1)
          : "0";
      msg += `  - ${g.name}: R${g.current_amount} / R${g.target_amount} (${p}%)\n`;
    });
  }
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
        return "Sorry, I'm having trouble right now. Please try again in a moment! 🙏";
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  return "Sorry, I'm having trouble right now. Please try again in a moment! 🙏";
}

// ─── Command Handlers ────────────────────────────────────────────────────────

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

async function handleGreeting(ctx: UserContext | null): Promise<string> {
  const name = ctx?.name || "there";
  return `Hi ${name}! Welcome back to Latela. 👋\n\nHere's what I can help with:\n💳 *"Balance"* — 30-day summary\n📊 *"Score"* — Latela Score\n💰 *"Budget"* — Budget status\n📂 *"Spending"* — Category breakdown\n💬 *"Chat"* — Budget Buddy (AI)\n❓ *"Help"* — Full command list\n\nWhat would you like to know?`;
}

async function handleBalance(ctx: UserContext | null): Promise<string> {
  if (!ctx)
    return "I don't have your account linked yet. 🔗\n\nSign up on the Latela app.\n\nType *menu* to go back.";
  if (ctx.transactions.length === 0)
    return `Hi ${ctx.name}! No recent transactions found. Upload a bank statement on the Latela app.\n\nType *menu* to go back.`;
  const spent = ctx.transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const income = ctx.transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  let r = `💳 *${ctx.name}'s 30-Day Summary*\n\nIncome: R${income.toFixed(2)}\nSpending: R${spent.toFixed(2)}\nNet: R${(income - spent).toFixed(2)}\n`;
  if (ctx.budgets.length > 0) {
    r += `\n📋 *Budget Status:*\n`;
    ctx.budgets.forEach((b) => {
      const s = b.spent || 0;
      const pct = ((s / b.amount) * 100).toFixed(0);
      r += `${s <= b.amount ? "✅" : "🔴"} ${b.category}: R${s.toFixed(0)} / R${b.amount} (${pct}%)\n`;
    });
  }
  r += `\nType *menu* to go back or *3* for Budget Buddy.`;
  return r;
}

async function handleScore(ctx: UserContext | null): Promise<string> {
  if (!ctx)
    return "I need your account linked for Latela Score. 📊\n\nType *menu* to go back.";
  let score = 50;
  const bd: string[] = [];
  if (ctx.transactions.length > 10) {
    score += 10;
    bd.push("✅ Active tracking (+10)");
  } else if (ctx.transactions.length > 0) {
    score += 5;
    bd.push("🟡 Some tracking (+5)");
  } else {
    bd.push("❌ No tracking (0)");
  }
  if (ctx.budgets.length > 0) {
    score += 15;
    bd.push("✅ Budgets active (+15)");
    const ub = ctx.budgets.filter((b) => (b.spent || 0) <= b.amount).length;
    if (ub === ctx.budgets.length) {
      score += 10;
      bd.push("✅ All under budget (+10)");
    } else {
      score += 5;
      bd.push("🟡 Some over budget (+5)");
    }
  } else {
    bd.push("❌ No budgets (0)");
  }
  if (ctx.goals.length > 0) {
    score += 10;
    bd.push("✅ Goals set (+10)");
    const avg =
      ctx.goals.reduce(
        (s, g) =>
          s + (g.target_amount > 0 ? g.current_amount / g.target_amount : 0),
        0,
      ) / ctx.goals.length;
    if (avg > 0.5) {
      score += 5;
      bd.push("✅ Good progress (+5)");
    }
  }
  score = Math.min(score, 100);
  const emoji = score >= 80 ? "🟢" : score >= 60 ? "🟡" : "🔴";
  let r = `📊 *Latela Score: ${emoji} ${score}/100*\n\n*Breakdown:*\n${bd.join("\n")}\n\n`;
  r +=
    score < 60
      ? "💡 Set budgets and create a savings goal to improve."
      : score < 80
        ? "💡 Keep tracking to push past 80!"
        : "🎉 Great work!";
  r += `\n\nType *menu* to go back.`;
  return r;
}

async function handleBudget(ctx: UserContext | null): Promise<string> {
  if (!ctx) return "I need your account linked. 🔗\n\nType *menu* to go back.";
  const som = new Date();
  som.setDate(1);
  som.setHours(0, 0, 0, 0);
  const { data: tx } = await supabase
    .from("transactions")
    .select("amount, category")
    .eq("user_id", ctx.id)
    .gte("date", som.toISOString());
  const spent = tx?.reduce((s, t) => s + Math.abs(t.amount), 0) || 0;
  const { data: bgt } = await supabase
    .from("budgets")
    .select("amount")
    .eq("user_id", ctx.id)
    .eq("is_active", true)
    .eq("category", "Overall")
    .single();
  const limit = bgt?.amount || 0;
  const month = new Date().toLocaleString("en-ZA", {
    month: "long",
    year: "numeric",
  });
  let r = `💰 *Budget — ${month}*\n\nSpent: R${spent.toFixed(2)}\n`;
  if (limit > 0) {
    const pct = Math.round((spent / limit) * 100);
    r += `Limit: R${limit.toFixed(2)}\nRemaining: R${(limit - spent).toFixed(2)}\nUsed: ${pct}%\n\n${pct > 90 ? "⚠️ Close to limit!" : "✅ Looking good!"}`;
  } else {
    r += `\nNo overall budget set. Create one in the Latela app.`;
  }
  if (ctx.budgets.length > 0) {
    r += `\n\n📋 *Categories:*\n`;
    ctx.budgets.forEach((b) => {
      const s = b.spent || 0;
      r += `${s <= b.amount ? "✅" : "🔴"} ${b.category}: R${s.toFixed(0)} / R${b.amount}\n`;
    });
  }
  r += `\n\nType *menu* to go back.`;
  return r;
}

async function handleSpending(ctx: UserContext | null): Promise<string> {
  if (!ctx) return "I need your account linked. 🔗\n\nType *menu* to go back.";
  const exp = ctx.transactions.filter((t) => t.amount < 0);
  if (exp.length === 0)
    return `No spending data found. Upload a statement on the app.\n\nType *menu* to go back.`;
  const total = exp.reduce((s, t) => s + Math.abs(t.amount), 0);
  const cats: Record<string, number> = {};
  exp.forEach((t) => {
    const c = t.category || "Uncategorized";
    cats[c] = (cats[c] || 0) + Math.abs(t.amount);
  });
  const sorted = Object.entries(cats).sort(([, a], [, b]) => b - a);
  let r = `📂 *Spending (Last 30 Days)*\n\nTotal: R${total.toFixed(2)}\n\n`;
  sorted.forEach(([c, a], i) => {
    r += `${i === 0 ? "🔴" : i < 3 ? "🟡" : "🟢"} ${c}: R${a.toFixed(2)} (${((a / total) * 100).toFixed(0)}%)\n`;
  });
  r += `\nType *menu* to go back or *3* for Budget Buddy.`;
  return r;
}

function handleHelp(): string {
  return `📖 *Latela Commands*\n\n💳 *"Balance"* — 30-day summary\n💰 *"Budget"* — Monthly budget\n📂 *"Spending"* — Category breakdown\n📊 *"Score"* — Financial health score\n📄 *"Statement"* — Upload bank statement\n💬 *"Chat"* — Budget Buddy AI\n🏠 *"Menu"* — Quick buttons\n↩️ *"Back"* — Return to menu\n\nOr ask anything in plain English!\n\nlatela.co.za`;
}

// ─── Router ──────────────────────────────────────────────────────────────────

async function route(
  text: string,
  phone: string,
  state: SessionState,
  btnId?: string,
): Promise<RouteResult> {
  const i = normalise(text);
  if (["hi", "hello", "hey", "howzit", "hiya"].includes(i)) {
    await setSessionState(phone, "awaiting_menu");
    return { type: "predetermined" };
  }
  if (["menu", "start", "home"].includes(i) || btnId === "cmd_menu") {
    await setSessionState(phone, "awaiting_menu");
    return { type: "predetermined", interactive: getMainMenu() };
  }
  if (i === "help") {
    await setSessionState(phone, "idle");
    return { type: "predetermined", response: handleHelp() };
  }
  if (["back", "exit", "stop", "quit", "0"].includes(i)) {
    await setSessionState(phone, "awaiting_menu");
    return { type: "predetermined", interactive: getMainMenu() };
  }
  if (i === "1" || i === "balance" || btnId === "cmd_balance") {
    await setSessionState(phone, "idle");
    return { type: "predetermined" };
  }
  if (
    i === "2" ||
    i === "score" ||
    i === "latela score" ||
    btnId === "cmd_score"
  ) {
    await setSessionState(phone, "idle");
    return { type: "predetermined" };
  }
  if (
    i === "3" ||
    i === "chat" ||
    i === "buddy" ||
    i === "budget buddy" ||
    btnId === "cmd_chat"
  ) {
    await setSessionState(phone, "in_budget_buddy");
    return {
      type: "predetermined",
      response:
        "💬 *Budget Buddy is here!*\n\nAsk me anything about your finances.\n\nType *back* to return to the menu.",
    };
  }
  if (i === "budget" || i === "budgets") {
    await setSessionState(phone, "idle");
    return { type: "predetermined" };
  }
  if (i === "spending" || i === "categories" || i === "breakdown") {
    await setSessionState(phone, "idle");
    return { type: "predetermined" };
  }
  if (i === "statement" || i === "upload" || i === "bank statement") {
    await setSessionState(phone, "idle");
    return {
      type: "predetermined",
      response:
        "📄 *Upload Your Bank Statement*\n\nSend me your statement as:\n📎 *PDF* — From your banking app\n📸 *Photo* — Screenshot of your statement\n\nI support FNB, Standard Bank, ABSA, Nedbank, Capitec, TymeBank, and Discovery Bank.\n\nJust send the file! 🚀",
    };
  }
  if (state === "in_budget_buddy") return { type: "claude" };
  if (state === "awaiting_menu")
    return {
      type: "predetermined",
      response:
        "I didn't catch that. 🤔\n\n1️⃣ Balance\n2️⃣ Latela Score\n3️⃣ Budget Buddy\n\nOr type *budget*, *spending*, *help*.\nType *menu* for buttons.",
    };
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
      if (["hi", "hello", "hey", "howzit", "hiya"].includes(i)) {
        await sendText(
          phone,
          await handleGreeting(await getUserContext(phone)),
        );
        return;
      }
      if (i === "1" || i === "balance" || btnId === "cmd_balance") {
        await sendText(phone, await handleBalance(await getUserContext(phone)));
        return;
      }
      if (
        i === "2" ||
        i === "score" ||
        i === "latela score" ||
        btnId === "cmd_score"
      ) {
        await sendText(phone, await handleScore(await getUserContext(phone)));
        return;
      }
      if (i === "budget" || i === "budgets") {
        await sendText(phone, await handleBudget(await getUserContext(phone)));
        return;
      }
      if (i === "spending" || i === "categories" || i === "breakdown") {
        await sendText(
          phone,
          await handleSpending(await getUserContext(phone)),
        );
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
      await sendText(phone, "Oops! Something went wrong. Please try again. 🙏");
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
    const { data: user } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("phone_number", phone)
      .single();
    if (!user) {
      await sendText(
        phone,
        "I need your account linked first. 🔗\n\nSign up on the Latela app.\n\nType *menu* for options.",
      );
      return;
    }
    await sendText(
      phone,
      `📄 Got your statement, ${user.full_name}! Processing... ⏳`,
    );
    // Full parser integration coming — for now acknowledge receipt
    await sendText(
      phone,
      "✅ Statement received! Full WhatsApp parsing is coming soon.\n\nUpload via the Latela app for instant processing.\n\nType *menu* for options.",
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
