
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
        const transformedAccounts: AccountType[] = data.map((account, index) => ({
          id: account.Acc_no.toString(),
          name: `${account.Bank} ${account.Acc_type || 'Account'}`,
          type: (account.Acc_type?.toLowerCase() as 'checking' | 'savings' | 'credit') || 'checking',
          balance: 0, // You may want to calculate this from transactions
          currency: 'ZAR',
          color: getAccountColor(index),
        }));

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
