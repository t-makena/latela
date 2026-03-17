import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface UseAnalyticsDataParams {
  startDate: Date;
  endDate: Date;
}

export const useAnalyticsData = ({ startDate, endDate }: UseAnalyticsDataParams) => {
  const { user } = useAuth();
  const userId = user?.id;
  const start = format(startDate, 'yyyy-MM-dd');
  const end = format(endDate, 'yyyy-MM-dd');

  const { data: categoryData = [], isLoading: categoryLoading } = useQuery({
    queryKey: ['analytics-categories', userId, start, end],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_spending_by_category', {
        p_user_id: userId!,
        p_start_date: start,
        p_end_date: end,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const { data: monthlyTrends = [], isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-trends', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_monthly_spending_trends', {
        p_user_id: userId!,
        p_months: 12,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const { data: topMerchants = [], isLoading: merchantsLoading } = useQuery({
    queryKey: ['analytics-merchants', userId, start, end],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_merchants', {
        p_user_id: userId!,
        p_start_date: start,
        p_end_date: end,
        p_limit: 10,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const { data: dailySpending = [], isLoading: dailyLoading } = useQuery({
    queryKey: ['analytics-daily', userId, start, end],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_daily_spending', {
        p_user_id: userId!,
        p_start_date: start,
        p_end_date: end,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const isLoading = categoryLoading || trendsLoading || merchantsLoading || dailyLoading;

  return { categoryData, monthlyTrends, topMerchants, dailySpending, isLoading };
};
