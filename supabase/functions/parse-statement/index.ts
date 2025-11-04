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
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Find column indices
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const descIdx = headers.findIndex(h => h.includes('description') || h.includes('detail'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('value'));
  const balanceIdx = headers.findIndex(h => h.includes('balance'));
  
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
    if (i <= 3 && !accountNumber) {
      const accMatch = lines[i].match(/\b\d{10,16}\b/);
      if (accMatch) {
        accountNumber = accMatch[0];
      }
    }

    if (values.length > Math.max(dateIdx, descIdx, amountIdx)) {
      const amount = parseAmount(values[amountIdx]);
      const balance = balanceIdx !== -1 ? parseAmount(values[balanceIdx]) : 0;
      
      if (balance > 0) {
        currentBalance = balance;
      }

      transactions.push({
        date: values[dateIdx],
        description: values[descIdx],
        amount: amount,
        balance: balance,
        reference: values[descIdx].substring(0, 50),
      });
    }
  }

  // If no account number found, generate from filename
  if (!accountNumber) {
    accountNumber = fileName.replace(/\D/g, '').substring(0, 10) || '0000000000';
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
  // For PDF, we'll do basic text extraction
  // In a real implementation, you'd use a proper PDF parser
  
  const bankName = detectBank(fileName, content);
  
  // Extract account number (looking for patterns like 62XXXXXXXX or similar)
  const accountMatch = content.match(/\b\d{10,16}\b/);
  const accountNumber = accountMatch ? accountMatch[0] : '0000000000';
  
  // Extract balance (looking for patterns like "Balance: R 1,234.56")
  const balanceMatch = content.match(/(?:balance|current balance).*?R?\s*([\d,]+\.?\d*)/i);
  const currentBalance = balanceMatch ? parseAmount(balanceMatch[1]) : 0;
  
  const accountType = detectAccountType(content, fileName);

  // For now, return minimal data
  // In production, you'd parse actual transactions from the PDF
  return {
    accountInfo: {
      accountNumber,
      bankName,
      accountType,
      accountName: `${bankName} Account`,
      currentBalance,
      currency: 'ZAR',
    },
    transactions: [],
    summary: {
      totalTransactions: 0,
      dateRange: null,
    },
  };
}

function detectBank(fileName: string, content: string): string {
  const lowerFileName = fileName.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  const banks = [
    { name: 'FNB', keywords: ['fnb', 'first national'] },
    { name: 'ABSA', keywords: ['absa'] },
    { name: 'Standard Bank', keywords: ['standard bank', 'stanbic'] },
    { name: 'Nedbank', keywords: ['nedbank'] },
    { name: 'Capitec', keywords: ['capitec'] },
    { name: 'Discovery Bank', keywords: ['discovery'] },
    { name: 'TymeBank', keywords: ['tymebank', 'tyme'] },
    { name: 'Bank Zero', keywords: ['bank zero'] },
    { name: 'Investec', keywords: ['investec'] },
  ];

  for (const bank of banks) {
    for (const keyword of bank.keywords) {
      if (lowerFileName.includes(keyword) || lowerContent.includes(keyword)) {
        return bank.name;
      }
    }
  }

  return 'Unknown Bank';
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
