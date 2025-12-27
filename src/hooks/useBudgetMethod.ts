import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type BudgetMethod = 'zero_based' | 'percentage_based';

interface BudgetMethodSettings {
  budget_method: BudgetMethod;
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
}

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
  const calculateCategoryLimits = (availableBalance: number) => {
    return {
      needs: (settings.needs_percentage / 100) * availableBalance,
      wants: (settings.wants_percentage / 100) * availableBalance,
      savings: (settings.savings_percentage / 100) * availableBalance,
    };
  };

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
    refetch: fetchSettings,
  };
};
