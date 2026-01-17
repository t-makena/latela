import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateBudgetScore, BudgetScoreResult } from '@/lib/budgetScoreCalculator';
import { useIncomeSettings } from './useIncomeSettings';

export const useBudgetScore = () => {
  const { payday } = useIncomeSettings();
  
  const { data: scoreData, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['budget-score', payday],
    queryFn: async (): Promise<BudgetScoreResult | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;
      
      // Get payday from income settings or user_settings
      let paydayDate = payday || 25;
      
      // Also check user_settings table
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('payday_date')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (userSettings?.payday_date) {
        paydayDate = userSettings.payday_date;
      }
      
      const result = await calculateBudgetScore(user.id, paydayDate);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  });

  const error = queryError instanceof Error ? queryError.message : queryError ? 'An error occurred' : null;

  return {
    scoreData,
    loading,
    error,
    refetch,
    totalScore: scoreData?.totalScore ?? 0,
    pillars: scoreData?.pillars ?? {
      budgetCompliance: 0,
      spendingConsistency: 0,
      savingsHealth: 0,
      cashSurvivalRisk: 0
    },
    metrics: scoreData?.metrics ?? {
      remainingBalance: 0,
      daysUntilPayday: 0,
      avgDailySpend: 0,
      expectedSpendToPayday: 0,
      riskRatio: 0,
      safeToSpendPerDay: 0
    },
    riskLevel: scoreData?.riskLevel ?? 'safe'
  };
};
