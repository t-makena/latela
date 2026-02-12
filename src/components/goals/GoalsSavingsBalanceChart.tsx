import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend
} from "recharts";
import { useGoals } from "@/hooks/useGoals";
import { useTransactions } from "@/hooks/useTransactions";
import { useSavingsAdjustment } from "@/hooks/useSavingsAdjustment";
import { useUserSettings, SavingsAdjustmentStrategy } from "@/hooks/useUserSettings";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowRight, TrendingDown } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface GoalsSavingsBalanceChartProps {
  compact?: boolean;
}

export const GoalsSavingsBalanceChart = ({ compact = false }: GoalsSavingsBalanceChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');
  const [isApplying, setIsApplying] = useState(false);
  const { goals, updateGoal } = useGoals();
  const { transactions } = useTransactions();
  const { savingsStatus } = useSavingsAdjustment();
  const { savingsAdjustmentStrategy } = useUserSettings();
  const { t } = useLanguage();
  
  // Calculate expected monthly savings (sum of all goal allocations)
  const expectedMonthlySavings = useMemo(() => {
    return goals.reduce((sum, goal) => sum + goal.monthlyAllocation, 0);
  }, [goals]);
  
  // Calculate total saved across all goals
  const totalSaved = useMemo(() => {
    return goals.reduce((sum, goal) => sum + goal.amountSaved, 0);
  }, [goals]);
  
  // Generate chart data based on period
  // Logic: 
  // - Expected Balance (orange): Shows the cumulative expected savings for each month
  // - Savings Balance (green): If available balance >= expected for that month, show expected; else show actual
  const chartData = useMemo(() => {
    const now = new Date();
    const periods: Record<string, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 };
    const monthCount = periods[selectedPeriod];
    const data = [];
    
    // Track cumulative expected savings
    let cumulativeExpected = 0;
    
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Find transactions for this month
      const monthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.transaction_date);
        return txDate.getMonth() === date.getMonth() && 
               txDate.getFullYear() === date.getFullYear();
      });
      
      // Calculate available balance at end of month
      const monthAvailableBalance = monthTransactions.length > 0
        ? Math.abs(monthTransactions[monthTransactions.length - 1]?.balance || 0)
        : 0;
      
      // Expected balance: only accumulate allocations for goals that existed by this month
      const endOfThisMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const monthExpected = goals.reduce((sum, goal) => {
        const goalCreated = new Date(goal.createdAt);
        if (goalCreated <= endOfThisMonth) {
          return sum + goal.monthlyAllocation;
        }
        return sum;
      }, 0);
      cumulativeExpected += monthExpected;
      
      // KEY LOGIC: Savings balance
      // If available balance >= expected for this month, show expected (target met)
      // Otherwise, show what we can calculate from actual savings progression
      const isCurrentMonth = i === 0;
      
      // Past months: no historical data, show 0
      // Current month: show actual total saved
      let savingsBalance: number;
      if (isCurrentMonth) {
        savingsBalance = totalSaved;
      } else {
        savingsBalance = 0;
      }
      
      data.push({
        month: monthName,
        expected: Math.round(cumulativeExpected),
        savings: Math.round(savingsBalance),
      });
    }
    
    return data;
  }, [selectedPeriod, transactions, expectedMonthlySavings, totalSaved]);
  
  const periods = [
    { key: '1M' as const, label: '1M' },
    { key: '3M' as const, label: '3M' },
    { key: '6M' as const, label: '6M' },
    { key: '1Y' as const, label: '1Y' },
  ];
  
  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  
  const getStrategyLabel = (strategy: SavingsAdjustmentStrategy) => {
    switch (strategy) {
      case 'inverse_priority':
        return t('settings.inversePriority') || 'Prioritize important goals';
      case 'proportional':
        return t('settings.proportional') || 'Reduce proportionally';
      case 'even_distribution':
        return t('settings.evenDistribution') || 'Reduce equally';
    }
  };
  
  const handleApplyAdjustments = async () => {
    if (!savingsStatus.hasShortfall || savingsStatus.adjustments.length === 0) return;
    
    setIsApplying(true);
    try {
      for (const adjustment of savingsStatus.adjustments) {
        const goal = goals.find(g => g.id === adjustment.goalId);
        if (!goal) continue;
        
        const dueDate = new Date();
        if (adjustment.timelineExtensionMonths > 0 && adjustment.timelineExtensionMonths !== Infinity) {
          dueDate.setMonth(dueDate.getMonth() + adjustment.timelineExtensionMonths);
        }
        
        await updateGoal(adjustment.goalId, {
          name: goal.name,
          target: goal.target,
          currentSaved: goal.amountSaved,
          monthlyAllocation: adjustment.newAllocation,
          dueDate: dueDate,
        });
      }
      
      toast.success(t('goals.adjustmentsApplied') || 'Adjustments applied successfully!');
    } catch (error) {
      console.error('Error applying adjustments:', error);
      toast.error(t('common.error') || 'Failed to apply adjustments');
    } finally {
      setIsApplying(false);
    }
  };
  
  return (
    <Card className="bg-card border border-border w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="heading-main">{t('goals.savingsBalance') || 'Savings Balance'}</CardTitle>
          <div className="flex gap-1">
            {periods.map(period => (
              <Button
                key={period.key}
                variant={selectedPeriod === period.key ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setSelectedPeriod(period.key)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        {(() => {
          const allValues = chartData.flatMap(d => [d.expected, d.savings]);
          const minValue = Math.min(...allValues);
          const maxValue = Math.max(...allValues);
          const ticks = minValue === maxValue ? [minValue] : [minValue, maxValue];
          return (
            <ResponsiveContainer width="100%" height={compact ? 200 : 250}>
              <LineChart data={chartData} margin={{ bottom: 40 }}>
                <XAxis dataKey="month" hide={true} />
                <YAxis 
                  hide={false}
                  ticks={ticks}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  width={70}
                  domain={[minValue, maxValue]}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'expected' ? (t('goals.expectedBalance') || 'Expected Balance') : 
                    (t('goals.totalAmountSaved') || 'Total Amount Saved')
                  ]}
                  labelFormatter={(label) => label}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="expected" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2} 
                  name={t('goals.expectedBalance') || 'Expected Balance'}
                  dot={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="savings" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  name={t('goals.totalAmountSaved') || 'Total Amount Saved'}
                  dot={{ fill: '#22c55e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          );
        })()}
        
        {/* Shortfall Alert - only shown when there's a shortfall */}
        {savingsStatus.hasShortfall && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-destructive font-medium">{t('goals.shortfall') || 'Shortfall'}</span>
              <span className="font-bold text-destructive">{formatCurrency(savingsStatus.shortfall)}</span>
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              {t('goals.usingStrategy') || 'Strategy'}: <span className="font-medium">{getStrategyLabel(savingsAdjustmentStrategy)}</span>
            </div>
            
            {!compact && savingsStatus.adjustments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <TrendingDown className="h-4 w-4" />
                  {t('goals.adjustmentPreview') || 'Adjustment Preview'}
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {savingsStatus.adjustments.map((adj) => (
                    <div key={adj.goalId} className="text-sm flex items-center justify-between bg-muted/30 p-2 rounded">
                      <div className="flex-1">
                        <span className="font-medium">{adj.goalName}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{formatCurrency(adj.currentAllocation)}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="text-destructive">{formatCurrency(adj.newAllocation)}</span>
                          <span className="ml-2">(-{formatCurrency(adj.reduction)})</span>
                        </div>
                      </div>
                      {adj.timelineExtensionMonths > 0 && adj.timelineExtensionMonths !== Infinity && (
                        <span className="text-xs text-muted-foreground">
                          +{adj.timelineExtensionMonths} {t('budget.monthly') || 'months'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleApplyAdjustments}
              disabled={isApplying || savingsStatus.adjustments.length === 0}
              className="w-full"
              variant="destructive"
            >
              {isApplying 
                ? (t('common.saving') || 'Applying...') 
                : (t('goals.applyAdjustments') || 'Apply Adjustments')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
