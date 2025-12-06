import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        // Use the detailed view to get category names
        const { data, error } = await supabase
          .from('v_transactions_with_details')
          .select('*')
          .order('transaction_date', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform Supabase data to match our Transaction interface
        const transformedTransactions: Transaction[] = (data || []).map(transaction => ({
          ...transaction,
          type: (transaction.amount ?? 0) < 0 ? 'expense' : 'income'
        }));
        
        setTransactions(transformedTransactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return { transactions, loading, error };
};
