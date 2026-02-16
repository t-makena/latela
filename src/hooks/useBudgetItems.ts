import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface BudgetItem {
  id: string;
  user_id: string;
  name: string;
  frequency: string;
  amount: number;
  days_per_week: number | null;
  parent_category_id?: string | null;
  created_at: string;
  updated_at: string;
}

export const useBudgetItems = () => {
  const queryClient = useQueryClient();

  const { data: budgetItems = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['budget-items'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];

      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const error = queryError instanceof Error ? queryError.message : queryError ? 'An error occurred' : null;

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

  const addMutation = useMutation({
    mutationFn: async ({
      name,
      frequency,
      amount,
      daysPerWeek,
      parentCategoryId
    }: {
      name: string;
      frequency: string;
      amount: number;
      daysPerWeek?: number;
      parentCategoryId?: string;
    }) => {
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
          parent_category_id: parentCategoryId || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items'] });
      toast({
        title: 'Success',
        description: 'Budget item added successfully',
      });
    },
    onError: (err) => {
      console.error('Error adding budget item:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add budget item',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items'] });
      toast({
        title: 'Success',
        description: 'Budget item deleted successfully',
      });
    },
    onError: (err) => {
      console.error('Error deleting budget item:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete budget item',
        variant: 'destructive',
      });
    },
  });

  const addBudgetItem = async (
    name: string,
    frequency: string,
    amount: number,
    daysPerWeek?: number,
    parentCategoryId?: string
  ) => {
    await addMutation.mutateAsync({ name, frequency, amount, daysPerWeek, parentCategoryId });
  };

  const deleteBudgetItem = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    budgetItems,
    loading,
    error,
    calculateMonthlyAmount,
    calculateTotalMonthly,
    addBudgetItem,
    deleteBudgetItem,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['budget-items'] }),
  };
};
