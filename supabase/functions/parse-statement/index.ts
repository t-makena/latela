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

    // 3. Extract transactions using regex
    const transactions = extractTransactionsFromPDF(extractedText, bankName);
    console.log('[TRANSACTIONS] Extracted', transactions.length, 'transactions');

    if (transactions.length > 0) {
      console.log('[TRANSACTIONS] Sample:', JSON.stringify(transactions[0], null, 2));
    }

    const finalBalance = transactions.find(t => t.balance > 0)?.balance ?? currentBalance;

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

function extractTransactionsFromPDF(content: string, bankName: string) {
  const transactions: Array<{
    date: string;
    description: string;
    amount: number;
    balance: number;
    reference: string;
    merchantName: string;
    type: 'debit' | 'credit';
  }> = [];
  console.log('[TRANS-EXTRACT] Extracting transactions for bank:', bankName);
  
  // Capitec-specific parsing using table structure
  if (bankName === 'Capitec') {
    console.log('[TRANS-EXTRACT] Using Capitec-specific parsing logic');
    // Match Capitec transaction rows: Date | Description | Category | Money In | Money Out | Fee* | Balance
    // Pattern to match: DD/MM/YYYY followed by text, then amounts
    const lines = content.split('\n');
    console.log('[TRANS-EXTRACT] Processing', lines.length, 'lines');
    
    let matchedLines = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Match Capitec date format (DD/MM/YYYY)
      const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)/);
      if (!dateMatch) continue;
      
      matchedLines++;
      if (matchedLines <= 3) {
        console.log(`[TRANS-EXTRACT] Matched line ${matchedLines}:`, line.substring(0, 100));
      }
      
      const dateStr = dateMatch[1];
      const restOfLine = dateMatch[2];
      
      // Split by pipe or multiple spaces to separate columns
      const parts = restOfLine.split(/\s*\|\s*|\s{2,}/).filter(p => p.trim());
      
      if (parts.length < 2) continue;
      
      // Description is the first part
      let description = parts[0].trim();
      
      // Find money amounts in the remaining parts
      let moneyIn = 0;
      let moneyOut = 0;
      let fee = 0;
      let balance = 0;
      
      // Look for amounts in format: optional negative, digits with optional commas and spaces, dot, 2 decimals
      const amountPattern = /(-)?[\d,\s]+\.\d{2}/g;
      
      for (let j = 1; j < parts.length; j++) {
        const part = parts[j].trim();
        const amounts = part.match(amountPattern);
        
        if (amounts) {
          for (const amt of amounts) {
            const parsedAmt = parseAmount(amt);
            
            // Determine which column this amount belongs to based on position and value
            if (parsedAmt > 0 && moneyIn === 0 && j < parts.length - 2) {
              moneyIn = parsedAmt;
            } else if (parsedAmt < 0 || (moneyOut === 0 && j < parts.length - 2)) {
              if (Math.abs(parsedAmt) < 50 && fee === 0) {
                fee = Math.abs(parsedAmt);
              } else if (moneyOut === 0) {
                moneyOut = Math.abs(parsedAmt);
              }
            } else if (j === parts.length - 1 || balance === 0) {
              balance = Math.abs(parsedAmt);
            }
          }
        }
      }
      
      // Determine transaction type and amount
      let amount = 0;
      let isDebit = false;
      
      if (moneyOut > 0) {
        amount = moneyOut;
        isDebit = true;
      } else if (moneyIn > 0) {
        amount = moneyIn;
        isDebit = false;
      }
      
      // Add fee to the transaction amount if it's a debit
      if (fee > 0 && isDebit) {
        amount += fee;
      }
      
      // Skip if no valid amount found
      if (amount === 0) continue;
      
      // Additional checks for transaction type based on description
      const descUpper = description.toUpperCase();
      if (!isDebit) {
        isDebit = descUpper.includes('PURCHASE') ||
                  descUpper.includes('PAYMENT') && !descUpper.includes('RECEIVED') ||
                  descUpper.includes('WITHDRAWAL') ||
                  descUpper.includes('FEE') ||
                  descUpper.includes('SENT') ||
                  descUpper.includes('DEBIT ORDER') ||
                  descUpper.includes('TRANSFER') && !descUpper.includes('FROM');
      }
      
      transactions.push({
        date: normalizeDate(dateStr, bankName),
        description: description,
        amount: amount,
        balance: balance,
        reference: description.substring(0, 50),
        merchantName: extractMerchantName(description),
        type: isDebit ? 'debit' : 'credit',
      });
    }
    
    console.log('[TRANS-EXTRACT] Capitec: Matched', matchedLines, 'date lines, created', transactions.length, 'transactions');
  } else if (bankName === 'Standard Bank') {
    // Standard Bank PDF extracted text is one long continuous string — transactions are NOT
    // newline-separated. Scan the full text globally for DD Mon YY date markers, then extract
    // the block between each date and the next to parse description + amounts.
    console.log('[TRANS-EXTRACT] Using Standard Bank global-scan parsing logic');

    // Flatten to a single string to handle cross-line concatenation
    const fullText = content.replace(/\n/g, ' ');

    // Match DD Mon YY dates that are NOT part of a 4-digit year (use negative lookahead (?!\d))
    const dateFinder = /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2})(?!\d)/gi;
    const dateMatches = [...fullText.matchAll(dateFinder)];
    console.log('[TRANS-EXTRACT] Standard Bank: found', dateMatches.length, 'date markers');

    for (let i = 0; i < dateMatches.length; i++) {
      const dm = dateMatches[i];
      const dateStr = dm[1].trim();
      const blockStart = dm.index! + dm[0].length;
      const blockEnd = i + 1 < dateMatches.length ? dateMatches[i + 1].index! : fullText.length;
      const block = fullText.substring(blockStart, blockEnd).trim();

      if (block.length < 3) continue;

      // Find all decimal amounts in the block (e.g., -1,234.56 or 800.00)
      const amountRegex = /(-?\d{1,3}(?:,\d{3})*\.\d{2})/g;
      const amounts: { value: number; negative: boolean; raw: string }[] = [];
      let am;
      while ((am = amountRegex.exec(block)) !== null) {
        const raw = am[1];
        amounts.push({ value: parseAmount(raw.replace('-', '')), negative: raw.startsWith('-'), raw });
      }

      // Need at least 2 amounts: transaction amount + balance
      if (amounts.length < 2) continue;

      const balance = amounts[amounts.length - 1].value;
      const txAmt = amounts[amounts.length - 2];

      // Skip if transaction amount is zero (opening balance rows etc.)
      if (txAmt.value === 0) continue;

      // Description = everything before the first amount
      const firstAmtIdx = block.indexOf(amounts[0].raw);
      const description = block.substring(0, firstAmtIdx).trim().replace(/\s{2,}/g, ' ');
      if (description.length < 2) continue;

      // Determine debit/credit from sign, then keyword-override
      let isDebit = txAmt.negative;
      const descUpper = description.toUpperCase();
      if (descUpper.includes('PURCHASE') || descUpper.includes('PAYMENT TO') ||
          descUpper.includes('FEE') || descUpper.includes('WITHDRAWAL') ||
          descUpper.includes('DEBIT') || descUpper.includes('DECLINED')) {
        isDebit = true;
      } else if (descUpper.includes('SALARY') || descUpper.includes('CREDIT') ||
                 descUpper.includes('REFUND') || descUpper.includes('REVERSAL') ||
                 descUpper.includes('DEPOSIT') || descUpper.includes('RECEIVED')) {
        isDebit = false;
      }

      transactions.push({
        date: normalizeDate(dateStr, bankName),
        description,
        amount: txAmt.value,
        balance,
        reference: description.substring(0, 50),
        merchantName: extractMerchantName(description),
        type: isDebit ? 'debit' : 'credit',
      });
    }

    console.log('[TRANS-EXTRACT] Standard Bank: created', transactions.length, 'transactions');
  } else {
    console.log('[TRANS-EXTRACT] Using generic parsing logic');
    // Generic parsing for other banks
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    console.log('[TRANS-EXTRACT] Processing', lines.length, 'lines');
    
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{4}\/\d{1,2}\/\d{1,2})/,
      /(\d{1,2}-\d{1,2}-\d{4})/,
      /(\d{4}-\d{1,2}-\d{1,2})/,
      /(\d{2}\s+[A-Za-z]{3}\s+\d{4})/,
    ];
    
    const amountPattern = /R?\s*([\d,\s]+\.\d{2})/;
    
    let matchedLines = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      let dateMatch = null;
      let dateStr = '';
      
      for (const datePattern of datePatterns) {
        dateMatch = line.match(datePattern);
        if (dateMatch) {
          dateStr = dateMatch[1];
          break;
        }
      }
      
      if (!dateMatch) continue;
      
      matchedLines++;
      if (matchedLines <= 3) {
        console.log(`[TRANS-EXTRACT] Matched line ${matchedLines}:`, line.substring(0, 100));
      }
      
      const afterDate = line.substring(line.indexOf(dateStr) + dateStr.length).trim();
      
      const amounts = [];
      let match;
      const amountRegex = new RegExp(amountPattern, 'g');
      while ((match = amountRegex.exec(afterDate)) !== null) {
        amounts.push(match[1]);
      }
      
      if (amounts.length === 0) continue;
      
      const firstAmountIndex = afterDate.indexOf(amounts[0]);
      let description = afterDate.substring(0, firstAmountIndex).trim();
      
      if (description.length < 3 && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!datePatterns.some(p => p.test(nextLine))) {
          description = nextLine.trim();
          i++;
        }
      }
      
      const amount = amounts.length >= 2 ? parseAmount(amounts[amounts.length - 2]) : parseAmount(amounts[0]);
      const balance = amounts.length >= 2 ? parseAmount(amounts[amounts.length - 1]) : 0;
      
      const descUpper = description.toUpperCase();
      const isDebit = descUpper.includes('DEBIT') || 
                      descUpper.includes('PURCHASE') ||
                      descUpper.includes('PAYMENT') ||
                      descUpper.includes('WITHDRAWAL') ||
                      descUpper.includes('FEE') ||
                      descUpper.includes('LEVY') ||
                      amount < 0;
      
      if (description.length > 2) {
        transactions.push({
          date: normalizeDate(dateStr, bankName),
          description: description,
          amount: Math.abs(amount),
          balance: balance,
          reference: description.substring(0, 50),
          merchantName: extractMerchantName(description),
          type: isDebit ? 'debit' : 'credit',
        });
      }
    }
    
    console.log('[TRANS-EXTRACT] Generic: Matched', matchedLines, 'date lines, created', transactions.length, 'transactions');
  }
  
  return transactions;
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
