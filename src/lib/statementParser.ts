// ─────────────────────────────────────────────────────────────────────────────
// lib/statementParser.ts
// Latela Bank Statement Parser
//
// Pipeline:
//   1. Download media from WhatsApp CDN (PDF, image, or document)
//   2. Extract raw text (PDF → text extraction, image → sent to Claude vision)
//   3. Claude structures the data into typed transactions
//   4. Store in Supabase
//   5. Return summary to user
//
// Supported formats:
//   - PDF bank statements (.pdf)
//   - Photos/screenshots of statements (.jpg, .png)
//   - Excel/CSV exports are handled separately (future)
//
// South African bank support:
//   - FNB, Standard Bank, ABSA, Nedbank, Capitec, TymeBank, Discovery Bank
//   - The Claude prompt includes SA-specific formatting guidance
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const WHATSAPP_API_VERSION = "v21.0";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedTransaction {
  date: string; // ISO format YYYY-MM-DD
  description: string;
  amount: number; // Negative for debits, positive for credits
  category: string | null;
  balance_after?: number | null;
}

export interface StatementParseResult {
  success: boolean;
  transactionCount: number;
  totalDebits: number;
  totalCredits: number;
  dateRange: { from: string; to: string } | null;
  bankName: string | null;
  accountHolder: string | null;
  error?: string;
}

interface WhatsAppMediaInfo {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
}

// ─── Media Download ──────────────────────────────────────────────────────────

/**
 * Get the download URL for a WhatsApp media file.
 * WhatsApp stores media on their CDN — you first request the URL, then download.
 */
async function getMediaUrl(mediaId: string): Promise<WhatsAppMediaInfo> {
  const response = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get media URL: ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Download the actual media file as a Buffer.
 */
async function downloadMedia(mediaUrl: string): Promise<Buffer> {
  const response = await fetch(mediaUrl, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─── Text Extraction ─────────────────────────────────────────────────────────

/**
 * Extract text from a PDF buffer using pdf-parse.
 *
 * Note: You'll need to install pdf-parse:
 *   npm install pdf-parse
 *   npm install -D @types/pdf-parse
 */
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues if pdf-parse isn't installed yet
  const pdfParse = (await import("pdf-parse")).default;

  const data = await pdfParse(pdfBuffer);
  return data.text;
}

// ─── Claude Transaction Extraction ───────────────────────────────────────────

const EXTRACTION_SYSTEM_PROMPT = `You are a South African bank statement parser. Your job is to extract transactions from bank statements and return them as structured JSON.

CRITICAL RULES:
1. Return ONLY valid JSON — no markdown, no backticks, no explanation text.
2. All amounts are in South African Rand (ZAR).
3. Debits (money out) should be NEGATIVE numbers. Credits (money in) should be POSITIVE.
4. Dates should be in ISO format: YYYY-MM-DD.
5. If you cannot determine the exact year, use the most recent plausible year.
6. Categorise each transaction into one of these categories:
   - Groceries, Transport, Dining, Entertainment, Utilities, Insurance,
   - Medical, Education, Clothing, Housing, Subscriptions, Transfers,
   - Salary, Interest, Fees, ATM, Airtime, Fuel, Other
7. Common SA merchant patterns:
   - "PNP" or "PICK N PAY" → Groceries
   - "CHECKERS" or "SHOPRITE" → Groceries
   - "WOOLWORTHS" or "W/WORTHS" → Groceries (or Clothing if description suggests)
   - "UBER" or "BOLT" → Transport
   - "MR D" or "UBER EATS" → Dining
   - "DSTV" or "SHOWMAX" or "NETFLIX" → Subscriptions
   - "PREPAID" or "AIRTIME" or "MTN" or "VODACOM" → Airtime
   - "ENGEN" or "SHELL" or "BP" or "SASOL" → Fuel
   - "ATM" → ATM
   - "FEE" or "CHARGE" or "SERVICE FEE" → Fees
   - "SALARY" or "WAGES" → Salary
   - "INTEREST" → Interest
   - "TRANSFER" or "TRF" or "EFT" → Transfers
8. If you can identify the bank name and account holder from the statement header, include them.

Return this exact JSON structure:
{
  "bankName": "FNB" | "Standard Bank" | "ABSA" | "Nedbank" | "Capitec" | "TymeBank" | "Discovery Bank" | null,
  "accountHolder": "Name from statement" | null,
  "transactions": [
    {
      "date": "2025-01-15",
      "description": "PNP GREENACRES",
      "amount": -523.45,
      "category": "Groceries",
      "balance_after": 12345.67
    }
  ]
}

If balance_after is not available for a transaction, set it to null.
If you cannot parse the statement at all, return: { "error": "reason" }`;

/**
 * Safely parse Claude's JSON response, handling malformed output gracefully.
 */
function safeParseClaudeJson(rawText: string): {
  bankName: string | null;
  accountHolder: string | null;
  transactions: ParsedTransaction[];
  error?: string;
} {
  const cleaned = rawText
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error("❌ Failed to parse Claude JSON response:", parseErr);
    console.error("Raw response:", rawText.substring(0, 500));
    return {
      bankName: null,
      accountHolder: null,
      transactions: [],
      error:
        "The AI couldn't structure the statement data properly. Please try again or upload a clearer statement.",
    };
  }
}

/**
 * Send extracted text to Claude for structured transaction parsing.
 */
async function parseTransactionsWithClaude(statementText: string): Promise<{
  bankName: string | null;
  accountHolder: string | null;
  transactions: ParsedTransaction[];
  error?: string;
}> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Parse the following bank statement and extract all transactions:\n\n${statementText}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const text = data.content
    ?.filter((block: any) => block.type === "text")
    .map((block: any) => block.text)
    .join("");

  return safeParseClaudeJson(text);
}

/**
 * Send an image directly to Claude Vision for parsing (no OCR step needed).
 */
async function parseImageWithClaude(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<{
  bankName: string | null;
  accountHolder: string | null;
  transactions: ParsedTransaction[];
  error?: string;
}> {
  const base64 = imageBuffer.toString("base64");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64,
              },
            },
            {
              type: "text",
              text: "Parse this bank statement image and extract all transactions.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude Vision API error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  const text = data.content
    ?.filter((block: any) => block.type === "text")
    .map((block: any) => block.text)
    .join("");

  return safeParseClaudeJson(text);
}

// ─── Supabase Storage ────────────────────────────────────────────────────────

/**
 * Store parsed transactions in Supabase.
 * Uses upsert logic based on date + description + amount to avoid duplicates.
 */
async function storeTransactions(
  userId: string,
  transactions: ParsedTransaction[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const tx of transactions) {
    // Check for duplicates (same date, description, and amount)
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("date", tx.date)
      .eq("description", tx.description)
      .eq("amount", tx.amount)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      category: tx.category,
      balance_after: tx.balance_after,
      source: "whatsapp_statement",
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error(`Failed to insert transaction: ${error.message}`);
    } else {
      inserted++;
    }
  }

  return { inserted, skipped };
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

/**
 * Process a bank statement sent via WhatsApp.
 *
 * @param mediaId - WhatsApp media ID from the incoming message
 * @param mimeType - MIME type of the media (e.g. "application/pdf", "image/jpeg")
 * @param userId - Supabase user ID
 * @returns Summary of what was parsed and stored
 */
export async function processStatement(
  mediaId: string,
  mimeType: string,
  userId: string,
): Promise<StatementParseResult> {
  try {
    // 1. Download the media from WhatsApp
    console.log(`📥 Downloading media ${mediaId} (${mimeType})`);
    const mediaInfo = await getMediaUrl(mediaId);
    const fileBuffer = await downloadMedia(mediaInfo.url);
    console.log(`📥 Downloaded ${fileBuffer.length} bytes`);

    // 2. Optionally store the original file in Supabase Storage for audit
    try {
      const ext = mimeType.includes("pdf")
        ? "pdf"
        : mimeType.includes("png")
          ? "png"
          : "jpg";
      const filename = `${userId}/${Date.now()}_statement.${ext}`;

      await supabase.storage.from("statements").upload(filename, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      });

      console.log(`📦 Stored original statement: ${filename}`);
    } catch (storageErr: any) {
      // Non-fatal — continue even if storage fails
      console.warn("⚠️ Failed to store original file:", storageErr.message);
    }

    // 3. Extract and parse transactions
    let parseResult: {
      bankName: string | null;
      accountHolder: string | null;
      transactions: ParsedTransaction[];
      error?: string;
    };

    if (mimeType === "application/pdf") {
      // PDF: extract text first, then send to Claude
      const text = await extractTextFromPdf(fileBuffer);

      if (!text || text.trim().length < 50) {
        // PDF might be image-based (scanned) — fall back to vision
        console.log("📄 PDF has minimal text, trying vision...");
        // Convert first page to image would require a library like pdf-to-img
        // For now, return an error asking for a clearer format
        return {
          success: false,
          transactionCount: 0,
          totalDebits: 0,
          totalCredits: 0,
          dateRange: null,
          bankName: null,
          accountHolder: null,
          error:
            "This PDF appears to be a scanned image. Please try sending a screenshot or photo of your statement instead, or download a text-based PDF from your banking app.",
        };
      }

      parseResult = await parseTransactionsWithClaude(text);
    } else if (
      mimeType.startsWith("image/") ||
      mimeType === "image/jpeg" ||
      mimeType === "image/png" ||
      mimeType === "image/webp"
    ) {
      // Image: send directly to Claude Vision
      parseResult = await parseImageWithClaude(fileBuffer, mimeType);
    } else {
      return {
        success: false,
        transactionCount: 0,
        totalDebits: 0,
        totalCredits: 0,
        dateRange: null,
        bankName: null,
        accountHolder: null,
        error: `Unsupported file type: ${mimeType}. Please send a PDF or photo of your bank statement.`,
      };
    }

    // 4. Check for parse errors
    if (parseResult.error) {
      return {
        success: false,
        transactionCount: 0,
        totalDebits: 0,
        totalCredits: 0,
        dateRange: null,
        bankName: parseResult.bankName,
        accountHolder: parseResult.accountHolder,
        error: parseResult.error,
      };
    }

    if (!parseResult.transactions || parseResult.transactions.length === 0) {
      return {
        success: false,
        transactionCount: 0,
        totalDebits: 0,
        totalCredits: 0,
        dateRange: null,
        bankName: parseResult.bankName,
        accountHolder: parseResult.accountHolder,
        error:
          "No transactions could be found in this statement. Please make sure the statement is clear and readable.",
      };
    }

    // 5. Store transactions in Supabase
    const { inserted, skipped } = await storeTransactions(
      userId,
      parseResult.transactions,
    );

    // 6. Calculate summary
    const txs = parseResult.transactions;
    const debits = txs
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const credits = txs
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const dates = txs
      .map((t) => t.date)
      .filter(Boolean)
      .sort();

    return {
      success: true,
      transactionCount: inserted,
      totalDebits: debits,
      totalCredits: credits,
      dateRange:
        dates.length > 0
          ? { from: dates[0], to: dates[dates.length - 1] }
          : null,
      bankName: parseResult.bankName,
      accountHolder: parseResult.accountHolder,
      ...(skipped > 0 && {
        error: `${skipped} duplicate transaction(s) were skipped.`,
      }),
    };
  } catch (err: any) {
    console.error("❌ Statement processing error:", err);
    return {
      success: false,
      transactionCount: 0,
      totalDebits: 0,
      totalCredits: 0,
      dateRange: null,
      bankName: null,
      accountHolder: null,
      error:
        "Something went wrong while processing your statement. Please try again.",
    };
  }
}

/**
 * Format a parse result into a WhatsApp-friendly message.
 */
export function formatParseResultMessage(result: StatementParseResult): string {
  if (!result.success) {
    return `❌ *Statement Upload Failed*\n\n${result.error}\n\nType *menu* to go back.`;
  }

  let msg = `✅ *Statement Processed!*\n\n`;

  if (result.bankName) {
    msg += `🏦 Bank: ${result.bankName}\n`;
  }

  msg += `📊 Transactions found: ${result.transactionCount}\n`;
  msg += `💸 Total spending: R${result.totalDebits.toFixed(2)}\n`;
  msg += `💰 Total income: R${result.totalCredits.toFixed(2)}\n`;

  if (result.dateRange) {
    msg += `📅 Period: ${result.dateRange.from} to ${result.dateRange.to}\n`;
  }

  if (result.error) {
    // This is the "skipped duplicates" message
    msg += `\nℹ️ ${result.error}\n`;
  }

  msg += `\nYour data is now ready! Try:\n`;
  msg += `💳 *"Balance"* — Updated summary\n`;
  msg += `📂 *"Spending"* — Category breakdown\n`;
  msg += `💬 *"Chat"* — Ask Budget Buddy anything\n`;

  return msg;
}
