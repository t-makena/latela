
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";
import { 
  LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip
} from "recharts";
import { DateFilter, DateFilterOption } from "@/components/common/DateFilter";
import { getFilterDescription } from "@/lib/dateFilterUtils";

interface EnhancedSpendingChartProps {
  accountSpecific?: boolean;
  accountId?: string;
}

const categoryColors = {
  "Housing & Utilities": "#3B82F6",
  "Savings & Investments": "#10B981",
  "Personal & Lifestyle": "#8B5CF6",
  "Food & Groceries": "#EAB308",
  "Transportation & Fuel": "#6366F1",
  "Dining & Restaurants": "#EC4899",
  "Shopping & Retail": "#A855F7",
  "Entertainment & Recreation": "#F97316",
  "Healthcare & Medical": "#EF4444",
  "Bills & Subscriptions": "#6B7280",
  "Miscellaneous": "#14B8A6"
};

export const EnhancedSpendingChart = ({ 
  accountSpecific = false, 
  accountId
}: EnhancedSpendingChartProps) => {
  const { transactions } = useTransactions();
  const { monthlySpending, monthlyIncome, monthlySavings } = calculateFinancialMetrics(transactions);
  const [selectedPeriod, setSelectedPeriod] = useState<DateFilterOption>("1M");
  const [selectedBarData, setSelectedBarData] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const getChartData = () => {
    if (selectedPeriod === '1W') {
      return []; // No daily data available from current transactions
    }
    if (selectedPeriod === '1M') {
      // Generate 4 weeks of data with new categories
      const categories = Object.keys(categoryColors);
      return [
        {
          week: 'Week 1',
          "Housing & Utilities": 400,
          "Savings & Investments": 800,
          "Personal & Lifestyle": 533,
          "Food & Groceries": 581,
          "Transportation & Fuel": 494,
          "Entertainment & Recreation": 451,
          "Healthcare & Medical": 289,
          dateRange: '2025-05-01 to 2025-05-07',
          total: 3348
        },
        {
          week: 'Week 2',
          "Housing & Utilities": 350,
          "Savings & Investments": 700,
          "Personal & Lifestyle": 420,
          "Food & Groceries": 620,
          "Transportation & Fuel": 380,
          "Entertainment & Recreation": 320,
          "Healthcare & Medical": 800,
          dateRange: '2025-05-08 to 2025-05-14',
          total: 3590
        },
        {
          week: 'Week 3',
          "Housing & Utilities": 400,
          "Savings & Investments": 750,
          "Personal & Lifestyle": 680,
          "Food & Groceries": 590,
          "Transportation & Fuel": 510,
          "Entertainment & Recreation": 290,
          "Healthcare & Medical": 650,
          dateRange: '2025-05-15 to 2025-05-21',
          total: 3870
        },
        {
          week: 'Week 4',
          "Housing & Utilities": 320,
          "Savings & Investments": 600,
          "Personal & Lifestyle": 550,
          "Food & Groceries": 540,
          "Transportation & Fuel": 460,
          "Entertainment & Recreation": 380,
          "Healthcare & Medical": 500,
          dateRange: '2025-05-22 to 2025-05-28',
          total: 3350
        }
      ];
    }
    return monthlySpending;
  };

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const weekData = data.activePayload[0].payload;
      setSelectedBarData(weekData);
      setShowDetailModal(true);
    }
  };

  const getCategoryBreakdown = () => {
    if (!selectedBarData) return [];
    
    const breakdown = Object.keys(categoryColors)
      .map(category => ({
        category,
        amount: selectedBarData[category] || 0,
        color: categoryColors[category as keyof typeof categoryColors],
        percentage: ((selectedBarData[category] || 0) / selectedBarData.total * 100).toFixed(0)
      }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    
    return breakdown;
  };

  const targetExpense = monthlyIncome > 0 ? (monthlyIncome - monthlySavings) / 30 : 0;
  const futureTargetExpense = targetExpense;
  const categories = Object.keys(categoryColors);

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{getFilterDescription(selectedPeriod)}</p>
          <DateFilter 
            selectedFilter={selectedPeriod}
            onFilterChange={(filter) => setSelectedPeriod(filter)}
          />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          {selectedPeriod === '1M' ? (
            <BarChart data={getChartData()} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="week" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Amount Spent', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } }}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip 
                cursor={false}
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  padding: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ 
                  fontSize: '14px', 
                  fontWeight: '600',
                  marginBottom: '8px'
                }}
                itemStyle={{ 
                  fontSize: '14px',
                  padding: '4px 0'
                }}
                formatter={(value: number, name: string) => [`R${value}`, name]}
              />
              {categories.map((category, index) => (
                <Bar 
                  key={category}
                  dataKey={category} 
                  stackId="a" 
                  fill={categoryColors[category as keyof typeof categoryColors]}
                  radius={index === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip formatter={(value, name) => [
                `${formatCurrency(value as number)}`, 
                name === 'amount' ? 'Expenses' : name === 'savings' ? 'Savings' : 'Net Balance'
              ]} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#ff6b6b" 
                strokeWidth={2} 
                name="Expenses"
              />
              <Line 
                type="monotone" 
                dataKey="savings" 
                stroke="#41b883" 
                strokeWidth={2} 
                name="Savings"
              />
              <Line 
                type="monotone" 
                dataKey="netBalance" 
                stroke="#1e65ff" 
                strokeWidth={2} 
                name="Net Balance"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Spending Details - {selectedBarData?.week}
            </DialogTitle>
          </DialogHeader>
          
          {selectedBarData && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">
                  R {selectedBarData.total?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Date: {selectedBarData.dateRange}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Category Breakdown</h4>
                <div className="space-y-3">
                  {getCategoryBreakdown().map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground">
                          R {item.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
