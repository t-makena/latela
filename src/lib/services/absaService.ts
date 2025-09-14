// src/lib/services/absaService.ts
import { supabase } from './supabase';

export interface TransactionHistoryRequest {
  accountNumber: string;
  purposeCode: '0001';
  documentFormat: 'PDF' | 'JSON' | 'JSON_PDF' | '';
  fromDate: string;
  toDate: string;
  requestingOrgName: string;
  requestingOrgId: string;
}

export interface TransactionHistoryResponse {
  requestId: string;
  transactionId: string;
  resultCode: number;
  resultMessage?: string;
  resultDescription?: string;
}

export interface TransactionLine {
  transactionDate: string;
  lineNumber: number;
  transactionAmount: string;
  transactionDescription: string;
  transactionFee: string;
  transactionCategory: number;
  balanceAmount: string;
}

export class ABSAService {
  private static instance: ABSAService;
  
  public static getInstance(): ABSAService {
    if (!ABSAService.instance) {
      ABSAService.instance = new ABSAService();
    }
    return ABSAService.instance;
  }

  async requestTransactionHistory(request: TransactionHistoryRequest): Promise<TransactionHistoryResponse> {
    try {
      const response = await fetch('/api/absa/transaction-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error requesting transaction history:', error);
      throw error;
    }
  }

  async getTransactionRequest(requestId: string) {
    try {
      const { data, error } = await supabase
        .from('transaction_requests')
        .select('*')
        .eq('request_id', requestId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transaction request:', error);
      throw error;
    }
  }

  async getTransactionHistory(requestId: string) {
    try {
      const { data, error } = await supabase
        .from('transaction_history')
        .select('*')
        .eq('request_id', requestId)
        .order('line_number', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  async getUserTransactionRequests(userId: string) {
    try {
      const { data, error } = await supabase
        .from('transaction_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user transaction requests:', error);
      throw error;
    }
  }

  getResultCodeMessage(resultCode: number): string {
    const messages: { [key: number]: string } = {
      100: 'Service under heavy load, please try again',
      101: 'Validation Errors',
      102: 'Account number not registered with Absa',
      103: 'Not a digital customer',
      104: 'Cannot proceed - duplicate requestId',
      106: 'Request failed',
      108: 'Consent Failed',
      109: 'Consent Rejected',
      110: 'No data available',
      115: 'Service Unavailable',
      200: 'Success',
      999: 'Technical error'
    };

    return messages[resultCode] || 'Unknown error';
  }
}

export const absaService = ABSAService.getInstance();