import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  BudgetCategory, 
  PARENT_TO_BUDGET_CATEGORY, 
  CategoryLimits,
  calculateCategoryLimits as calcLimits 
} from '@/lib/categoryMapping';

export type BudgetMethod = 'zero_based' | 'percentage_based';

interface BudgetMethodSettings {
  budget_method: BudgetMethod;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
}

export interface BudgetItem {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  days_per_week?: number;
  parent_category_id?: string;
}

export interface CategoryAllocation {
  limit: number;
  allocated: number;
  remaining: number;
  percentage: number;
}

export type CategoryAllocations = Record<BudgetCategory, CategoryAllocation>;

export const useBudgetMethod = () => {
  const [settings, setSettings] = useState<BudgetMethodSettings>({
    budget_method: 'percentage_based',
    needs_percentage: 50,
    wants_percentage: 30,
    savings_percentage: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('budget_method, needs_percentage, wants_percentage, savings_percentage')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          budget_method: (data.budget_method as BudgetMethod) || 'percentage_based',
          needs_percentage: data.needs_percentage ?? 50,
          wants_percentage: data.wants_percentage ?? 30,
          savings_percentage: data.savings_percentage ?? 20,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching budget method settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateBudgetMethod = async (method: BudgetMethod) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .update({ budget_method: method })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, budget_method: method }));
      return true;
    } catch (err) {
      console.error('Error updating budget method:', err);
      throw err;
    }
  };

  const updatePercentages = async (needs: number, wants: number, savings: number) => {
    // Validate that percentages sum to 100
    if (needs + wants + savings !== 100) {
      throw new Error('Percentages must sum to 100');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .update({
          needs_percentage: needs,
          wants_percentage: wants,
          savings_percentage: savings,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        needs_percentage: needs,
        wants_percentage: wants,
        savings_percentage: savings,
      }));
      return true;
    } catch (err) {
      console.error('Error updating percentages:', err);
      throw err;
    }
  };

  // Calculate the limit for each category based on available balance
  const calculateCategoryLimits = useCallback((availableBalance: number): CategoryLimits => {
    return calcLimits(
      availableBalance,
      settings.needs_percentage,
      settings.wants_percentage,
      settings.savings_percentage
    );
  }, [settings.needs_percentage, settings.wants_percentage, settings.savings_percentage]);

  // Calculate current allocations for each category based on budget items
  const calculateCategoryAllocations = useCallback((
    availableBalance: number,
    budgetItems: BudgetItem[],
    calculateMonthlyAmount: (item: BudgetItem) => number
  ): CategoryAllocations => {
    const limits = calculateCategoryLimits(availableBalance);
    
    // Initialize allocations
    const allocations: CategoryAllocations = {
      needs: { limit: limits.needs, allocated: 0, remaining: limits.needs, percentage: settings.needs_percentage },
      wants: { limit: limits.wants, allocated: 0, remaining: limits.wants, percentage: settings.wants_percentage },
      savings: { limit: limits.savings, allocated: 0, remaining: limits.savings, percentage: settings.savings_percentage },
      income: { limit: 0, allocated: 0, remaining: 0, percentage: 0 },
    };

    // Sum up allocations by category
    budgetItems.forEach(item => {
      if (item.parent_category_id) {
        const budgetCategory = PARENT_TO_BUDGET_CATEGORY[item.parent_category_id];
        if (budgetCategory && budgetCategory !== 'income') {
          const monthlyAmount = calculateMonthlyAmount(item);
          allocations[budgetCategory].allocated += monthlyAmount;
          allocations[budgetCategory].remaining = 
            allocations[budgetCategory].limit - allocations[budgetCategory].allocated;
        }
      }
    });

    return allocations;
  }, [calculateCategoryLimits, settings]);

  // Check if adding an amount would exceed the category limit
  const wouldExceedLimit = useCallback((
    budgetCategory: BudgetCategory,
    amount: number,
    allocations: CategoryAllocations
  ): { exceeds: boolean; excessAmount: number } => {
    if (budgetCategory === 'income') {
      return { exceeds: false, excessAmount: 0 };
    }
    
    const allocation = allocations[budgetCategory];
    const newTotal = allocation.allocated + amount;
    const exceeds = newTotal > allocation.limit;
    const excessAmount = exceeds ? newTotal - allocation.limit : 0;
    
    return { exceeds, excessAmount };
  }, []);

  return {
    budgetMethod: settings.budget_method,
    needsPercentage: settings.needs_percentage,
    wantsPercentage: settings.wants_percentage,
    savingsPercentage: settings.savings_percentage,
    loading,
    error,
    updateBudgetMethod,
    updatePercentages,
    calculateCategoryLimits,
    calculateCategoryAllocations,
    wouldExceedLimit,
    refetch: fetchSettings,
  };
};
