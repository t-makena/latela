// src/lib/services/absaToSupabaseService.ts
import { createClient } from '@supabase/supabase-js';

export interface ABSAAccount {
  number: string;
  availBalance: number;
  balance: number;
  balanceBroughtForward: number;
  powerOfAttorney: boolean;
  limit: number;
  unclearedEffectsEnabled: boolean;
  uncleared: number;
  type: string;
  status: string;
  transactions?: ABSATransaction[];
}

export interface ABSATransaction {
  date: string;
  reference: string;
  amount: number;
  balance: number;
  description: string;
  transactionCode: string;
  cleared: boolean;
}

export interface ABSAAccountHolder {
  name: string;
  passportNumber?: string;
  idNumber?: string;
  initials: string;
  profileId: string;
  accounts: ABSAAccount[];
}

export interface ABSAResponse {
  id: string;
  accountHolders: ABSAAccountHolder[];
}

// Create Supabase client with safe URL handling
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/['"]/g, '').replace(/\/$/, '') || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/['"]/g, '') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found in environment variables');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

class ABSAToSupabaseService {
  private accessToken: string;
  private baseUrl: string;
  private supabase: any;

  constructor() {
    this.accessToken = process.env.ABSA_ACCESS_TOKEN?.replace(/['"]/g, '') || '';
    this.baseUrl = process.env.ABSA_BASE_URL?.replace(/['"]/g, '').replace(/\/$/, '') || 'https://www.api.absa.africa:9443';
    this.supabase = createSupabaseClient();

    if (!this.accessToken) {
      console.warn('ABSA_ACCESS_TOKEN not found in environment variables');
    }
    
    if (!this.supabase) {
      console.warn('Supabase client could not be initialized');
    }
  }

  private getHeaders() {
    if (!this.accessToken) {
      throw new Error('ABSA_ACCESS_TOKEN not configured. Please add ABSA_ACCESS_TOKEN to your environment variables.');
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  // Fetch data from ABSA API
  async fetchABSAData(): Promise<ABSAResponse> {
    const response = await fetch(`${this.baseUrl}/absa/retail/api/v1/accountholders`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ABSA API failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  // Filter data for Nkosi only
  filterNkosiData(absaData: ABSAResponse): ABSAAccountHolder | null {
    const nkosi = absaData.accountHolders.find(holder => 
      holder.name.toLowerCase().includes('nkosi')
    );
    return nkosi || null;
  }

  // Convert date format
  private convertDateFormat(dateStr: string): string {
    return dateStr.replace('h', ':') + ':00';
  }

  // Insert account holder into Supabase
  async insertAccountHolder(holder: ABSAAccountHolder): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }

    const { data, error } = await this.supabase
      .from('account_holders')
      .upsert({
        email: `${holder.name.toLowerCase()}@absa.latela.com`,
        name: holder.name,
        passport_number: holder.passportNumber,
        id_number: holder.idNumber,
        initials: holder.initials,
        profile_id: holder.profileId
      }, {
        onConflict: 'email'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to insert account holder: ${error.message}`);
    return data.id;
  }

  // Insert accounts into Supabase
  async insertAccounts(holderId: string, accounts: ABSAAccount[]): Promise<{ [accountNumber: string]: string }> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }

    const accountIds: { [accountNumber: string]: string } = {};

    for (const account of accounts) {
      const { data, error } = await this.supabase
        .from('accounts')
        .upsert({
          account_holder_id: holderId,
          account_number: account.number,
          account_type: account.type,
          status: account.status,
          available_balance: account.availBalance,
          balance: account.balance,
          balance_brought_forward: account.balanceBroughtForward,
          account_limit: account.limit,
          power_of_attorney: account.powerOfAttorney,
          uncleared_effects_enabled: account.unclearedEffectsEnabled,
          uncleared: account.uncleared
        }, {
          onConflict: 'account_number'
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to insert account ${account.number}: ${error.message}`);
      accountIds[account.number] = data.id;
    }

    return accountIds;
  }

  // Insert transactions into Supabase
  async insertTransactions(accountIds: { [accountNumber: string]: string }, accounts: ABSAAccount[]): Promise<number> {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Check your environment variables.');
    }

    let totalTransactions = 0;

    for (const account of accounts) {
      if (!account.transactions || account.transactions.length === 0) continue;

      const accountId = accountIds[account.number];
      if (!accountId) continue;

      // Clear existing transactions for this account
      await this.supabase
        .from('transactions')
        .delete()
        .eq('account_id', accountId);

      // Insert new transactions
      const transactionsToInsert = account.transactions.map(transaction => ({
        account_id: accountId,
        transaction_date: this.convertDateFormat(transaction.date),
        reference: transaction.reference,
        amount: transaction.amount,
        balance: transaction.balance,
        description: transaction.description,
        transaction_code: transaction.transactionCode,
        cleared: transaction.cleared
      }));

      const { error } = await this.supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) throw new Error(`Failed to insert transactions for account ${account.number}: ${error.message}`);
      totalTransactions += transactionsToInsert.length;
    }

    return totalTransactions;
  }

  // Complete sync process for Nkosi
  async syncNkosiToSupabase(): Promise<{
    success: boolean;
    message: string;
    stats: {
      accountHolders: number;
      accounts: number;
      transactions: number;
    };
    data?: any;
    error?: string;
  }> {
    try {
      // Check if services are available
      if (!this.supabase) {
        throw new Error('Supabase client not initialized. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      }

      if (!this.accessToken) {
        throw new Error('ABSA access token not configured. Check ABSA_ACCESS_TOKEN');
      }

      // 1. Fetch data from ABSA
      console.log('🔄 Fetching data from ABSA API...');
      const absaData = await this.fetchABSAData();

      // 2. Filter for Nkosi only
      console.log('🔍 Filtering for Nkosi data...');
      const nkosiData = this.filterNkosiData(absaData);
      
      if (!nkosiData) {
        throw new Error('Nkosi account holder not found in ABSA data');
      }

      // 3. Insert account holder
      console.log('👤 Inserting account holder...');
      const holderId = await this.insertAccountHolder(nkosiData);

      // 4. Insert accounts
      console.log('🏦 Inserting accounts...');
      const accountIds = await this.insertAccounts(holderId, nkosiData.accounts);

      // 5. Insert transactions
      console.log('💳 Inserting transactions...');
      const transactionCount = await this.insertTransactions(accountIds, nkosiData.accounts);

      const stats = {
        accountHolders: 1,
        accounts: nkosiData.accounts.length,
        transactions: transactionCount
      };

      console.log('✅ Sync completed successfully!');
      console.log(`📊 Stats: ${stats.accounts} accounts, ${stats.transactions} transactions`);

      return {
        success: true,
        message: `Successfully synced Nkosi's data from ABSA to Supabase`,
        stats,
        data: {
          accountHolder: nkosiData.name,
          accounts: nkosiData.accounts.map(acc => ({
            number: acc.number,
            type: acc.type,
            balance: acc.balance,
            transactionCount: acc.transactions?.length || 0
          }))
        }
      };

    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        message: 'Failed to sync Nkosi data from ABSA to Supabase',
        stats: { accountHolders: 0, accounts: 0, transactions: 0 },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Test connection only
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!this.accessToken) {
        throw new Error('ABSA_ACCESS_TOKEN not configured');
      }

      const data = await this.fetchABSAData();
      const nkosi = this.filterNkosiData(data);
      
      return {
        success: true,
        message: 'ABSA API connection successful',
        data: {
          totalAccountHolders: data.accountHolders.length,
          nkosiFound: !!nkosi,
          nkosiAccounts: nkosi?.accounts.length || 0,
          nkosiTransactions: nkosi?.accounts.reduce((sum, acc) => sum + (acc.transactions?.length || 0), 0) || 0,
          supabaseConfigured: !!this.supabase
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export service instance
export const absaToSupabaseService = new ABSAToSupabaseService();