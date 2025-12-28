
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AccountType } from '@/lib/data';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        
        // Fetch all accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from('accounts')
          .select('*');

        if (accountsError) throw accountsError;

        // For each account, get the latest transaction balance
        const accountsWithBalances = await Promise.all(
          (accountsData || []).map(async (account) => {
            // Get the latest transaction for this account (by date, then by created_at)
            const { data: latestTransaction } = await supabase
              .from('transactions')
              .select('balance')
              .eq('account_id', account.id)
              .order('transaction_date', { ascending: false })
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              ...account,
              // Balance is already stored in cents from StatementUploadDialog
              calculatedBalance: latestTransaction?.balance 
                ? latestTransaction.balance  
                : (account.available_balance || 0)
            };
          })
        );

        // Transform Supabase data to match our AccountType interface
        const transformedAccounts: AccountType[] = accountsWithBalances.map((account, index) => {
          // Format account name as "Bank Name ****1234"
          const last4Digits = account.account_number?.slice(-4) || '0000';
          const bankName = account.bank_name || 'Account';
          const formattedName = `${bankName} ${last4Digits}`;
          
          return {
            id: account.id,
            name: formattedName,
            type: (account.account_type?.toLowerCase() as 'checking' | 'savings' | 'credit') || 'checking',
            balance: account.calculatedBalance, // Already in Rands from transaction
            currency: 'ZAR',
            color: getAccountColor(index),
          };
        });

        setAccounts(transformedAccounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching accounts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  return { accounts, loading, error };
};

// Helper function to assign colors consistently
const getAccountColor = (index: number): string => {
  const colors = ['#1e65ff', '#41b883', '#ff6b6b', '#8959a8', '#ffd166'];
  return colors[index % colors.length];
};
