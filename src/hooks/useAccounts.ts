
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AccountType } from '@/lib/data';
import { useCallback } from 'react';

const ACCOUNTS_QUERY_KEY = ['accounts'];

async function fetchAccountsFromSupabase(): Promise<AccountType[]> {
  const { data: accountsData, error: accountsError } = await supabase
    .from('accounts')
    .select('*');

  if (accountsError) throw accountsError;

  return (accountsData || []).map((account, index) => {
    const last4Digits = account.account_number?.slice(-4) || '0000';
    const bankName = account.bank_name || 'Account';
    const formattedName = `${bankName} ${last4Digits}`;

    return {
      id: account.id,
      name: formattedName,
      type: (account.account_type?.toLowerCase() as 'checking' | 'savings' | 'credit') || 'checking',
      balance: (account.available_balance || 0) / 100,
      currency: 'ZAR',
      color: getAccountColor(index),
    };
  });
}

export const useAccounts = () => {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ACCOUNTS_QUERY_KEY,
    queryFn: fetchAccountsFromSupabase,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEY });
  }, [queryClient]);

  const error = queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  return { accounts, loading, error, refetch };
};

// Helper function to assign colors consistently
const getAccountColor = (index: number): string => {
  const colors = ['#1e65ff', '#41b883', '#ff6b6b', '#8959a8', '#ffd166'];
  return colors[index % colors.length];
};
