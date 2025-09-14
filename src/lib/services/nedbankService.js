// lib/nedbankService.js
import { supabase } from './supabase';

class NedbankService {
  constructor() {
    this.baseUrl = 'https://apim.nedbank.co.za';
  }

  // Generate OAuth URL for Nedbank
  generateOAuthUrl(userId, state) {
    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_NEDBANK_CLIENT_ID,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/nedbank/callback`,
      response_type: 'code',
      scope: 'accounts',
      itype: 'personal',
      state: `${userId}_${state}`
    });

    return `${this.baseUrl}/oauth/authorize?${params}`;
  }

  // Store user's Nedbank connection in Supabase
  async storeUserConnection(userId, tokens, intentId) {
    const { data, error } = await supabase
      .from('user_bank_connections')
      .upsert({
        user_id: userId,
        bank_name: 'nedbank',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        intent_id: intentId,
        connection_status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,bank_name'
      });

    if (error) throw error;
    return data;
  }

  // Get user's Nedbank connection from Supabase
  async getUserConnection(userId) {
    const { data, error } = await supabase
      .from('user_bank_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('bank_name', 'nedbank')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Store accounts in Supabase
  async storeAccounts(userId, accounts) {
    const accountsToStore = accounts.map(account => ({
      user_id: userId,
      bank_name: 'nedbank',
      account_id: account.accountId,
      account_type: account.accountType,
      account_name: account.displayName,
      currency: account.currency,
      status: account.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('user_accounts')
      .upsert(accountsToStore, {
        onConflict: 'user_id,account_id'
      });

    if (error) throw error;
    return data;
  }

  // Store transactions in Supabase
  async storeTransactions(userId, accountId, transactions) {
    const transactionsToStore = transactions.map(transaction => ({
      user_id: userId,
      account_id: accountId,
      transaction_id: transaction.transactionId,
      transaction_date: transaction.transactionDateTime,
      description: transaction.description,
      reference: transaction.reference,
      amount: parseFloat(transaction.amount),
      balance: parseFloat(transaction.balance),
      currency: transaction.currency,
      transaction_type: parseFloat(transaction.amount) >= 0 ? 'credit' : 'debit',
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('transactions')
      .upsert(transactionsToStore, {
        onConflict: 'transaction_id'
      });

    if (error) throw error;
    return data;
  }

  // Get transactions from Supabase
  async getStoredTransactions(userId, accountId, fromDate, toDate) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .gte('transaction_date', fromDate)
      .lte('transaction_date', toDate)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get user accounts from Supabase
  async getStoredAccounts(userId) {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('bank_name', 'nedbank');

    if (error) throw error;
    return data;
  }

  // Update connection status
  async updateConnectionStatus(userId, status) {
    const { data, error } = await supabase
      .from('user_bank_connections')
      .update({ 
        connection_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('bank_name', 'nedbank');

    if (error) throw error;
    return data;
  }

  // Check if token needs refresh
  async checkTokenExpiry(userId) {
    const connection = await this.getUserConnection(userId);
    if (!connection) return false;

    const expiryTime = new Date(connection.token_expires_at);
    const now = new Date();
    const timeUntilExpiry = expiryTime - now;

    // Return true if token expires within 5 minutes
    return timeUntilExpiry < 5 * 60 * 1000;
  }

  // Disconnect user
  async disconnectUser(userId) {
    const { error } = await supabase
      .from('user_bank_connections')
      .update({ 
        connection_status: 'disconnected',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('bank_name', 'nedbank');

    if (error) throw error;
  }
}

export default new NedbankService();