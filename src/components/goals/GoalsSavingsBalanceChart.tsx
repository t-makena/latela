import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  Tooltip, ReferenceDot
} from "recharts";
import { useGoals } from "@/hooks/useGoals";
import { useTransactions } from "@/hooks/useTransactions";
import { useSavingsAdjustment } from "@/hooks/useSavingsAdjustment";
import { useUserSettings, SavingsAdjustmentStrategy } from "@/hooks/useUserSettings";
import { useLanguage } from "@/hooks/useLanguage";
import { get1MDateRange, get1MLabels } from "@/lib/dateFilterUtils";
import { eachWeekOfInterval, format, endOfDay } from "date-fns";
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
  
  // Earliest goal creation date
  const earliestGoalDate = useMemo(() => {
    if (goals.length === 0) return null;
    return goals.reduce((earliest, goal) => {
      const d = new Date(goal.createdAt);
      return d < earliest ? d : earliest;
    }, new Date(goals[0].createdAt));
  }, [goals]);

  // Generate chart data: past + future projection
  const chartData = useMemo(() => {
    const now = new Date();
    const data: { month: string; expected: number; savings: number | null }[] = [];
    
    if (selectedPeriod === '1M') {
      // Weekly data points for 1M
      const dateRange = get1MDateRange();
      const labels = get1MLabels(dateRange);
      const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 1 });
      
      // Flat expected = total monthly allocation (per memory)
      const flatExpected = totalSaved;
      
      for (let i = 0; i < weeks.length; i++) {
        const weekStart = weeks[i];
        const weekEnd = i < weeks.length - 1 ? weeks[i + 1] : endOfDay(dateRange.to);
        
        const anyGoalExisted = earliestGoalDate ? earliestGoalDate <= weekEnd : false;
        const isCurrentWeek = now >= weekStart && now < weekEnd;
        const isPastOrCurrent = now >= weekStart;
        
        let savingsBalance: number | null;
        if (!anyGoalExisted) {
          savingsBalance = 0;
        } else if (isCurrentWeek || (i === weeks.length - 1 && now >= weekStart)) {
          savingsBalance = totalSaved;
        } else if (isPastOrCurrent) {
          savingsBalance = 0;
        } else {
          savingsBalance = null; // future
        }
        
        data.push({
          month: labels[i] || format(weekStart, 'MMM') + ' W' + Math.ceil(weekStart.getDate() / 7),
          expected: anyGoalExisted ? Math.round(flatExpected) : 0,
          savings: savingsBalance !== null ? Math.round(savingsBalance) : null,
        });
      }
      
      return data;
    }
    
    // Monthly data points for 3M, 6M, 1Y — split half back, half forward
    const periodSplits: Record<string, { back: number; forward: number }> = {
      '3M': { back: 1, forward: 2 },
      '6M': { back: 3, forward: 3 },
      '1Y': { back: 6, forward: 6 },
    };
    const { back, forward } = periodSplits[selectedPeriod] || { back: 3, forward: 3 };
    
    for (let i = -back; i <= forward; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const endOfThisMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const isCurrentMonth = i === 0;
      const isFuture = i > 0;
      const anyGoalExisted = earliestGoalDate ? earliestGoalDate <= endOfThisMonth : false;
      
      // Expected Balance: forward projection from totalSaved
      let expected: number;
      if (!anyGoalExisted) {
        expected = 0;
      } else if (isCurrentMonth) {
        expected = totalSaved;
      } else if (isFuture) {
        expected = totalSaved + (expectedMonthlySavings * i);
      } else {
        expected = 0; // past before current month
      }
      
      // Saving's Balance: only show for current and past months where goals existed
      let savings: number | null;
      if (isFuture) {
        savings = null; // no future data
      } else if (!anyGoalExisted) {
        savings = 0;
      } else if (isCurrentMonth) {
        savings = totalSaved;
      } else {
        savings = 0;
      }
      
      data.push({
        month: monthName,
        expected: Math.round(expected),
        savings: savings !== null ? Math.round(savings) : null,
      });
    }
    
    return data;
  }, [selectedPeriod, transactions, expectedMonthlySavings, totalSaved, goals, earliestGoalDate]);
  
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
        <CardTitle className="heading-main">{t('goals.savingsBalance') || 'Savings Balance'}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {/* Chart */}
        {(() => {
          return (
            <ResponsiveContainer width="100%" height={compact ? 200 : 250}>
              <LineChart data={chartData} margin={{ top: 20, right: 24, left: 24, bottom: 5 }}>
                <XAxis dataKey="month" hide={true} />
                <YAxis hide={true} domain={[0, 'auto']} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'Expected Balance' ? (t('goals.expectedBalance') || 'Expected Balance') : 
                    "Saving's Balance"
                  ]}
                  labelFormatter={(label) => label}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem'
                  }}
                />
                {(() => {
                  const maxPoint = chartData.reduce((max, d) => d.savings > max.value ? { month: d.month, value: d.savings } : max, { month: '', value: 0 });
                  return maxPoint.value > 0 ? (
                    <ReferenceDot x={maxPoint.month} y={maxPoint.value} r={0}>
                      <text x={0} y={-8} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 600, fill: 'hsl(var(--foreground))' }}>
                        {formatCurrency(maxPoint.value)}
                      </text>
                    </ReferenceDot>
                  ) : null;
                })()}
                <Line 
                  type="monotone" 
                  dataKey="expected" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2} 
                  name="Expected Balance"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="savings" 
                  stroke="#22c55e" 
                  strokeWidth={2} 
                  name="Saving's Balance"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          );
        })()}
        <div className="flex justify-center px-6">
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
