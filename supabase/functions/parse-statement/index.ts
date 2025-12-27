import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed file types and max size (10MB)
const ALLOWED_FILE_TYPES = ['application/pdf', 'text/csv'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

serve(async (req) => {
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
  console.log('[PDF] Starting Claude Vision extraction...');
  
  try {
    // Use Claude Vision API for PDF text extraction
    console.log('[PDF] Running Claude Vision extraction...');
    const extractedText = await extractTextWithClaude(content);
    
    console.log('[CLAUDE] Extracted text length:', extractedText.length, 'characters');
    
    if (extractedText.length < 50) {
      console.error('[PDF] CRITICAL: Insufficient text extracted');
      console.error('[PDF] Extracted text length:', extractedText.length);
      throw new Error(
        `Unable to extract readable text from PDF. ` +
        `Extracted only ${extractedText.length} characters. ` +
        `The PDF may be corrupted or contain no readable content.`
      );
    }
    
    // Detect bank
    const bankName = detectBank(fileName, extractedText);
    console.log('[BANK] Detected bank:', bankName);
    
    // Extract account number
    const accountNumber = extractAccountNumber(extractedText, bankName);
    console.log('[ACCOUNT] Extracted account number:', accountNumber);
    
    // Extract balance with specific patterns for different banks
    let currentBalance = 0;
    console.log('[BALANCE] Attempting to extract balance...');
    
    // Capitec-specific balance extraction
    if (bankName === 'Capitec') {
      const closingBalanceMatch = extractedText.match(/Closing\s+Balance:\s*R\s*([\d,\s]+\.?\d*)/i);
      if (closingBalanceMatch && closingBalanceMatch[1]) {
        currentBalance = parseAmount(closingBalanceMatch[1]);
        console.log('[BALANCE] Found Capitec closing balance:', currentBalance);
      }
    }
    
    // Fallback to generic patterns if not found
    if (currentBalance === 0) {
      const balancePatterns = [
        /(?:Current|Closing|Available|Statement)\s+Balance[:\s]+R?\s*([\d,\s]+\.?\d*)/gi,
        /Balance[:\s]+R?\s*([\d,\s]+\.?\d*)/gi,
        /R\s*([\d,\s]+\.\d{2})\s+(?:CR|DR)?$/gm,
      ];
      
      for (let i = 0; i < balancePatterns.length; i++) {
        const pattern = balancePatterns[i];
        const matches = Array.from(extractedText.matchAll(pattern));
        console.log(`[BALANCE] Pattern ${i + 1} matches:`, matches.length);
        
        if (matches.length > 0) {
          // Get the last balance mentioned (most recent)
          const lastMatch = matches[matches.length - 1] as RegExpMatchArray;
          if (lastMatch[1]) {
            currentBalance = parseAmount(lastMatch[1]);
            console.log('[BALANCE] Found balance with pattern', i + 1, ':', currentBalance);
            break;
          }
        }
      }
    }
    
    if (currentBalance === 0) {
      console.warn('[BALANCE] WARNING: No balance found in PDF');
    }
    
    const accountType = detectAccountType(extractedText, fileName);
    console.log('[ACCOUNT-TYPE] Detected type:', accountType);
    
    // Extract transactions using improved patterns
    console.log('[TRANSACTIONS] Starting transaction extraction...');
    const transactions = extractTransactionsFromPDF(extractedText, bankName);
    console.log('[TRANSACTIONS] Extracted', transactions.length, 'transactions');
    
    if (transactions.length > 0) {
      console.log('[TRANSACTIONS] Sample transaction:', JSON.stringify(transactions[0], null, 2));
    } else {
      console.warn('[TRANSACTIONS] WARNING: No transactions found');
    }

    return {
      accountInfo: {
        accountNumber,
        bankName,
        accountType,
        accountName: `${bankName} ${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account`,
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
  } catch (error) {
    console.error('[PDF] Error during PDF parsing:', error);
    console.error('[PDF] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

async function extractTextWithClaude(pdfContent: string): Promise<string> {
  console.log('[CLAUDE] Starting Claude Vision extraction...');
  
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  
  if (!apiKey) {
    console.error('[CLAUDE] No ANTHROPIC_API_KEY found in environment variables');
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  
  try {
    console.log('[CLAUDE] Sending request to Anthropic API...');
    
    // Convert the decoded PDF content back to base64
    const base64Pdf = btoa(pdfContent);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Pdf,
                },
              },
              {
                type: 'text',
                text: `Extract ALL text content from this bank statement PDF. Focus on:
1. Bank name and account information
2. Account holder details
3. Statement period dates
4. Opening and closing balances
5. ALL transactions with their:
   - Date
   - Description/Narrative
   - Amount (Money In/Money Out)
   - Balance after transaction
   - Any fees or charges

Format the output as plain text, preserving the tabular structure of transactions where possible.
Include column headers if visible. Extract every single transaction visible in the statement.
Do not summarize - extract the complete raw text content.`,
              },
            ],
          },
        ],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CLAUDE] API request failed:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('[CLAUDE] API Response received');
    
    if (result.content && result.content.length > 0) {
      const extractedText = result.content
        .filter((block: { type: string }) => block.type === 'text')
        .map((block: { text: string }) => block.text)
        .join('\n');
      
      console.log('[CLAUDE] Extracted text length:', extractedText.length, 'characters');
      console.log('[CLAUDE] First 1000 chars:', extractedText.substring(0, 1000));
      
      return extractedText;
    }
    
    console.warn('[CLAUDE] No text content in response');
    return '';
  } catch (error) {
    console.error('[CLAUDE] Error during Claude extraction:', error);
    console.error('[CLAUDE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

function extractTransactionsFromPDF(content: string, bankName: string) {
  const transactions = [];
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
  
  // More flexible Capitec detection - check for any mention of Capitec
  if (contentUpper.includes('CAPITEC') || fileUpper.includes('CAPITEC')) {
    console.log('[DETECT-BANK] Matched: Capitec (flexible match)');
    return 'Capitec';
  }
  
  // FNB variations
  if (contentUpper.includes('FNB') || 
      contentUpper.includes('FIRST NATIONAL BANK') || 
      contentUpper.includes('FIRSTRAND') ||
      fileUpper.includes('FNB')) {
    console.log('[DETECT-BANK] Matched: FNB');
    return 'FNB';
  }
  
  // ABSA variations
  if (contentUpper.includes('ABSA') || 
      contentUpper.includes('AMALGAMATED BANKS') ||
      fileUpper.includes('ABSA')) {
    console.log('[DETECT-BANK] Matched: ABSA');
    return 'ABSA';
  }
  
  // Standard Bank variations
  if (contentUpper.includes('STANDARD BANK') || 
      contentUpper.includes('STANBIC') || 
      contentUpper.includes('STANDARD CHARTERED') ||
      fileUpper.includes('STANDARD')) {
    console.log('[DETECT-BANK] Matched: Standard Bank');
    return 'Standard Bank';
  }
  
  // Nedbank variations
  if (contentUpper.includes('NEDBANK') || 
      contentUpper.includes('NED BANK') ||
      fileUpper.includes('NEDBANK')) {
    console.log('[DETECT-BANK] Matched: Nedbank');
    return 'Nedbank';
  }
  
  // Discovery Bank variations
  if (contentUpper.includes('DISCOVERY BANK') || 
      contentUpper.includes('DISCOVERY') && (contentUpper.includes('BANK') || contentUpper.includes('ACCOUNT')) ||
      fileUpper.includes('DISCOVERY')) {
    console.log('[DETECT-BANK] Matched: Discovery Bank');
    return 'Discovery Bank';
  }
  
  // TymeBank variations
  if (contentUpper.includes('TYMEBANK') || 
      contentUpper.includes('TYME BANK') || 
      contentUpper.includes('TYME DIGITAL') ||
      fileUpper.includes('TYME')) {
    console.log('[DETECT-BANK] Matched: TymeBank');
    return 'TymeBank';
  }
  
  // Bank Zero variations
  if (contentUpper.includes('BANK ZERO') || 
      contentUpper.includes('BANKZERO') ||
      fileUpper.includes('BANKZERO')) {
    console.log('[DETECT-BANK] Matched: Bank Zero');
    return 'Bank Zero';
  }
  
  // Investec variations
  if (contentUpper.includes('INVESTEC') || fileUpper.includes('INVESTEC')) {
    console.log('[DETECT-BANK] Matched: Investec');
    return 'Investec';
  }

  console.log('[DETECT-BANK] No match found - returning Unknown Bank');
  console.log('[DETECT-BANK] Content sample (first 1000 chars):', content.substring(0, 1000));
  return 'Unknown Bank';
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
      /Account\s+(?:Number|No)[:\s]+(\d{10,16})/i,
      /Acc[:\s]+(\d{10,16})/i
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
