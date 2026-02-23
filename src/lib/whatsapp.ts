// ─────────────────────────────────────────────────────────────────────────────
// lib/whatsapp.ts
// Shared WhatsApp Cloud API utility for Latela
//
// Single source of truth for all WhatsApp messaging. Import this in:
//   - app/api/whatsapp/webhook/route.ts  (the webhook)
//   - Any server action or API route that needs to send WhatsApp messages
//
// Features:
//   • Text, template, and interactive messages
//   • Retry with exponential back-off
//   • Mark-as-read (blue ticks)
//   • Typed interactive message builder
// ─────────────────────────────────────────────────────────────────────────────

const WHATSAPP_API_VERSION = "v21.0";
const GRAPH_API_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_000;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InteractiveButton {
  id: string;
  title: string; // Max 20 chars
}

export interface InteractiveListRow {
  id: string;
  title: string; // Max 24 chars
  description?: string; // Max 72 chars
}

export interface InteractiveListSection {
  title: string;
  rows: InteractiveListRow[];
}

export interface InteractiveMessage {
  type: "button" | "list";
  header?: string;
  body: string;
  footer?: string;
  buttons?: InteractiveButton[];
  sections?: InteractiveListSection[];
}

interface SendMessagePayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text" | "template" | "interactive";
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
  interactive?: any;
}

interface WhatsAppSendResult {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Core fetch wrapper with retry logic.
 * Retries on 5xx and network errors; does NOT retry on 400/401.
 */
async function whatsappFetch<T = any>(
  endpoint: string,
  body: Record<string, any>,
): Promise<T> {
  const url = `${GRAPH_API_URL}/${PHONE_NUMBER_ID}/${endpoint}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      const error = await response.json();
      console.error(
        `❌ WhatsApp API error (attempt ${attempt}/${MAX_RETRIES}):`,
        error,
      );

      // Don't retry on client errors (auth, bad request, validation)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(
          `WhatsApp API ${response.status}: ${JSON.stringify(error)}`,
        );
      }

      // Retry on 5xx
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    } catch (err: any) {
      // If it's our own thrown error (4xx), re-throw immediately
      if (err.message?.startsWith("WhatsApp API")) throw err;

      console.error(
        `WhatsApp fetch failed (attempt ${attempt}/${MAX_RETRIES}):`,
        err.message,
      );
      if (attempt === MAX_RETRIES) throw err;
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error("WhatsApp API: max retries exceeded");
}

// ─── Build Interactive Payload ───────────────────────────────────────────────

function buildInteractivePayload(interactive: InteractiveMessage): any {
  const base: any = {
    ...(interactive.header && {
      header: { type: "text", text: interactive.header },
    }),
    body: { text: interactive.body },
    ...(interactive.footer && { footer: { text: interactive.footer } }),
  };

  if (interactive.type === "button") {
    return {
      type: "button",
      ...base,
      action: {
        buttons: (interactive.buttons || []).map((btn) => ({
          type: "reply",
          reply: { id: btn.id, title: btn.title },
        })),
      },
    };
  }

  if (interactive.type === "list") {
    return {
      type: "list",
      ...base,
      action: {
        button: "Choose an option",
        sections: interactive.sections || [],
      },
    };
  }

  throw new Error(`Unsupported interactive type: ${interactive.type}`);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Split a long message into chunks that fit within WhatsApp's character limit.
 * Splits at newlines where possible to avoid breaking mid-sentence.
 */
function splitMessage(text: string, maxLength = 4000): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a newline near the limit
    let splitIndex = remaining.lastIndexOf("\n", maxLength);

    // If no newline found, try splitting at a space
    if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
      splitIndex = remaining.lastIndexOf(" ", maxLength);
    }

    // Last resort: hard cut at the limit
    if (splitIndex === -1 || splitIndex < maxLength * 0.5) {
      splitIndex = maxLength;
    }

    chunks.push(remaining.substring(0, splitIndex).trimEnd());
    remaining = remaining.substring(splitIndex).trimStart();
  }

  return chunks;
}

/**
 * Send a plain text message.
 * Automatically splits into multiple messages if over WhatsApp's 4096 char limit.
 */
export async function sendTextMessage(
  to: string,
  body: string,
): Promise<WhatsAppSendResult> {
  const chunks = splitMessage(body);

  let lastResult: WhatsAppSendResult | undefined;

  for (const chunk of chunks) {
    lastResult = await whatsappFetch<WhatsAppSendResult>("messages", {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: chunk },
    });
    console.log(`✅ Text sent to ${to}:`, lastResult.messages?.[0]?.id);
  }

  return lastResult!;
}

/**
 * Send a template message (e.g. for notifications, marketing, OTP).
 *
 * Templates must be pre-approved in Meta Business Manager.
 * Language code defaults to "en" — override for multilingual templates.
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode = "en",
  components?: any[],
): Promise<WhatsAppSendResult> {
  const result = await whatsappFetch<WhatsAppSendResult>("messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components && { components }),
    },
  });

  console.log(
    `✅ Template "${templateName}" sent to ${to}:`,
    result.messages?.[0]?.id,
  );
  return result;
}

/**
 * Send an interactive message (buttons or list picker).
 *
 * WhatsApp limits:
 *   - Buttons: max 3 buttons, title max 20 chars each
 *   - List: max 10 sections, 10 rows per section, title max 24 chars
 *
 * Falls back to plain text if the interactive API call fails with a 400
 * (e.g. template not supported on recipient's device).
 */
export async function sendInteractiveMessage(
  to: string,
  interactive: InteractiveMessage,
): Promise<WhatsAppSendResult> {
  try {
    const result = await whatsappFetch<WhatsAppSendResult>("messages", {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: buildInteractivePayload(interactive),
    });

    console.log(`✅ Interactive sent to ${to}:`, result.messages?.[0]?.id);
    return result;
  } catch (err: any) {
    // Fallback: send body as plain text if interactive fails
    console.warn(
      `⚠️ Interactive message failed, falling back to text: ${err.message}`,
    );
    return sendTextMessage(to, interactive.body);
  }
}

/**
 * Mark an incoming message as "read" (shows blue ticks to sender).
 *
 * This is fire-and-forget — failures are logged but not thrown.
 */
export async function markAsRead(messageId: string): Promise<void> {
  try {
    await whatsappFetch("messages", {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    });
  } catch (err: any) {
    console.error("Failed to mark as read:", err.message);
  }
}

/**
 * Generic send — for advanced use cases or custom payload shapes.
 * Prefer the typed convenience functions above for most use cases.
 */
export async function sendMessage(
  payload: Omit<SendMessagePayload, "messaging_product" | "recipient_type">,
): Promise<WhatsAppSendResult> {
  return whatsappFetch<WhatsAppSendResult>("messages", {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    ...payload,
  });
}
