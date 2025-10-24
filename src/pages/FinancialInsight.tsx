import { TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { useTransactions } from "@/hooks/useTransactions";
import { calculateFinancialMetrics } from "@/lib/realData";
import { BudgetInsights } from "@/components/financial-insight/BudgetInsights";
import { BudgetBreakdown } from "@/components/financial-insight/BudgetBreakdown";
import { TransactionHistory } from "@/components/financial-insight/TransactionHistory";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { DateFilter, DateFilterOption } from "@/components/common/DateFilter";
import { getFilterDescription, DateRange } from "@/lib/dateFilterUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FinancialInsight = () => {
  const { transactions, loading } = useTransactions();
  const { monthlySpending, monthlyIncome, monthlyExpenses } = calculateFinancialMetrics(transactions);
  const location = useLocation();
  const [categoryFilter, setCategoryFilter] = useState<DateFilterOption>("1W");
  const [netBalanceFilter, setNetBalanceFilter] = useState<DateFilterOption>("1Y");
  const [customCategoryRange, setCustomCategoryRange] = useState<DateRange | undefined>();
  const [customNetBalanceRange, setCustomNetBalanceRange] = useState<DateRange | undefined>();
  const [selectedCategoryForHistory, setSelectedCategoryForHistory] = useState<string | undefined>();
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>();

  // Handle category filter from navigation state
  useEffect(() => {
    if (location.state?.categoryFilterName) {
      setSelectedCategoryName(location.state.categoryFilterName);
      // Scroll to transaction history section
      setTimeout(() => {
        document.getElementById('transaction-history')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.state]);

  // Generate net balance data based on filter
  const getNetBalanceData = () => {
    const labels = netBalanceFilter === '1W' ? 
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : 
      netBalanceFilter === '1M' ? 
        ["Week 1", "Week 2", "Week 3", "Week 4"] :
        netBalanceFilter === '1Y' ?
          ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] :
          ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return labels.map((label) => ({
      month: label,
      netBalance: 80000 + Math.random() * 30000,
      budgetBalance: 90000 + Math.random() * 20000
    }));
  };

  const netBalanceData = getNetBalanceData();

  // Calculate current and previous month data for breakdown
  const currentMonthData = monthlySpending[monthlySpending.length - 1] || { netBalance: 0 };
  const previousMonthData = monthlySpending[monthlySpending.length - 2] || { netBalance: 0 };
  
  const availableBalance = currentMonthData.netBalance;
  const budgetBalance = monthlyIncome * 0.3; // 30% of income as budget
  const spending = monthlyExpenses;

  // Category colors and labels for all 11 categories
  const categoryColors = {
    "H&U": "#3B82F6",        // Housing & Utilities - blue
    "S&I": "#10B981",        // Savings & Investments - green
    "P&L": "#8B5CF6",        // Personal & Lifestyle - purple
    "F&G": "#10B981",        // Food & Groceries - emerald green
    "T/F": "#F59E0B",        // Transportation & Fuel - amber/orange
    "D&R": "#EC4899",        // Dining & Restaurants - pink
    "S&R": "#A855F7",        // Shopping & Retail - light purple
    "E&R": "#F97316",        // Entertainment & Recreation - orange
    "H&M": "#EF4444",        // Healthcare & Medical - red
    "B&S": "#6B7280",        // Bills & Subscriptions - gray
    "Misc": "#14B8A6"        // Miscellaneous - teal
  };

  const categoryLabels: Record<string, string> = {
    "H&U": "Housing & Utilities",
    "S&I": "Savings & Investments",
    "P&L": "Personal & Lifestyle",
    "F&G": "Food & Groceries",
    "T/F": "Transportation & Fuel",
    "D&R": "Dining & Restaurants",
    "S&R": "Shopping & Retail",
    "E&R": "Entertainment & Recreation",
    "H&M": "Healthcare & Medical",
    "B&S": "Bills & Subscriptions",
    "Misc": "Miscellaneous"
  };

  // Generate category data based on filter
  const getCategoryData = () => {
    const multiplier = categoryFilter === '1W' ? 0.25 : categoryFilter === '1M' ? 1 : categoryFilter === '1Y' ? 12 : 1;
    return [
      { category: "F&G", amount: 3250 * multiplier, color: categoryColors["F&G"] },
      { category: "T/F", amount: 590 * multiplier, color: categoryColors["T/F"] },
      { category: "D&R", amount: 1630 * multiplier, color: categoryColors["D&R"] },
      { category: "S&R", amount: 1600 * multiplier, color: categoryColors["S&R"] },
      { category: "E&R", amount: 1980 * multiplier, color: categoryColors["E&R"] },
      { category: "P&L", amount: 1380 * multiplier, color: categoryColors["P&L"] },
      { category: "H&U", amount: 3500 * multiplier, color: categoryColors["H&U"] },
      { category: "H&M", amount: 650 * multiplier, color: categoryColors["H&M"] },
      { category: "B&S", amount: 1200 * multiplier, color: categoryColors["B&S"] },
      { category: "S&I", amount: 500 * multiplier, color: categoryColors["S&I"] },
      { category: "Misc", amount: 300 * multiplier, color: categoryColors["Misc"] }
    ];
  };

  const categoryData = getCategoryData();

  const handleBarClick = (data: any) => {
    console.log("Bar clicked:", data);
    // Future modal implementation
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* Financial Insight Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5" />
        <h1 className="text-xl font-georama font-semibold">Financial Insight</h1>
      </div>
      
      <div className="border-b border-foreground mb-6" />

      {/* Two Column Layout: Insights + Budget Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          {/* 4-point summary */}
          <BudgetInsights isLoading={loading} />
          
          {/* Budget Insight Table */}
          <BudgetBreakdown 
            availableBalance={availableBalance}
            budgetBalance={budgetBalance}
            spending={spending}
            previousMonth={{
              availableBalance: previousMonthData.netBalance,
              budgetBalance: monthlyIncome * 0.3,
              spending: monthlyExpenses * 0.9
            }}
            showOnlyTable={true}
          />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Budget Allocation</h3>
          <BudgetBreakdown 
            availableBalance={availableBalance}
            budgetBalance={budgetBalance}
            spending={spending}
            previousMonth={{
              availableBalance: previousMonthData.netBalance,
              budgetBalance: monthlyIncome * 0.3,
              spending: monthlyExpenses * 0.9
            }}
            showOnlyPieChart={true}
          />
        </div>
      </div>

      {/* Net Balance Over Time Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-georama">Balance</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{getFilterDescription(netBalanceFilter)}</p>
            </div>
            <DateFilter 
              selectedFilter={netBalanceFilter}
              onFilterChange={(filter, dateRange) => {
                setNetBalanceFilter(filter);
                if (dateRange) {
                  setCustomNetBalanceRange(dateRange);
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={netBalanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                label={{ 
                  value: 'Balance', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }
                }}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white',
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
                formatter={(value: number, name: string) => {
                  const label = name === 'netBalance' ? 'Net Balance' : 'Budget Balance';
                  return [`R${Number(value).toFixed(2)}`, label];
                }}
              />
              <Line 
                type="monotone" 
                dataKey="netBalance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="budgetBalance" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Spending Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="font-georama">Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedSpendingChart />
        </CardContent>
      </Card>

      {/* Spending By Category Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-georama">Spending By Category</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{getFilterDescription(categoryFilter)}</p>
            </div>
            <DateFilter 
              selectedFilter={categoryFilter}
              onFilterChange={(filter, dateRange) => {
                setCategoryFilter(filter);
                if (dateRange) {
                  setCustomCategoryRange(dateRange);
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="category" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                label={{ 
                  value: 'Amount Spent', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }
                }}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                cursor={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  
                  const entry = payload[0];
                  const value = entry.value as number;
                  
                  return (
                    <div style={{
                      backgroundColor: 'white',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                        {categoryLabels[label as keyof typeof categoryLabels] || label}
                      </p>
                      <p style={{ fontSize: '14px', padding: '4px 0', color: entry.color }}>
                        R{Number(value).toFixed(2)}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="amount" cursor="pointer" radius={[8, 8, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {/* Comprehensive Category Legend */}
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center items-center text-sm">
            {Object.keys(categoryColors).map((key) => (
              <div key={key} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: categoryColors[key as keyof typeof categoryColors] }}
                />
                <span style={{ color: categoryColors[key as keyof typeof categoryColors] }}>
                  {categoryLabels[key]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History Section */}
      <div id="transaction-history">
        <TransactionHistory initialCategoryFilterName={selectedCategoryName} />
      </div>
    </div>
  );
};

export default FinancialInsight;