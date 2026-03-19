import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed file types and max size (10MB)
const ALLOWED_FILE_TYPES = ['application/pdf', 'text/csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[PARSE-STATEMENT] ========== New Request ==========');

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[AUTH] No authorization header provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[AUTH] User authentication failed:', userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AUTH] Authenticated user:', user.id);

    const { fileContent, fileName, fileType } = await req.json();
    console.log('[REQUEST] File:', fileName, '| Type:', fileType, '| Size:', fileContent?.length || 0, 'bytes (base64)');

    // Server-side file type validation
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      console.error('[VALIDATION] Invalid file type:', fileType);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid file type. Only PDF and CSV files are allowed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!fileContent || !fileName) {
      console.error('[VALIDATION] Missing required fields');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: fileContent and fileName are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode base64 content
    const decodedContent = atob(fileContent);
    const decodedSize = decodedContent.length;
    console.log('[DECODE] Decoded size:', decodedSize, 'bytes');

    // Server-side file size validation
    if (decodedSize > MAX_FILE_SIZE) {
      console.error('[VALIDATION] File too large:', decodedSize, 'bytes (max:', MAX_FILE_SIZE, ')');
      return new Response(
        JSON.stringify({ success: false, error: 'File too large. Maximum size is 10MB.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsedData;

    if (fileType === 'text/csv') {
      console.log('[PARSE] Starting CSV parsing...');
      parsedData = parseCSV(decodedContent, fileName);
    } else if (fileType === 'application/pdf') {
      console.log('[PARSE] Starting PDF parsing...');
      parsedData = await parsePDF(decodedContent, fileName);
    } else {
      throw new Error('Unsupported file type');
    }

    const processingTime = Date.now() - startTime;
    console.log('[SUCCESS] Parsing completed in', processingTime, 'ms');
    console.log('[RESULT] Bank:', parsedData.accountInfo?.bankName);
    console.log('[RESULT] Account:', parsedData.accountInfo?.accountNumber);
    console.log('[RESULT] Balance:', parsedData.accountInfo?.currentBalance);
    console.log('[RESULT] Transactions:', parsedData.transactions?.length || 0);

    return new Response(
      JSON.stringify({
        success: true,
        ...parsedData,
        debug: {
          processingTimeMs: processingTime,
          fileSize: decodedSize,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('[ERROR] Parse error after', processingTime, 'ms:', error);
    console.error('[ERROR] Stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          processingTimeMs: processingTime,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        }
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseCSV(content: string, fileName: string) {
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error('Empty CSV file');
  }

  // Detect bank from filename or content
  const bankName = detectBank(fileName, content);
  
  // Parse header - support various column naming conventions
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  
  // Find column indices with multiple possible names per field
  const dateIdx = headers.findIndex(h => 
    h.includes('date') || h.includes('transaction date') || h === 'date'
  );
  const descIdx = headers.findIndex(h => 
    h.includes('description') || h.includes('detail') || h.includes('narrative') || h === 'description'
  );
  const amountIdx = headers.findIndex(h => 
    h.includes('amount') || h.includes('value') || h === 'amount'
  );
  const balanceIdx = headers.findIndex(h => 
    h.includes('balance') || h === 'balance'
  );
  const typeIdx = headers.findIndex(h => 
    h.includes('type') || h === 'type'
  );
  
  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    throw new Error('Could not find required columns in CSV');
  }

  const transactions = [];
  let accountNumber = '';
  let currentBalance = 0;

  // Parse transactions
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    
    // Try to extract account number from first few rows
    if (i <= 5 && !accountNumber) {
      const accMatch = lines[i].match(/\b\d{10,16}\b/);
      if (accMatch) {
        accountNumber = accMatch[0];
      }
    }

    if (values.length > Math.max(dateIdx, descIdx, amountIdx)) {
      const rawAmount = values[amountIdx];
      const amount = parseAmount(rawAmount);
      const balance = balanceIdx !== -1 ? parseAmount(values[balanceIdx]) : 0;
      const rawDescription = values[descIdx];
      const typeValue = typeIdx !== -1 ? values[typeIdx] : '';
      
      if (balance > 0) {
        currentBalance = balance;
      }

      // Determine transaction type
      const isDebit = rawAmount.includes('-') || 
                      typeValue.toUpperCase().includes('DEBIT') ||
                      rawDescription.toUpperCase().includes('DEBIT') ||
                      rawDescription.toUpperCase().includes('PURCHASE') ||
                      rawDescription.toUpperCase().includes('PAYMENT');

      transactions.push({
        date: normalizeDate(values[dateIdx], bankName),
        description: rawDescription,
        amount: Math.abs(amount),
        balance: balance,
        reference: rawDescription.substring(0, 50),
        merchantName: extractMerchantName(rawDescription),
        type: isDebit ? 'debit' : 'credit',
      });
    }
  }

  // If no account number found, use better extraction
  if (!accountNumber) {
    const fullContent = lines.slice(0, 5).join('\n');
    accountNumber = extractAccountNumber(fullContent, bankName);
  }

  // Detect account type
  const accountType = detectAccountType(content, fileName);

  return {
    accountInfo: {
      accountNumber,
      bankName,
      accountType,
      accountName: `${bankName} Account`,
      currentBalance,
      currency: 'ZAR',
    },
    transactions,
    summary: {
      totalTransactions: transactions.length,
      dateRange: transactions.length > 0 ? {
        from: transactions[transactions.length - 1].date,
        to: transactions[0].date,
      } : null,
    },
  };
}

async function parsePDF(content: string, fileName: string) {
  console.log('[PDF] Starting PDF parsing...');

  try {
    // 1. Use Kimi Files API to extract raw text from the PDF (fast ~5-8s)
    const extractedText = await extractTextWithKimi(content);
    console.log('[KIMI] Extracted text length:', extractedText.length, 'chars');

    if (extractedText.length < 50) {
      throw new Error('Unable to extract readable content from PDF.');
    }

    // 2. Detect bank, account, balance from extracted text using regex
    const bankName = detectBank(fileName, extractedText);
    console.log('[BANK] Detected bank:', bankName);

    const accountNumber = extractAccountNumber(extractedText, bankName);
    console.log('[ACCOUNT] Extracted account number:', accountNumber);

    const accountType = detectAccountType(extractedText, fileName);
    console.log('[ACCOUNT-TYPE] Detected type:', accountType);

    let currentBalance = 0;
    const balancePatterns = [
      /(?:Current|Closing|Available|Statement)\s+Balance[:\s]+R?\s*([\d,\s]+\.?\d*)/gi,
      /Balance[:\s]+R?\s*([\d,\s]+\.?\d*)/gi,
    ];
    for (const pattern of balancePatterns) {
      const matches = Array.from(extractedText.matchAll(pattern));
      if (matches.length > 0) {
        const last = matches[matches.length - 1] as RegExpMatchArray;
        if (last[1]) { currentBalance = parseAmount(last[1]); break; }
      }
    }
    console.log('[BALANCE] Extracted balance:', currentBalance);

    // 3. Extract transactions
    const transactions = await extractTransactionsFromPDF(extractedText, bankName);
    console.log('[TRANSACTIONS] Extracted', transactions.length, 'transactions');

    if (transactions.length > 0) {
      console.log('[TRANSACTIONS] Sample:', JSON.stringify(transactions[0], null, 2));
    }

    // Use the last transaction's balance as the closing/available balance
    const finalBalance = [...transactions].reverse().find(t => t.balance > 0)?.balance ?? currentBalance;

    return {
      accountInfo: {
        accountNumber,
        bankName,
        accountType,
        accountName: `${bankName} ${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account`,
        currentBalance: finalBalance,
        currency: 'ZAR',
      },
      transactions,
      summary: {
        totalTransactions: transactions.length,
        dateRange: transactions.length > 0 ? {
          from: transactions[transactions.length - 1].date,
          to: transactions[0].date,
        } : null,
      },
    };
  } catch (error) {
    console.error('[PDF] Error during PDF parsing:', error);
    console.error('[PDF] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

// ─── Kimi: PDF → text extraction ─────────────────────────────────────────────

async function extractTextWithKimi(pdfContent: string): Promise<string> {
  const apiKey = Deno.env.get('KIMI_API_KEY')?.trim();
  console.log('[KIMI-DEBUG] Key present:', !!apiKey, 'Length:', apiKey?.length);
  console.log('[KIMI-DEBUG] Auth header preview:', `Bearer ${apiKey?.slice(0, 10)}...`);
  if (!apiKey) throw new Error('KIMI_API_KEY is not configured');

  // 1. Upload PDF
  const pdfBytes = Uint8Array.from(pdfContent, (c) => c.charCodeAt(0));
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', blob, 'statement.pdf');
  formData.append('purpose', 'file-extract');

  const uploadResponse = await fetch('https://api.moonshot.ai/v1/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!uploadResponse.ok) {
    const err = await uploadResponse.text();
    throw new Error(`Kimi upload failed: ${uploadResponse.status} - ${err}`);
  }

  const fileData = await uploadResponse.json();
  const fileId = fileData.id as string;
  console.log('[KIMI] File uploaded, id:', fileId);

  try {
    // 2. Fetch extracted text
    const contentResponse = await fetch(
      `https://api.moonshot.ai/v1/files/${fileId}/content`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    if (!contentResponse.ok) {
      const err = await contentResponse.text();
      throw new Error(`Kimi content fetch failed: ${contentResponse.status} - ${err}`);
    }

    const contentData = await contentResponse.json();
    const extractedText: string = contentData.content ?? '';
    console.log('[KIMI] Extracted text length:', extractedText.length, 'chars');
    return extractedText;
  } finally {
    // 3. Cleanup
    await fetch(`https://api.moonshot.ai/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}` },
    }).catch((e) => console.warn('[KIMI] File cleanup failed:', e));
  }
}

// ─── Regex Transaction Extraction ────────────────────────────────────────────

async function extractTransactionsFromPDF(content: string, bankName: string) {
  console.log('[TRANS-EXTRACT] Extracting transactions for bank:', bankName);
  // Use Kimi moonshot-v1-32k for all banks — handles every SA bank statement format
  // including Standard Bank, Capitec, FNB, ABSA, Nedbank, TymeBank, Bank Zero, etc.
  const transactions = await extractTransactionsWithKimi(content, bankName);
  console.log('[TRANS-EXTRACT] Total transactions extracted:', transactions.length);
  return transactions;
}

// ─── Kimi: structured transaction extraction ──────────────────────────────────

async function extractTransactionsWithKimi(text: string, bankName: string) {
  const apiKey = Deno.env.get('KIMI_API_KEY')?.trim()!;
  console.log('[KIMI-TRANS]', bankName, ': sending full text (', text.length, 'chars) to moonshot-v1-128k');

  const systemPrompt = `You extract transactions from South African bank statement text. The text comes from a PDF and may be one continuous string without line breaks.

Return ONLY a valid JSON array — no markdown, no explanation.

Each element:
{
  "date": "YYYY-MM-DD",
  "description": "full transaction description including merchant or beneficiary name",
  "amount": 123.45,
  "balance": 1234.56,
  "type": "debit" or "credit"
}

Rules:
- Dates are typically in "DD Mon YY" format (e.g., "05 Jan 26" → "2026-01-05")

- description: The merchant, beneficiary, or reference name ONLY — strip the transaction type prefix. South African bank statements prefix each transaction with a type keyword; remove it and return only what follows. Examples:
    "Cheque Purchase SHOPRITE CHECKERS CPT" → "SHOPRITE CHECKERS CPT"
    "Internet Transfer JOHN SMITH" → "JOHN SMITH"
    "Debit Order VODACOM" → "VODACOM"
    "Immediate Payment LANDLORD NAME" → "LANDLORD NAME"
    "ATM Withdrawal STANDARD BANK ATM 001" → "STANDARD BANK ATM 001"
    "IB Transfer From SALARY EMPLOYER" → "SALARY EMPLOYER"
  Prefixes to strip: "Cheque Purchase", "Internet Transfer", "IB Transfer", "Debit Order", "Immediate Payment", "ATM Withdrawal", "Monthly Service Fee", "Annual Service Fee", "Card Purchase", "Point of Sale", "POS Purchase", and any similar transaction type label.
  If there is no merchant/beneficiary text after the prefix (e.g. just "Monthly Service Fee"), keep the prefix as the description.

- amount: ALWAYS a positive number representing only the transaction value — NEVER add the balance to the amount
- balance: the running account balance AFTER this transaction — it CAN be negative (e.g., -150.00 means the account is overdrawn)
- amount and balance are always two separate independent values from two separate columns; do NOT sum or combine them
- type: "debit" if money left the account, "credit" if money was received
- If uncertain about debit/credit, compare consecutive balances: balance went down = debit, went up = credit
- Skip opening balance rows, closing balance rows, header/footer rows, and any row without a clear transaction amount`;

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'moonshot-v1-128k',
      max_tokens: 16000,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract all transactions from this ${bankName} statement text:\n\n${text}` },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[KIMI-TRANS] Request failed:', response.status, err);
    return [];
  }

  const data = await response.json();
  const raw: string = data.choices?.[0]?.message?.content ?? '[]';
  const clean = raw.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) {
    console.error('[KIMI-TRANS] No JSON array in response');
    return [];
  }
  const parsed = JSON.parse(match[0]);
  console.log('[KIMI-TRANS] Extracted', parsed.length, 'transactions');

  return parsed.map((tx: { date: string; description: string; amount: number; balance: number; type: 'debit' | 'credit' }) => ({
    date: tx.date,
    description: tx.description ?? '',
    amount: tx.amount,
    balance: tx.balance,
    reference: (tx.description ?? '').substring(0, 50),
    merchantName: extractMerchantName(tx.description ?? ''),
    type: tx.type,
  }));
}

function detectBank(fileName: string, content: string): string {
  console.log('[DETECT-BANK] Analyzing file:', fileName);
  const contentUpper = content.toUpperCase();
  const fileUpper = fileName.toUpperCase();
  
  // Scoring system - each bank gets points based on matches
  const bankScores: Record<string, number> = {
    // Major retail banks
    'Capitec': 0,
    'FNB': 0,
    'ABSA': 0,
    'Standard Bank': 0,
    'Nedbank': 0,
    'Discovery Bank': 0,
    'TymeBank': 0,
    'Bank Zero': 0,
    'Investec': 0,
    // Additional SA banks
    'African Bank': 0,
    'Bidvest Bank': 0,
    'Sasfin Bank': 0,
    'Grindrod Bank': 0,
    'Mercantile Bank': 0,
    'SA Post Bank': 0,
    'Ubank': 0,
    'FinBond': 0,
    'Access Bank': 0,
    'Old Mutual': 0,
  };
  
  // HIGH-WEIGHT patterns (bank statement headers, branding) - +10 points
  const headerPatterns: Record<string, RegExp[]> = {
    'Capitec': [/CAPITEC\s+BANK\s+STATEMENT/i, /CAPITEC\s+BANK\s+LTD/i, /CAPITEC\s+SAVINGS\s+ACCOUNT/i],
    'Standard Bank': [/STANDARD\s+BANK\s+STATEMENT/i, /STANDARD\s+BANK\s+OF\s+SOUTH\s+AFRICA/i, /THE\s+STANDARD\s+BANK/i, /SBSA/i],
    'FNB': [/FNB\s+STATEMENT/i, /FIRST\s+NATIONAL\s+BANK\s+STATEMENT/i, /FNB\s+PRIVATE/i, /FIRSTRAND\s+BANK/i],
    'ABSA': [/ABSA\s+BANK\s+STATEMENT/i, /ABSA\s+STATEMENT/i, /ABSA\s+GROUP/i],
    'Nedbank': [/NEDBANK\s+STATEMENT/i, /NEDBANK\s+LTD/i, /NEDBANK\s+LIMITED/i],
    'Discovery Bank': [/DISCOVERY\s+BANK\s+STATEMENT/i, /DISCOVERY\s+BANK\s+LIMITED/i],
    'TymeBank': [/TYMEBANK\s+STATEMENT/i, /TYME\s+DIGITAL/i, /TYME\s+BANK\s+STATEMENT/i],
    'Bank Zero': [/BANK\s+ZERO\s+STATEMENT/i, /BANKZERO\s+STATEMENT/i],
    'Investec': [/INVESTEC\s+STATEMENT/i, /INVESTEC\s+BANK\s+LIMITED/i, /INVESTEC\s+PRIVATE\s+BANK/i],
    // Additional SA banks
    'African Bank': [/AFRICAN\s+BANK\s+STATEMENT/i, /AFRICAN\s+BANK\s+LIMITED/i],
    'Bidvest Bank': [/BIDVEST\s+BANK\s+STATEMENT/i, /BIDVEST\s+BANK\s+LIMITED/i],
    'Sasfin Bank': [/SASFIN\s+BANK\s+STATEMENT/i, /SASFIN\s+HOLDINGS/i],
    'Grindrod Bank': [/GRINDROD\s+BANK\s+STATEMENT/i, /GRINDROD\s+LIMITED/i],
    'Mercantile Bank': [/MERCANTILE\s+BANK\s+STATEMENT/i, /MERCANTILE\s+BANK\s+HOLDINGS/i],
    'SA Post Bank': [/POSTBANK\s+STATEMENT/i, /SA\s+POST\s+BANK/i, /SOUTH\s+AFRICAN\s+POST\s+OFFICE/i],
    'Ubank': [/UBANK\s+STATEMENT/i, /UBANK\s+LIMITED/i],
    'FinBond': [/FINBOND\s+STATEMENT/i, /FINBOND\s+MUTUAL\s+BANK/i],
    'Access Bank': [/ACCESS\s+BANK\s+STATEMENT/i, /ACCESS\s+BANK\s+SOUTH\s+AFRICA/i],
    'Old Mutual': [/OLD\s+MUTUAL\s+STATEMENT/i, /OLD\s+MUTUAL\s+MONEY\s+ACCOUNT/i],
  };
  
  // Check header patterns (high weight: +10 points)
  for (const [bank, patterns] of Object.entries(headerPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(contentUpper)) {
        bankScores[bank] += 10;
        console.log(`[DETECT-BANK] Header match for ${bank}: +10`);
      }
    }
  }
  
  // Check filename (medium weight: +5 points)
  const filePatterns: Record<string, string[]> = {
    'Capitec': ['CAPITEC'],
    'Standard Bank': ['STANDARD', 'STANBIC', 'SBSA'],
    'FNB': ['FNB', 'FIRSTRAND'],
    'ABSA': ['ABSA'],
    'Nedbank': ['NEDBANK'],
    'Discovery Bank': ['DISCOVERY'],
    'TymeBank': ['TYME'],
    'Bank Zero': ['BANKZERO', 'BANK-ZERO'],
    'Investec': ['INVESTEC'],
    // Additional SA banks
    'African Bank': ['AFRICAN'],
    'Bidvest Bank': ['BIDVEST'],
    'Sasfin Bank': ['SASFIN'],
    'Grindrod Bank': ['GRINDROD'],
    'Mercantile Bank': ['MERCANTILE'],
    'SA Post Bank': ['POSTBANK', 'SASSA'],
    'Ubank': ['UBANK'],
    'FinBond': ['FINBOND'],
    'Access Bank': ['ACCESS'],
    'Old Mutual': ['OLDMUTUAL'],
  };
  
  for (const [bank, keywords] of Object.entries(filePatterns)) {
    for (const keyword of keywords) {
      if (fileUpper.includes(keyword)) {
        bankScores[bank] += 5;
        console.log(`[DETECT-BANK] Filename match for ${bank}: +5`);
      }
    }
  }
  
  // Check general content mentions (low weight: +1 point)
  // This catches banks mentioned in transactions but doesn't override header matches
  const contentPatterns: Record<string, string[]> = {
    'Capitec': ['CAPITEC'],
    'Standard Bank': ['STANDARD BANK'],
    'FNB': ['FNB', 'FIRST NATIONAL BANK'],
    'ABSA': ['ABSA'],
    'Nedbank': ['NEDBANK'],
    'Discovery Bank': ['DISCOVERY BANK'],
    'TymeBank': ['TYMEBANK', 'TYME BANK'],
    'Bank Zero': ['BANK ZERO', 'BANKZERO'],
    'Investec': ['INVESTEC'],
    // Additional SA banks
    'African Bank': ['AFRICAN BANK'],
    'Bidvest Bank': ['BIDVEST BANK'],
    'Sasfin Bank': ['SASFIN'],
    'Grindrod Bank': ['GRINDROD'],
    'Mercantile Bank': ['MERCANTILE BANK'],
    'SA Post Bank': ['POSTBANK', 'SA POST BANK', 'SASSA'],
    'Ubank': ['UBANK'],
    'FinBond': ['FINBOND'],
    'Access Bank': ['ACCESS BANK'],
    'Old Mutual': ['OLD MUTUAL'],
  };
  
  for (const [bank, keywords] of Object.entries(contentPatterns)) {
    for (const keyword of keywords) {
      if (contentUpper.includes(keyword)) {
        bankScores[bank] += 1;
        console.log(`[DETECT-BANK] Content match for ${bank}: +1`);
      }
    }
  }
  
  // Find the bank with the highest score
  let maxScore = 0;
  let detectedBank = 'Unknown Bank';
  
  for (const [bank, score] of Object.entries(bankScores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedBank = bank;
    }
  }
  
  console.log('[DETECT-BANK] Final scores:', JSON.stringify(bankScores));
  console.log('[DETECT-BANK] Detected bank:', detectedBank, 'with score:', maxScore);
  
  if (maxScore === 0) {
    console.log('[DETECT-BANK] No match found - returning Unknown Bank');
    console.log('[DETECT-BANK] Content sample (first 1000 chars):', content.substring(0, 1000));
  }
  
  return detectedBank;
}

function extractAccountNumber(content: string, bankName: string): string {
  console.log('[EXTRACT-ACCT] Extracting account number for bank:', bankName);
  
  // Bank-specific patterns
  const bankPatterns: Record<string, RegExp[]> = {
    'FNB': [
      /Account\s+Number[:\s]+(\d{10,16})/i,
      /Acc(?:ount)?[:\s]+(\d{10,16})/i
    ],
    'ABSA': [
      /Account\s+(?:Number|No)[:\s]+(\d{10,16})/i,
      /(\d{10})\s+\d{2}\/\d{2}\/\d{4}/
    ],
    'Standard Bank': [
      /Account\s+Number[:\s]*\*{0,2}\s*(\d[\d\s]{8,18}\d)/i,  // Handle spaces in number
      /Account\s+(?:Number|No)[:\s]+(\d[\d\s]{8,18}\d)/i,
      /Acc[:\s]+(\d[\d\s]{8,18}\d)/i
    ],
    'Nedbank': [
      /Account\s+Number[:\s]+(\d{10,16})/i,
      /(\d{10,16})\s+Current/i
    ],
    'Capitec': [
      /Account:\s*(\d{10,16})/i,
      /Account\s+Number[:\s]+(\d{10,16})/i,
    ]
  };

  // Try bank-specific patterns first
  const patterns = bankPatterns[bankName] || [];
  console.log('[EXTRACT-ACCT] Trying', patterns.length, 'bank-specific patterns');
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const match = content.match(pattern);
    if (match && match[1]) {
      const fullNumber = match[1].replace(/[\s-]/g, '');
      console.log('[EXTRACT-ACCT] Matched with bank-specific pattern', i + 1, ':', fullNumber);
      
      // For Capitec, return only last 4 digits
      if (bankName === 'Capitec' && fullNumber.length >= 4) {
        const maskedNumber = fullNumber.slice(-4);
        console.log('[EXTRACT-ACCT] Capitec - using last 4 digits:', maskedNumber);
        return maskedNumber;
      }
      return fullNumber;
    }
  }

  console.log('[EXTRACT-ACCT] No bank-specific match, trying generic patterns...');

  // Generic fallback patterns
  const genericPatterns = [
    /Account\s*(?:Number|No|#)?[:\s]+(\d{10,16})/i,
    /Acc(?:ount)?[:\s]+(\d{10,16})/i,
    /A\/C[:\s]+(\d{10,16})/i,
    /(\d{10,16})\s*(?:Cheque|Current|Savings)/i,
    /\b(\d{10,16})\b/
  ];

  for (let i = 0; i < genericPatterns.length; i++) {
    const pattern = genericPatterns[i];
    const match = content.match(pattern);
    if (match && match[1]) {
      const fullNumber = match[1].replace(/[\s-]/g, '');
      console.log('[EXTRACT-ACCT] Matched with generic pattern', i + 1, ':', fullNumber);
      
      // For Capitec, return only last 4 digits
      if (bankName === 'Capitec' && fullNumber.length >= 4) {
        const maskedNumber = fullNumber.slice(-4);
        console.log('[EXTRACT-ACCT] Capitec - using last 4 digits:', maskedNumber);
        return maskedNumber;
      }
      return fullNumber;
    }
  }

  console.log('[EXTRACT-ACCT] No account number found - returning default 0000');
  return '0000';
}

function normalizeDate(dateStr: string, bankName: string): string {
  // Handle DD MMM YY format (Standard Bank: "03 Jul 25")
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const shortDateMatch = dateStr.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})/i);
  if (shortDateMatch) {
    const day = shortDateMatch[1].padStart(2, '0');
    const monthIdx = monthNames.indexOf(shortDateMatch[2].toLowerCase());
    const month = monthIdx >= 0 ? String(monthIdx + 1).padStart(2, '0') : '01';
    const year = '20' + shortDateMatch[3];
    return `${year}-${month}-${day}`;
  }
  
  // Handle DD MMM YYYY format ("03 Jul 2025")
  const longDateMatch = dateStr.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/i);
  if (longDateMatch) {
    const day = longDateMatch[1].padStart(2, '0');
    const monthIdx = monthNames.indexOf(longDateMatch[2].toLowerCase());
    const month = monthIdx >= 0 ? String(monthIdx + 1).padStart(2, '0') : '01';
    const year = longDateMatch[3];
    return `${year}-${month}-${day}`;
  }
  
  // Handle different SA bank date formats
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts[0].length === 4) {
      // YYYY/MM/DD (Capitec)
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else {
      // DD/MM/YYYY (FNB, Standard Bank)
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      // Already YYYY-MM-DD (ABSA)
      return dateStr;
    } else {
      // DD-MM-YYYY (Nedbank)
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  return dateStr;
}

function extractMerchantName(description: string): string {
  let merchant = description
    .replace(/\bPURCHASE\b|\bDEBIT\b|\bCREDIT\b|\bPAYMENT\b|\bTRANSFER\b/gi, '')
    .replace(/\bCARD\s+\d+/gi, '') // Remove card numbers
    .replace(/\d{2}\/\d{2}\/\d{4}/g, '') // Remove dates
    .replace(/\d{4}-\d{2}-\d{2}/g, '') // Remove dates
    .replace(/\s+/g, ' ')
    .trim();
  
  // Take first meaningful part (often the merchant name comes first)
  const parts = merchant.split(/\s{2,}/); // Split on multiple spaces
  merchant = parts[0] || merchant;
  
  return merchant.substring(0, 100); // Limit length
}

function detectAccountType(content: string, fileName: string): 'checking' | 'savings' | 'credit' {
  const lower = (content + fileName).toLowerCase();
  
  if (lower.includes('savings') || lower.includes('save')) {
    return 'savings';
  }
  if (lower.includes('credit') || lower.includes('card')) {
    return 'credit';
  }
  return 'checking';
}

function parseAmount(value: string): number {
  // Remove currency symbols, spaces, and commas
  const cleaned = value.replace(/[R\s,]/g, '');
  
  // Handle negative amounts in parentheses
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    return -parseFloat(cleaned.slice(1, -1));
  }
  
  return parseFloat(cleaned) || 0;
}
