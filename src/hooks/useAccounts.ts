
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
        const { data, error } = await supabase
          .from('accounts')
          .select('*');

        if (error) {
          throw error;
        }

        // Transform Supabase data to match our AccountType interface
        const transformedAccounts: AccountType[] = data.map((account, index) => {
          // Format account name as "Bank Name ****1234"
          const last4Digits = account.account_number?.slice(-4) || '0000';
          const bankName = account.bank_name || 'Account';
          const formattedName = `${bankName} ****${last4Digits}`;
          
          return {
            id: account.id,
            name: formattedName,
            type: (account.account_type?.toLowerCase() as 'checking' | 'savings' | 'credit') || 'checking',
            balance: account.balance || 0,
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
