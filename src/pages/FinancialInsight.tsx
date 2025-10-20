import { TrendingUp } from "lucide-react";
import { useState } from "react";
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
import { DateFilter, DateFilterOption } from "@/components/common/DateFilter";
import { getFilterDescription, DateRange } from "@/lib/dateFilterUtils";

const FinancialInsight = () => {
  const { transactions, loading } = useTransactions();
  const { monthlySpending, monthlyIncome, monthlyExpenses } = calculateFinancialMetrics(transactions);
  const [spendingTrendFilter, setSpendingTrendFilter] = useState<DateFilterOption>("1W");
  const [categoryFilter, setCategoryFilter] = useState<DateFilterOption>("1W");
  const [netBalanceFilter, setNetBalanceFilter] = useState<DateFilterOption>("1Y");
  const [customSpendingRange, setCustomSpendingRange] = useState<DateRange | undefined>();
  const [customCategoryRange, setCustomCategoryRange] = useState<DateRange | undefined>();
  const [customNetBalanceRange, setCustomNetBalanceRange] = useState<DateRange | undefined>();

  // Net balance data for the graph
  const netBalanceData = monthlySpending.map(item => ({
    month: item.month,
    netBalance: item.netBalance
  }));

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

  // Stacked bar chart data for spending trend (Mon-Sun) with all 11 categories
  const spendingTrendData = [
    { 
      day: "Mon", 
      "F&G": 450, "T/F": 120, "D&R": 0, "S&R": 0, 
      "E&R": 0, "P&L": 200, "H&U": 0, "H&M": 0, 
      "B&S": 0, "S&I": 500, "Misc": 50 
    },
    { 
      day: "Tue", 
      "F&G": 380, "T/F": 150, "D&R": 280, "S&R": 0, 
      "E&R": 0, "P&L": 150, "H&U": 0, "H&M": 0, 
      "B&S": 0, "S&I": 0, "Misc": 40 
    },
    { 
      day: "Wed", 
      "F&G": 420, "T/F": 0, "D&R": 0, "S&R": 850, 
      "E&R": 0, "P&L": 180, "H&U": 3500, "H&M": 0, 
      "B&S": 0, "S&I": 0, "Misc": 0 
    },
    { 
      day: "Thu", 
      "F&G": 290, "T/F": 140, "D&R": 0, "S&R": 0, 
      "E&R": 450, "P&L": 0, "H&U": 0, "H&M": 0, 
      "B&S": 0, "S&I": 0, "Misc": 60 
    },
    { 
      day: "Fri", 
      "F&G": 510, "T/F": 180, "D&R": 320, "S&R": 0, 
      "E&R": 0, "P&L": 250, "H&U": 0, "H&M": 0, 
      "B&S": 1200, "S&I": 0, "Misc": 0 
    },
    { 
      day: "Sat", 
      "F&G": 620, "T/F": 0, "D&R": 480, "S&R": 750, 
      "E&R": 850, "P&L": 320, "H&U": 0, "H&M": 0, 
      "B&S": 0, "S&I": 0, "Misc": 80 
    },
    { 
      day: "Sun", 
      "F&G": 580, "T/F": 0, "D&R": 550, "S&R": 0, 
      "E&R": 680, "P&L": 280, "H&U": 0, "H&M": 650, 
      "B&S": 0, "S&I": 0, "Misc": 70 
    }
  ];

  // Category data for spending by category chart with all 11 categories
  const categoryData = [
    { category: "F&G", amount: 3250, color: categoryColors["F&G"] },
    { category: "T/F", amount: 590, color: categoryColors["T/F"] },
    { category: "D&R", amount: 1630, color: categoryColors["D&R"] },
    { category: "S&R", amount: 1600, color: categoryColors["S&R"] },
    { category: "E&R", amount: 1980, color: categoryColors["E&R"] },
    { category: "P&L", amount: 1380, color: categoryColors["P&L"] },
    { category: "H&U", amount: 3500, color: categoryColors["H&U"] },
    { category: "H&M", amount: 650, color: categoryColors["H&M"] },
    { category: "B&S", amount: 1200, color: categoryColors["B&S"] },
    { category: "S&I", amount: 500, color: categoryColors["S&I"] },
    { category: "Misc", amount: 300, color: categoryColors["Misc"] }
  ];

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
      
      <div className="border-b border-foreground mb-4" />

      {/* Two Column Layout: Budget Insight + Budget Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <BudgetInsights isLoading={loading} />
        </div>
        <div>
          <BudgetBreakdown 
            availableBalance={availableBalance}
            budgetBalance={budgetBalance}
            spending={spending}
            previousMonth={{
              availableBalance: previousMonthData.netBalance,
              budgetBalance: monthlyIncome * 0.3,
              spending: monthlyExpenses * 0.9 // Previous month spending estimate
            }}
          />
        </div>
      </div>

      {/* Net Balance Over Time Chart */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Net Balance Over Time</h2>
            <p className="text-xs text-muted-foreground">{getFilterDescription(netBalanceFilter)}</p>
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

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={netBalanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: 'hsl(var(--foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              label={{ 
                value: 'Net Balance (ZAR)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
              }}
              tick={{ fill: 'hsl(var(--foreground))' }}
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
              formatter={(value: number) => [`R${value.toLocaleString()}`, 'Net Balance']}
            />
            <Line 
              type="monotone" 
              dataKey="netBalance" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Spending Trend Chart */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Spending Trend</h2>
            <p className="text-xs text-muted-foreground">{getFilterDescription(spendingTrendFilter)}</p>
          </div>
          <DateFilter 
            selectedFilter={spendingTrendFilter}
            onFilterChange={(filter, dateRange) => {
              setSpendingTrendFilter(filter);
              if (dateRange) {
                setCustomSpendingRange(dateRange);
              }
            }}
          />
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={spendingTrendData} onClick={handleBarClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="day" 
              tick={{ fill: 'hsl(var(--foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              label={{ 
                value: 'Amount (ZAR)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
              }}
              tick={{ fill: 'hsl(var(--foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              cursor={false}
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
                if (value === 0) return null;
                return [
                  `R${value}`, 
                  categoryLabels[name as keyof typeof categoryLabels] || name
                ];
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload) return null;
                
                const activePayload = payload.filter(p => p.value && p.value > 0);
                if (activePayload.length === 0) return null;
                
                const total = activePayload.reduce((sum, p) => sum + (p.value as number || 0), 0);
                
                return (
                  <div style={{
                    backgroundColor: 'white',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      {label}: R{total.toLocaleString()}
                    </p>
                    {activePayload.map((entry: any, index: number) => (
                      <p key={index} style={{ fontSize: '14px', padding: '4px 0', color: entry.color }}>
                        {categoryLabels[entry.name as keyof typeof categoryLabels] || entry.name}: R{entry.value}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="H&U" stackId="a" fill={categoryColors["H&U"]} cursor="pointer" />
            <Bar dataKey="S&I" stackId="a" fill={categoryColors["S&I"]} cursor="pointer" />
            <Bar dataKey="P&L" stackId="a" fill={categoryColors["P&L"]} cursor="pointer" />
            <Bar dataKey="F&G" stackId="a" fill={categoryColors["F&G"]} cursor="pointer" />
            <Bar dataKey="T/F" stackId="a" fill={categoryColors["T/F"]} cursor="pointer" />
            <Bar dataKey="D&R" stackId="a" fill={categoryColors["D&R"]} cursor="pointer" />
            <Bar dataKey="S&R" stackId="a" fill={categoryColors["S&R"]} cursor="pointer" />
            <Bar dataKey="E&R" stackId="a" fill={categoryColors["E&R"]} cursor="pointer" />
            <Bar dataKey="H&M" stackId="a" fill={categoryColors["H&M"]} cursor="pointer" />
            <Bar dataKey="B&S" stackId="a" fill={categoryColors["B&S"]} cursor="pointer" />
            <Bar dataKey="Misc" stackId="a" fill={categoryColors["Misc"]} cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Spending By Category Chart */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Spending By Category</h2>
            <p className="text-xs text-muted-foreground">{getFilterDescription(categoryFilter)}</p>
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

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData} onClick={handleBarClick}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis 
              dataKey="category" 
              tick={{ fill: 'hsl(var(--foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              label={{ 
                value: 'Spending (R)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
              }}
              tick={{ fill: 'hsl(var(--foreground))' }}
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
                      R{value.toLocaleString()}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="amount" cursor="pointer">
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
      </div>

      {/* Transaction History Section */}
      <TransactionHistory />
    </div>
  );
};

export default FinancialInsight;