// src/app/api/categorize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { categorizeTransaction, categorizeBulkTransactions, TransactionData } from '../../../lib/services/claudeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    // Handle single transaction
    if (body.description && body.amount !== undefined) {
      const transaction: TransactionData = {
        description: body.description,
        amount: parseFloat(body.amount),
        merchant: body.merchant,
        date: body.date
      };

      const result = await categorizeTransaction(transaction);
      
      return NextResponse.json({
        success: true,
        transaction,
        categorization: result,
        processingTime: Date.now()
      });
    }

    // Handle bulk transactions
    if (Array.isArray(body.transactions)) {
      const transactions: TransactionData[] = body.transactions.map((tx: any) => ({
        description: tx.description,
        amount: parseFloat(tx.amount),
        merchant: tx.merchant,
        date: tx.date
      }));

      const results = await categorizeBulkTransactions(transactions);
      
      return NextResponse.json({
        success: true,
        count: transactions.length,
        categorizations: results,
        processingTime: Date.now()
      });
    }

    return NextResponse.json(
      { error: 'Invalid request format. Provide either a single transaction or an array of transactions.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Categorization API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Transaction categorization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}