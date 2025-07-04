
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  acc_no: number;
  created_at: string;
  source: string;
  value: number;
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
