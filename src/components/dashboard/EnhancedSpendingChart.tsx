
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
import { generateChartDataFromTransactions } from "@/lib/chartDataUtils";
import { useIsMobile } from "@/hooks/use-mobile";

interface EnhancedSpendingChartProps {
  accountSpecific?: boolean;
  accountId?: string;
  title?: string;
  showTitle?: boolean;
}

const categoryColors = {
  "Housing & Utilities": "#3B82F6",
  "Savings & Investments": "#10B981",
  "Personal & Lifestyle": "#8B5CF6",
  "Food & Groceries": "#84CC16",
  "Transportation & Fuel": "#6366F1",
  "Dining & Restaurants": "#EC4899",
  "Shopping & Retail": "#A855F7",
  "Entertainment & Recreation": "#F97316",
  "Healthcare & Medical": "#ff3132",
  "Bills & Subscriptions": "#6B7280",
  "Miscellaneous": "#06B6D4"
};

export const EnhancedSpendingChart = ({ 
  accountSpecific = false, 
  accountId,
  title = "Spending Trend",
  showTitle = true
}: EnhancedSpendingChartProps) => {
  const { transactions: allTransactions } = useTransactions();
  
  // Filter transactions by account if accountId is provided
  const transactions = accountId 
    ? allTransactions.filter(t => t.account_id === accountId)
    : allTransactions;
    
  const { monthlySpending, monthlyIncome, monthlySavings } = calculateFinancialMetrics(transactions);
  const [selectedPeriod, setSelectedPeriod] = useState<DateFilterOption>("1M");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [selectedBarData, setSelectedBarData] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const isMobile = useIsMobile();

  const dateRange = getDateRangeForFilter(selectedPeriod, customDateRange);
  const xAxisLabels = getLabelsForFilter(selectedPeriod, dateRange);

  const getChartData = () => {
    // Determine period type for data aggregation
    let periodType: 'day' | 'week' | 'month' = 'day';
    
    if (selectedPeriod === '1W' || (selectedPeriod === 'custom' && xAxisLabels.length <= 14)) {
      periodType = 'day';
    } else if (selectedPeriod === '1M' || (selectedPeriod === 'custom' && xAxisLabels.length <= 30)) {
      periodType = 'week';
    } else {
      periodType = 'month';
    }

    // Generate chart data from real transactions
    const chartData = generateChartDataFromTransactions(
      transactions,
      xAxisLabels,
      dateRange,
      periodType
    );

    return chartData;
  };

  const chartData = getChartData();
  const allTotals = chartData.map((d: any) => d.total || d.amount || 0);
  const minSpend = allTotals.length ? Math.min(...allTotals) : 0;
  const maxSpend = allTotals.length ? Math.max(...allTotals) : 0;
  const spendTicks = minSpend === maxSpend ? [minSpend] : [minSpend, maxSpend];

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
      <div className={isMobile ? "" : "p-6"}>
        {showTitle && (
          <div className={isMobile ? "mb-3 px-3" : "mb-4"}>
            <h3 className={isMobile ? "text-base font-semibold" : "text-lg font-semibold"}>{title}</h3>
            <p className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
              {getFilterDescription(selectedPeriod)}
            </p>
          </div>
        )}
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
          {selectedPeriod === '1W' || selectedPeriod === '1M' || selectedPeriod === '1Y' ||
           (selectedPeriod === 'custom' && xAxisLabels.length <= 30) ? (
            <BarChart data={chartData} onClick={handleBarClick} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey={selectedPeriod === '1Y' ? "month" : selectedPeriod === '1W' || 
                  (selectedPeriod === 'custom' && xAxisLabels.length <= 14) ? "day" : "week"}
                hide={true}
              />
              <YAxis hide={true} />
              <Tooltip 
                cursor={false}
                contentStyle={{ 
                  background: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  padding: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  color: 'hsl(var(--popover-foreground))'
                }}
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  
                  const total = payload[0].payload.total || 0;
                  
                  return (
                    <div style={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      color: 'hsl(var(--popover-foreground))'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: 'hsl(var(--primary))' }}>
                        Total: {formatCurrency(total)}
                      </div>
                      {payload.filter((entry: any) => entry.value > 0).map((entry: any, index: number) => (
                        <div key={index} style={{ fontSize: '12px', padding: '2px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '12px', height: '12px', backgroundColor: entry.color, borderRadius: '2px' }} />
                          <span>{entry.name}: {formatCurrency(entry.value)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar 
                dataKey="Housing & Utilities" 
                stackId="a" 
                fill={categoryColors["Housing & Utilities"]}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isTop = payload.topCategory === "Housing & Utilities";
                  const radius = isTop ? 8 : 0;
                  if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors["Housing & Utilities"]} />;
                  // Only round top corners
                  const path = `
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                  `;
                  return <path d={path} fill={categoryColors["Housing & Utilities"]} />;
                }}
              />
              <Bar 
                dataKey="Savings & Investments" 
                stackId="a" 
                fill={categoryColors["Savings & Investments"]}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isTop = payload.topCategory === "Savings & Investments";
                  const radius = isTop ? 8 : 0;
                  if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors["Savings & Investments"]} />;
                  const path = `
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                  `;
                  return <path d={path} fill={categoryColors["Savings & Investments"]} />;
                }}
              />
              <Bar 
                dataKey="Personal & Lifestyle" 
                stackId="a" 
                fill={categoryColors["Personal & Lifestyle"]}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isTop = payload.topCategory === "Personal & Lifestyle";
                  const radius = isTop ? 8 : 0;
                  if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors["Personal & Lifestyle"]} />;
                  const path = `
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                  `;
                  return <path d={path} fill={categoryColors["Personal & Lifestyle"]} />;
                }}
              />
              <Bar 
                dataKey="Food & Groceries" 
                stackId="a" 
                fill={categoryColors["Food & Groceries"]}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isTop = payload.topCategory === "Food & Groceries";
                  const radius = isTop ? 8 : 0;
                  if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors["Food & Groceries"]} />;
                  const path = `
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                  `;
                  return <path d={path} fill={categoryColors["Food & Groceries"]} />;
                }}
              />
              <Bar 
                dataKey="Transportation & Fuel" 
                stackId="a" 
                fill={categoryColors["Transportation & Fuel"]}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isTop = payload.topCategory === "Transportation & Fuel";
                  const radius = isTop ? 8 : 0;
                  if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors["Transportation & Fuel"]} />;
                  const path = `
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                  `;
                  return <path d={path} fill={categoryColors["Transportation & Fuel"]} />;
                }}
              />
              <Bar 
                dataKey="Dining & Restaurants" 
                stackId="a" 
                fill={categoryColors["Dining & Restaurants"]}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isTop = payload.topCategory === "Dining & Restaurants";
                  const radius = isTop ? 8 : 0;
                  if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors["Dining & Restaurants"]} />;
                  const path = `
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                  `;
                  return <path d={path} fill={categoryColors["Dining & Restaurants"]} />;
                }}
              />
              <Bar 
                dataKey="Shopping & Retail" 
                stackId="a" 
                fill={categoryColors["Shopping & Retail"]}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isTop = payload.topCategory === "Shopping & Retail";
                  const radius = isTop ? 8 : 0;
                  if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors["Shopping & Retail"]} />;
                  const path = `
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                  `;
                  return <path d={path} fill={categoryColors["Shopping & Retail"]} />;
                }}
              />
              <Bar 
                dataKey="Entertainment & Recreation" 
                stackId="a" 
                fill={categoryColors["Entertainment & Recreation"]}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isTop = payload.topCategory === "Entertainment & Recreation";
                  const radius = isTop ? 8 : 0;
                  if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors["Entertainment & Recreation"]} />;
                  const path = `
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                  `;
                  return <path d={path} fill={categoryColors["Entertainment & Recreation"]} />;
                }}
              />
              <Bar 
                dataKey="Healthcare & Medical" 
                stackId="a" 
                fill={categoryColors["Healthcare & Medical"]}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isTop = payload.topCategory === "Healthcare & Medical";
                  const radius = isTop ? 8 : 0;
                  if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors["Healthcare & Medical"]} />;
                  const path = `
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                  `;
                  return <path d={path} fill={categoryColors["Healthcare & Medical"]} />;
                }}
              />
              <Bar 
                dataKey="Bills & Subscriptions" 
                stackId="a" 
                fill={categoryColors["Bills & Subscriptions"]}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isTop = payload.topCategory === "Bills & Subscriptions";
                  const radius = isTop ? 8 : 0;
                  if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors["Bills & Subscriptions"]} />;
                  const path = `
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                  `;
                  return <path d={path} fill={categoryColors["Bills & Subscriptions"]} />;
                }}
              />
              <Bar 
                dataKey="Miscellaneous" 
                stackId="a" 
                fill={categoryColors["Miscellaneous"]}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isTop = payload.topCategory === "Miscellaneous";
                  const radius = isTop ? 8 : 0;
                  if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors["Miscellaneous"]} />;
                  const path = `
                    M ${x},${y + height}
                    L ${x},${y + radius}
                    Q ${x},${y} ${x + radius},${y}
                    L ${x + width - radius},${y}
                    Q ${x + width},${y} ${x + width},${y + radius}
                    L ${x + width},${y + height}
                    Z
                  `;
                  return <path d={path} fill={categoryColors["Miscellaneous"]} />;
                }}
              />
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" hide={true} />
              <YAxis hide={true} />
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
        <div className="flex justify-center mt-4 px-6">
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
