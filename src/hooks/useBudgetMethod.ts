import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BudgetCategory,
  SUBCATEGORY_NAME_TO_BUDGET_CATEGORY,
  CategoryLimits,
  calculateCategoryLimits as calcLimits
} from '@/lib/categoryMapping';
import type { Transaction } from '@/hooks/useTransactions';

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

const BUDGET_METHOD_QUERY_KEY = ['user-settings', 'budget-method'];

const DEFAULT_SETTINGS: BudgetMethodSettings = {
  budget_method: 'percentage_based',
  needs_percentage: 50,
  wants_percentage: 30,
  savings_percentage: 20,
};

async function fetchBudgetMethodSettings(): Promise<BudgetMethodSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_SETTINGS;

  const { data, error } = await supabase
    .from('user_settings')
    .select('budget_method, needs_percentage, wants_percentage, savings_percentage')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return {
      budget_method: (data.budget_method as BudgetMethod) || 'percentage_based',
      needs_percentage: data.needs_percentage ?? 50,
      wants_percentage: data.wants_percentage ?? 30,
      savings_percentage: data.savings_percentage ?? 20,
    };
  }

  return DEFAULT_SETTINGS;
}

export const useBudgetMethod = () => {
  const queryClient = useQueryClient();

  const { data: settings = DEFAULT_SETTINGS, isLoading: loading, error: queryError } = useQuery({
    queryKey: BUDGET_METHOD_QUERY_KEY,
    queryFn: fetchBudgetMethodSettings,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const error = queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: BUDGET_METHOD_QUERY_KEY });
  }, [queryClient]);

  const updateBudgetMethod = async (method: BudgetMethod) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_settings')
      .update({ budget_method: method })
      .eq('user_id', user.id);

    if (error) throw error;

    queryClient.setQueryData(BUDGET_METHOD_QUERY_KEY, (old: BudgetMethodSettings) => ({
      ...old,
      budget_method: method,
    }));
  };

  const updatePercentages = async (needs: number, wants: number, savings: number) => {
    if (needs + wants + savings !== 100) {
      throw new Error('Percentages must sum to 100');
    }

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

    queryClient.setQueryData(BUDGET_METHOD_QUERY_KEY, (old: BudgetMethodSettings) => ({
      ...old,
      needs_percentage: needs,
      wants_percentage: wants,
      savings_percentage: savings,
    }));
  };

  const calculateCategoryLimits = useCallback((availableBalance: number): CategoryLimits => {
    return calcLimits(
      availableBalance,
      settings.needs_percentage,
      settings.wants_percentage,
      settings.savings_percentage
    );
  }, [settings.needs_percentage, settings.wants_percentage, settings.savings_percentage]);

  const calculateCategoryAllocations = useCallback((
    availableBalance: number,
    transactions: Transaction[]
  ): CategoryAllocations => {
    const limits = calculateCategoryLimits(availableBalance);

    const allocations: CategoryAllocations = {
      needs: { limit: limits.needs, allocated: 0, remaining: limits.needs, percentage: settings.needs_percentage },
      wants: { limit: limits.wants, allocated: 0, remaining: limits.wants, percentage: settings.wants_percentage },
      savings: { limit: limits.savings, allocated: 0, remaining: limits.savings, percentage: settings.savings_percentage },
      income: { limit: 0, allocated: 0, remaining: 0, percentage: 0 },
    };

    transactions.forEach(tx => {
      if (tx.amount < 0 && tx.parent_category_name) {
        const budgetCategory = SUBCATEGORY_NAME_TO_BUDGET_CATEGORY[tx.parent_category_name];
        if (budgetCategory && budgetCategory !== 'income') {
          const absAmount = Math.abs(tx.amount);
          allocations[budgetCategory].allocated += absAmount;
          allocations[budgetCategory].remaining =
            allocations[budgetCategory].limit - allocations[budgetCategory].allocated;
        }
      }
    });

    return allocations;
  }, [calculateCategoryLimits, settings]);

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
    refetch: invalidate,
  };
};
