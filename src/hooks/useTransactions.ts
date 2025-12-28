import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface Transaction {
  id: string;
  account_id: string | null;
  amount: number;
  balance: number | null;
  description: string | null;
  transaction_date: string;
  type: string;
  transaction_code: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Category details from view
  parent_category_name: string | null;
  parent_category_color: string | null;
  subcategory_name: string | null;
  subcategory_color: string | null;
  display_subcategory_name: string | null;
  display_subcategory_color: string | null;
  merchant_name: string | null;
}

interface UseTransactionsOptions {
  currentMonthOnly?: boolean;
  limit?: number;
}

export const useTransactions = (options: UseTransactionsOptions = {}) => {
  const { currentMonthOnly = true, limit = 500 } = options;

  const { data: transactions = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['transactions', currentMonthOnly, limit],
    queryFn: async () => {
      let query = supabase
        .from('v_transactions_with_details')
        .select('*')
        .order('transaction_date', { ascending: false });

      // Apply current month filter for Budget page optimization
      if (currentMonthOnly) {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        
        query = query
          .gte('transaction_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('transaction_date', format(monthEnd, 'yyyy-MM-dd'));
      }

      // Apply limit
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;

      // Transform Supabase data to match our Transaction interface
      // Convert amounts from Rands to cents for consistent handling with formatCurrency
      return (data || []).map(transaction => ({
        ...transaction,
        amount: (transaction.amount ?? 0) * 100,
        balance: transaction.balance != null ? transaction.balance * 100 : null,
        type: (transaction.amount ?? 0) < 0 ? 'expense' : 'income'
      })) as Transaction[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
  });

  const error = queryError instanceof Error ? queryError.message : queryError ? 'An error occurred' : null;

  return { transactions, loading, error };
};
