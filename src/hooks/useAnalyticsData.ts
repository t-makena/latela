import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subMonths } from 'date-fns';

export type DatePreset = '30d' | '90d' | '6m' | '12m';

export const PRESET_LABELS: Record<DatePreset, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '6m': 'Last 6 months',
  '12m': 'Last 12 months',
};

export const getDateRange = (preset: DatePreset) => {
  const end = new Date();
  let start: Date;
  switch (preset) {
    case '30d': start = subDays(end, 30); break;
    case '90d': start = subDays(end, 90); break;
    case '6m': start = subMonths(end, 6); break;
    case '12m': start = subMonths(end, 12); break;
  }
  return { start, end };
};

export const useAnalyticsData = (preset: DatePreset) => {
  const { start, end } = getDateRange(preset);

  return useQuery({
    queryKey: ['analytics', preset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_transactions_with_details')
        .select('amount, transaction_date, parent_category_name, parent_category_color, display_merchant_name, description')
        .gte('transaction_date', format(start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(end, 'yyyy-MM-dd'))
        .lt('amount', 0)
        .order('transaction_date', { ascending: true })
        .limit(2000);

      if (error) throw error;

      const transactions = data || [];

      // Monthly breakdown
      const monthMap = new Map<string, number>();
      for (const tx of transactions) {
        const month = format(new Date(tx.transaction_date), 'MMM yy');
        monthMap.set(month, (monthMap.get(month) || 0) + Math.abs(tx.amount));
      }
      const monthlyData = Array.from(monthMap.entries()).map(([month, amount]) => ({ month, amount }));

      // Category breakdown
      const CHART_COLORS = ['#1e65ff', '#41b883', '#ff6b6b', '#ffd166', '#8959a8', '#06b6d4', '#f97316', '#6c757d'];
      const catMap = new Map<string, number>();
      for (const tx of transactions) {
        const cat = tx.parent_category_name || 'Uncategorized';
        catMap.set(cat, (catMap.get(cat) || 0) + Math.abs(tx.amount));
      }
      const categoryData = Array.from(catMap.entries())
        .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      // Top merchants
      const merchantMap = new Map<string, number>();
      for (const tx of transactions) {
        const merchant = tx.display_merchant_name || tx.description || 'Unknown';
        merchantMap.set(merchant, (merchantMap.get(merchant) || 0) + Math.abs(tx.amount));
      }
      const topMerchants = Array.from(merchantMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Summary
      const totalSpent = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      const months = monthlyData.length || 1;
      const avgPerMonth = totalSpent / months;
      const topCategory = categoryData[0]?.name ?? '—';
      const topMerchant = topMerchants[0]?.name ?? '—';

      return { monthlyData, categoryData, topMerchants, totalSpent, avgPerMonth, topCategory, topMerchant };
    },
  });
};
