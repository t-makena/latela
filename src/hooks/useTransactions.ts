
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  description: string;
  transaction_date: string;
  type: string;
  status?: string;
  category_id?: string;
  user_id?: string;
  created_at: string;
  updated_at?: string;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setTransactions(data || []);
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
