import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileName, fileType } = await req.json();

    if (!fileContent || !fileName) {
      throw new Error('Missing required fields');
    }

    // Decode base64 content
    const decodedContent = atob(fileContent);

    let parsedData;

    if (fileType === 'text/csv') {
      parsedData = parseCSV(decodedContent, fileName);
    } else if (fileType === 'application/pdf') {
      parsedData = parsePDF(decodedContent, fileName);
    } else {
      throw new Error('Unsupported file type');
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...parsedData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Parse error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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

function parsePDF(content: string, fileName: string) {
  // For PDF, we'll do text extraction and pattern matching
  
  const bankName = detectBank(fileName, content);
  
  // Extract account number using improved function
  const accountNumber = extractAccountNumber(content, bankName);
  
  // Extract balance with specific patterns for different banks
  let currentBalance = 0;
  
  // Capitec-specific balance extraction
  if (bankName === 'Capitec') {
    const closingBalanceMatch = content.match(/Closing\s+Balance:\s*R\s*([\d,\s]+\.?\d*)/i);
    if (closingBalanceMatch && closingBalanceMatch[1]) {
      currentBalance = parseAmount(closingBalanceMatch[1]);
    }
  }
  
  // Fallback to generic patterns if not found
  if (currentBalance === 0) {
    const balancePatterns = [
      /(?:Current|Closing|Available|Statement)\s+Balance[:\s]+R?\s*([\d,\s]+\.?\d*)/gi,
      /Balance[:\s]+R?\s*([\d,\s]+\.?\d*)/gi,
      /R\s*([\d,\s]+\.\d{2})\s+(?:CR|DR)?$/gm,
    ];
    
    for (const pattern of balancePatterns) {
      const matches = Array.from(content.matchAll(pattern));
      if (matches.length > 0) {
        // Get the last balance mentioned (most recent)
        const lastMatch = matches[matches.length - 1];
        if (lastMatch[1]) {
          currentBalance = parseAmount(lastMatch[1]);
          break;
        }
      }
    }
  }
  
  const accountType = detectAccountType(content, fileName);
  
  // Extract transactions using improved patterns
  const transactions = extractTransactionsFromPDF(content, bankName);

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
}

function extractTransactionsFromPDF(content: string, bankName: string) {
  const transactions = [];
  
  // Capitec-specific parsing using table structure
  if (bankName === 'Capitec') {
    // Match Capitec transaction rows: Date | Description | Category | Money In | Money Out | Fee* | Balance
    // Pattern to match: DD/MM/YYYY followed by text, then amounts
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Match Capitec date format (DD/MM/YYYY)
      const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+)/);
      if (!dateMatch) continue;
      
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
  } else {
    // Generic parsing for other banks
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{4}\/\d{1,2}\/\d{1,2})/,
      /(\d{1,2}-\d{1,2}-\d{4})/,
      /(\d{4}-\d{1,2}-\d{1,2})/,
      /(\d{2}\s+[A-Za-z]{3}\s+\d{4})/,
    ];
    
    const amountPattern = /R?\s*([\d,\s]+\.\d{2})/;
    
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
  }
  
  return transactions;
}

function detectBank(fileName: string, content: string): string {
  const contentUpper = content.toUpperCase();
  const fileUpper = fileName.toUpperCase();
  
  // Check Capitec first with more specific patterns
  if (contentUpper.includes('CAPITEC BANK') || 
      contentUpper.includes('CAPITEC') && contentUpper.includes('ACCOUNT STATEMENT') ||
      fileUpper.includes('CAPITEC')) {
    return 'Capitec';
  }
  if (contentUpper.includes('FNB') || contentUpper.includes('FIRST NATIONAL BANK') || fileUpper.includes('FNB')) {
    return 'FNB';
  }
  if (contentUpper.includes('ABSA') || fileUpper.includes('ABSA')) {
    return 'ABSA';
  }
  if (contentUpper.includes('STANDARD BANK') || contentUpper.includes('STANBIC') || fileUpper.includes('STANDARD')) {
    return 'Standard Bank';
  }
  if (contentUpper.includes('NEDBANK') || fileUpper.includes('NEDBANK')) {
    return 'Nedbank';
  }
  if (contentUpper.includes('DISCOVERY BANK') || contentUpper.includes('DISCOVERY') || fileUpper.includes('DISCOVERY')) {
    return 'Discovery Bank';
  }
  if (contentUpper.includes('TYMEBANK') || contentUpper.includes('TYME BANK') || fileUpper.includes('TYME')) {
    return 'TymeBank';
  }
  if (contentUpper.includes('BANK ZERO') || fileUpper.includes('BANKZERO')) {
    return 'Bank Zero';
  }
  if (contentUpper.includes('INVESTEC') || fileUpper.includes('INVESTEC')) {
    return 'Investec';
  }

  return 'Unknown Bank';
}

function extractAccountNumber(content: string, bankName: string): string {
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
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const fullNumber = match[1].replace(/[\s-]/g, '');
      // For Capitec, return only last 4 digits
      if (bankName === 'Capitec' && fullNumber.length >= 4) {
        return fullNumber.slice(-4);
      }
      return fullNumber;
    }
  }

  // Generic fallback patterns
  const genericPatterns = [
    /Account\s*(?:Number|No|#)?[:\s]+(\d{10,16})/i,
    /Acc(?:ount)?[:\s]+(\d{10,16})/i,
    /A\/C[:\s]+(\d{10,16})/i,
    /(\d{10,16})\s*(?:Cheque|Current|Savings)/i,
    /\b(\d{10,16})\b/
  ];

  for (const pattern of genericPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const fullNumber = match[1].replace(/[\s-]/g, '');
      // For Capitec, return only last 4 digits
      if (bankName === 'Capitec' && fullNumber.length >= 4) {
        return fullNumber.slice(-4);
      }
      return fullNumber;
    }
  }

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
