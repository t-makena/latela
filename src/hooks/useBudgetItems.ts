import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BudgetItem {
  id: string;
  user_id: string;
  name: string;
  frequency: string;
  amount: number;
  days_per_week: number | null;
  created_at: string;
  updated_at: string;
}

export const useBudgetItems = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgetItems = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setBudgetItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgetItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching budget items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetItems();
  }, []);

  const calculateMonthlyAmount = (item: BudgetItem): number => {
    const amount = Number(item.amount);
    
    switch (item.frequency) {
      case 'Monthly':
        return amount;
      case 'Weekly':
        return amount * 4;
      case 'Bi-weekly':
        return amount * 2;
      case 'Daily':
        return amount * 4;
      case 'Once-off':
        return amount;
      default:
        return amount;
    }
  };

  const calculateTotalMonthly = (): number => {
    return budgetItems.reduce((total, item) => {
      return total + calculateMonthlyAmount(item);
    }, 0);
  };

  const addBudgetItem = async (
    name: string,
    frequency: string,
    amount: number,
    daysPerWeek?: number
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('budget_items')
        .insert({
          user_id: user.id,
          name,
          frequency,
          amount,
          days_per_week: daysPerWeek || null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Budget item added successfully',
      });

      await fetchBudgetItems();
    } catch (err) {
      console.error('Error adding budget item:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add budget item',
        variant: 'destructive',
      });
    }
  };

  const deleteBudgetItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Budget item deleted successfully',
      });

      await fetchBudgetItems();
    } catch (err) {
      console.error('Error deleting budget item:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete budget item',
        variant: 'destructive',
      });
    }
  };

  return {
    budgetItems,
    loading,
    error,
    calculateMonthlyAmount,
    calculateTotalMonthly,
    addBudgetItem,
    deleteBudgetItem,
    refetch: fetchBudgetItems,
  };
};
