
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics, formatCurrency } from "@/lib/realData";
import { 
  LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, 
  CartesianGrid, Tooltip
} from "recharts";
import { DateFilter, DateFilterOption } from "@/components/common/DateFilter";
import { 
  getFilterDescription, 
  getDateRangeForFilter, 
  getLabelsForFilter,
  DateRange 
} from "@/lib/dateFilterUtils";

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
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [selectedBarData, setSelectedBarData] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const dateRange = getDateRangeForFilter(selectedPeriod, customDateRange);
  const xAxisLabels = getLabelsForFilter(selectedPeriod, dateRange);

  const getChartData = () => {
    const categories = Object.keys(categoryColors);
    
    if (selectedPeriod === '1W') {
      // Generate data for past 7 days
      return xAxisLabels.map((label, index) => {
        const data: any = { day: label };
        let total = 0;
        categories.forEach(cat => {
          const value = 50 + Math.random() * 50;
          data[cat] = value;
          total += value;
        });
        data.total = total;
        data.dateRange = label;
        return data;
      });
    }
    if (selectedPeriod === '1M') {
      // Generate data for past 4 weeks using the actual labels
      return xAxisLabels.map((label, index) => {
        const data: any = { week: label };
        let total = 0;
        data["Housing & Utilities"] = 300 + Math.random() * 200;
        data["Savings & Investments"] = 600 + Math.random() * 200;
        data["Personal & Lifestyle"] = 400 + Math.random() * 200;
        data["Food & Groceries"] = 500 + Math.random() * 150;
        data["Transportation & Fuel"] = 400 + Math.random() * 150;
        data["Entertainment & Recreation"] = 300 + Math.random() * 150;
        data["Healthcare & Medical"] = 250 + Math.random() * 400;
        
        total = categories.reduce((sum, cat) => sum + (data[cat] || 0), 0);
        data.total = total;
        data.dateRange = label;
        return data;
      });
    }
    if (selectedPeriod === '1Y') {
      // Generate data for past 12 months using the actual labels - single line
      return xAxisLabels.map((label, index) => ({
        month: label,
        amount: 2000 + Math.random() * 1500
      }));
    }
    if (selectedPeriod === 'custom') {
      // For custom, use appropriate format based on range
      const daysDiff = Math.ceil(
        (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff <= 14) {
        // Show as days
        return xAxisLabels.map((label) => {
          const data: any = { day: label };
          let total = 0;
          categories.forEach(cat => {
            const value = 50 + Math.random() * 50;
            data[cat] = value;
            total += value;
          });
          data.total = total;
          data.dateRange = label;
          return data;
        });
      } else if (daysDiff <= 60) {
        // Show as weeks
        return xAxisLabels.map((label, index) => {
          const data: any = { week: label };
          let total = 0;
          categories.forEach(cat => {
            const value = 300 + Math.random() * 200;
            data[cat] = value;
            total += value;
          });
          data.total = total;
          data.dateRange = label;
          return data;
        });
      } else {
        // Show as months
        return xAxisLabels.map((label) => ({
          month: label,
          amount: 2000 + Math.random() * 1500,
          savings: 800 + Math.random() * 400,
          netBalance: 1200 + Math.random() * 800
        }));
      }
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
          <div>
            <p className="text-sm text-muted-foreground">{getFilterDescription(selectedPeriod)}</p>
          </div>
          <DateFilter 
            selectedFilter={selectedPeriod}
            onFilterChange={(filter, dateRange) => {
              setSelectedPeriod(filter);
              if (dateRange) {
                setCustomDateRange(dateRange);
              }
            }}
          />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          {selectedPeriod === '1W' || selectedPeriod === '1M' || 
           (selectedPeriod === 'custom' && xAxisLabels.length <= 30) ? (
            <BarChart data={getChartData()} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={selectedPeriod === '1W' || 
                  (selectedPeriod === 'custom' && xAxisLabels.length <= 14) ? "day" : "week"}
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
                formatter={(value: number, name: string) => [`R${Number(value).toFixed(2)}`, name]}
              />
              <Bar dataKey="Housing & Utilities" stackId="a" fill={categoryColors["Housing & Utilities"]} />
              <Bar dataKey="Savings & Investments" stackId="a" fill={categoryColors["Savings & Investments"]} />
              <Bar dataKey="Personal & Lifestyle" stackId="a" fill={categoryColors["Personal & Lifestyle"]} />
              <Bar dataKey="Food & Groceries" stackId="a" fill={categoryColors["Food & Groceries"]} />
              <Bar dataKey="Transportation & Fuel" stackId="a" fill={categoryColors["Transportation & Fuel"]} />
              <Bar dataKey="Dining & Restaurants" stackId="a" fill={categoryColors["Dining & Restaurants"]} />
              <Bar dataKey="Shopping & Retail" stackId="a" fill={categoryColors["Shopping & Retail"]} />
              <Bar dataKey="Entertainment & Recreation" stackId="a" fill={categoryColors["Entertainment & Recreation"]} />
              <Bar dataKey="Healthcare & Medical" stackId="a" fill={categoryColors["Healthcare & Medical"]} />
              <Bar dataKey="Bills & Subscriptions" stackId="a" fill={categoryColors["Bills & Subscriptions"]} />
              <Bar dataKey="Miscellaneous" stackId="a" fill={categoryColors["Miscellaneous"]} radius={[8, 8, 0, 0]} />
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
                label={{ value: 'Amount Spent per Month', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } }}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip formatter={(value, name) => [
                `${formatCurrency(value as number)}`, 
                'Amount Spent'
              ]} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2} 
                name="Amount Spent"
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
