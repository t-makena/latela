import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ReferenceLine
} from "recharts";
import { useGoals } from "@/hooks/useGoals";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics } from "@/lib/realData";
import { useLanguage } from "@/hooks/useLanguage";
import { AlertTriangle } from "lucide-react";

interface GoalsSavingsBalanceChartProps {
  compact?: boolean;
}

export const GoalsSavingsBalanceChart = ({ compact = false }: GoalsSavingsBalanceChartProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');
  const { goals } = useGoals();
  const { transactions } = useTransactions();
  const { t } = useLanguage();
  
  const { monthlySpending, netBalance } = calculateFinancialMetrics(transactions);
  
  // Calculate expected monthly savings (sum of all goal allocations)
  const expectedMonthlySavings = useMemo(() => {
    return goals.reduce((sum, goal) => sum + goal.monthlyAllocation, 0);
  }, [goals]);
  
  // Calculate total saved across all goals
  const totalSaved = useMemo(() => {
    return goals.reduce((sum, goal) => sum + goal.amountSaved, 0);
  }, [goals]);
  
  // Generate chart data based on period
  const chartData = useMemo(() => {
    const now = new Date();
    const periods: Record<string, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 };
    const monthCount = periods[selectedPeriod];
    const data = [];
    
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
      
      // Calculate balance at end of month
      const monthBalance = monthTransactions.length > 0
        ? monthTransactions[monthTransactions.length - 1]?.balance || 0
        : 0;
      
      // Expected balance: accumulating expected savings
      const monthsFromStart = monthCount - i;
      const expectedAtPoint = expectedMonthlySavings * monthsFromStart;
      
      // Savings balance: interpolate from current saved
      const savingsAtPoint = totalSaved * (monthsFromStart / monthCount);
      
      data.push({
        month: monthName,
        available: Math.round(Math.abs(monthBalance)),
        expected: Math.round(expectedAtPoint),
        savings: Math.round(savingsAtPoint),
      });
    }
    
    return data;
  }, [selectedPeriod, transactions, expectedMonthlySavings, totalSaved]);
  
  // Check for shortfall (available < expected)
  const currentData = chartData[chartData.length - 1];
  const hasShortfall = currentData && currentData.available < currentData.expected;
  const shortfallAmount = currentData ? Math.max(0, currentData.expected - currentData.available) : 0;
  
  const periods = [
    { key: '1M' as const, label: '1M' },
    { key: '3M' as const, label: '3M' },
    { key: '6M' as const, label: '6M' },
    { key: '1Y' as const, label: '1Y' },
  ];
  
  const formatCurrency = (value: number) => `R${value.toLocaleString()}`;
  
  return (
    <Card className="bg-card border border-border w-full" style={{ boxShadow: '4px 4px 0px hsl(var(--foreground))' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('goals.savingsBalance') || 'Savings Balance'}</CardTitle>
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
        {hasShortfall && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-destructive/10 rounded-md">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              {t('goals.shortfallWarning') || 'Shortfall'}: {formatCurrency(shortfallAmount)}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={compact ? 200 : 280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value), 
                name === 'available' ? (t('finance.availableBalance') || 'Available') : 
                name === 'expected' ? (t('goals.expectedBalance') || 'Expected') : 
                (t('goals.totalAmountSaved') || 'Savings')
              ]}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="available" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2} 
              name={t('finance.availableBalance') || 'Available'}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line 
              type="monotone" 
              dataKey="expected" 
              stroke="hsl(var(--secondary))" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              name={t('goals.expectedBalance') || 'Expected'}
              dot={{ fill: 'hsl(var(--secondary))' }}
            />
            <Line 
              type="monotone" 
              dataKey="savings" 
              stroke="#41b883" 
              strokeWidth={2} 
              name={t('goals.totalAmountSaved') || 'Savings'}
              dot={{ fill: '#41b883' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
