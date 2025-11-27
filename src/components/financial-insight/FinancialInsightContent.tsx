import { TrendingUp, Info } from "lucide-react";
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
import { BudgetBreakdown } from "@/components/financial-insight/BudgetBreakdown";
import { TransactionHistory } from "@/components/financial-insight/TransactionHistory";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { DateFilter, DateFilterOption } from "@/components/common/DateFilter";
import { getFilterDescription, DateRange, getDateRangeForFilter } from "@/lib/dateFilterUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { categorizeTransaction } from "@/lib/transactionCategories";

interface FinancialInsightContentProps {
  accountId?: string;
}

export const FinancialInsightContent = ({ accountId }: FinancialInsightContentProps) => {
  const { transactions: allTransactions, loading } = useTransactions();
  const location = useLocation();
  const [categoryFilter, setCategoryFilter] = useState<DateFilterOption>("1W");
  const [netBalanceFilter, setNetBalanceFilter] = useState<DateFilterOption>("1Y");
  const [customCategoryRange, setCustomCategoryRange] = useState<DateRange | undefined>();
  const [customNetBalanceRange, setCustomNetBalanceRange] = useState<DateRange | undefined>();
  const [selectedCategoryForHistory, setSelectedCategoryForHistory] = useState<string | undefined>();
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | undefined>();
  const [legendDialogOpen, setLegendDialogOpen] = useState(false);
  const [selectedCategoryForGraph, setSelectedCategoryForGraph] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedCategory, setLastClickedCategory] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Filter transactions by account if accountId is provided
  const transactions = accountId 
    ? allTransactions.filter(t => t.account_id === accountId)
    : allTransactions;

  const { monthlySpending, monthlyIncome, monthlyExpenses } = calculateFinancialMetrics(transactions);

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

  // Generate net balance data based on filter - empty until real data is available
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
      netBalance: 0,
      budgetBalance: 0
    }));
  };

  const netBalanceData = getNetBalanceData();

  // Calculate current and historical data for breakdown
  const currentMonthData = monthlySpending[monthlySpending.length - 1] || { netBalance: 0 };
  const previousMonthData = monthlySpending[monthlySpending.length - 2] || { netBalance: 0 };
  const threeMonthsAgoData = monthlySpending[monthlySpending.length - 4] || { netBalance: 0 };
  const sixMonthsAgoData = monthlySpending[monthlySpending.length - 7] || { netBalance: 0 };
  const oneYearAgoData = monthlySpending[monthlySpending.length - 13] || { netBalance: 0 };
  
  const availableBalance = currentMonthData.netBalance;
  const budgetBalance = monthlyIncome * 0.3; // 30% of income as budget
  const spending = monthlyExpenses;

  // Category colors and labels for all 11 categories
  const categoryColors = {
    "H&U": "#3B82F6",        // Housing & Utilities - blue
    "S&I": "#10B981",        // Savings & Investments - green
    "P&L": "#8B5CF6",        // Personal & Lifestyle - purple
    "F&G": "#84CC16",        // Food & Groceries - lime green
    "T/F": "#F59E0B",        // Transportation & Fuel - amber/orange
    "D&R": "#EC4899",        // Dining & Restaurants - pink
    "S&R": "#A855F7",        // Shopping & Retail - light purple
    "E&R": "#F97316",        // Entertainment & Recreation - orange
    "H&M": "#EF4444",        // Healthcare & Medical - red
    "B&S": "#6B7280",        // Bills & Subscriptions - gray
    "Misc": "#06B6D4"        // Miscellaneous - cyan
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

  // Category short code mapping
  const categoryToShortCode: { [key: string]: string } = {
    "Housing & Utilities": "H&U",
    "Savings & Investments": "S&I",
    "Personal & Lifestyle": "P&L",
    "Food & Groceries": "F&G",
    "Transportation & Fuel": "T/F",
    "Dining & Restaurants": "D&R",
    "Shopping & Retail": "S&R",
    "Entertainment & Recreation": "E&R",
    "Healthcare & Medical": "H&M",
    "Bills & Subscriptions": "B&S",
    "Miscellaneous": "Misc"
  };

  // Generate category data based on actual transactions and filter
  const getCategoryData = () => {
    const dateRange = customCategoryRange || getDateRangeForFilter(categoryFilter);
    
    // Filter transactions by date range and type
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return t.type === 'expense' && 
             transactionDate >= dateRange.from && 
             transactionDate <= dateRange.to;
    });

    // Initialize category totals
    const categoryTotals: { [key: string]: number } = {
      "F&G": 0,
      "T/F": 0,
      "D&R": 0,
      "S&R": 0,
      "E&R": 0,
      "P&L": 0,
      "H&U": 0,
      "H&M": 0,
      "B&S": 0,
      "S&I": 0,
      "Misc": 0
    };

    // Aggregate transactions by category
    filteredTransactions.forEach(transaction => {
      const fullCategory = categorizeTransaction(transaction.description || '');
      const shortCode = categoryToShortCode[fullCategory] || 'Misc';
      const amount = Math.abs(transaction.amount) / 100; // Convert from cents
      categoryTotals[shortCode] += amount;
    });

    return [
      { category: "F&G", amount: categoryTotals["F&G"], color: categoryColors["F&G"] },
      { category: "T/F", amount: categoryTotals["T/F"], color: categoryColors["T/F"] },
      { category: "D&R", amount: categoryTotals["D&R"], color: categoryColors["D&R"] },
      { category: "S&R", amount: categoryTotals["S&R"], color: categoryColors["S&R"] },
      { category: "E&R", amount: categoryTotals["E&R"], color: categoryColors["E&R"] },
      { category: "P&L", amount: categoryTotals["P&L"], color: categoryColors["P&L"] },
      { category: "H&U", amount: categoryTotals["H&U"], color: categoryColors["H&U"] },
      { category: "H&M", amount: categoryTotals["H&M"], color: categoryColors["H&M"] },
      { category: "B&S", amount: categoryTotals["B&S"], color: categoryColors["B&S"] },
      { category: "S&I", amount: categoryTotals["S&I"], color: categoryColors["S&I"] },
      { category: "Misc", amount: categoryTotals["Misc"], color: categoryColors["Misc"] }
    ];
  };

  const categoryData = getCategoryData();

  const handleBarClick = (data: any) => {
    const currentTime = Date.now();
    const category = data?.activeLabel;
    
    if (category === lastClickedCategory && currentTime - lastClickTime < 300) {
      // Double click detected
      setSelectedCategoryForGraph(category);
    } else {
      // Single click
      setLastClickedCategory(category);
      setLastClickTime(currentTime);
    }
  };

  // Generate time-series data for selected category
  const getCategoryLineData = () => {
    if (!selectedCategoryForGraph) return [];

    const labels = categoryFilter === '1W' ? 
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : 
      categoryFilter === '1M' ? 
        ["Week 1", "Week 2", "Week 3", "Week 4"] :
        categoryFilter === '1Y' ?
          ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] :
          ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return labels.map((label) => ({
      period: label,
      amount: 0
    }));
  };

  const categoryLineData = getCategoryLineData();

  return (
    <div className="space-y-6 relative z-10">
      {/* Budget Insight Table */}
      <div>
        <h3 className={isMobile ? "text-base font-semibold mb-3" : "text-lg font-semibold mb-4"}>Budget Insight</h3>
        <BudgetBreakdown 
          availableBalance={availableBalance}
          budgetBalance={budgetBalance}
          spending={spending}
          previousMonth={{
            availableBalance: previousMonthData.netBalance,
            budgetBalance: monthlyIncome * 0.3,
            spending: monthlyExpenses * 0.9
          }}
          threeMonthsAgo={{
            availableBalance: threeMonthsAgoData.netBalance,
            budgetBalance: monthlyIncome * 0.3,
            spending: monthlyExpenses * 0.85
          }}
          sixMonthsAgo={{
            availableBalance: sixMonthsAgoData.netBalance,
            budgetBalance: monthlyIncome * 0.3,
            spending: monthlyExpenses * 0.8
          }}
          oneYearAgo={{
            availableBalance: oneYearAgoData.netBalance,
            budgetBalance: monthlyIncome * 0.3,
            spending: monthlyExpenses * 0.75
          }}
          showOnlyTable={true}
        />
      </div>

      {/* Budget Allocation */}
      <div>
        <h3 className={isMobile ? "text-base font-semibold mb-3" : "text-lg font-semibold mb-4"}>Budget Allocation</h3>
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
          transactions={transactions}
        />
      </div>

      {/* Net Balance Over Time Chart */}
      {isMobile ? (
        <div className="mt-4 -mx-3">
          <div className="pb-2 mb-2 px-3">
            <div className="flex flex-col gap-1">
              <div>
                <div className="text-base font-georama">Balance</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{getFilterDescription(netBalanceFilter)}</p>
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
          </div>
          <div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={netBalanceData} margin={{ left: isMobile ? 0 : 20, right: isMobile ? 0 : 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 60 : 30}
                />
                <YAxis 
                  label={isMobile ? undefined : { 
                    value: 'Balance', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }
                  }}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={isMobile ? 45 : 60}
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
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader className={isMobile ? "pb-2" : ""}>
            <div className={isMobile ? "flex flex-col gap-2" : "flex items-center justify-between"}>
              <div>
                <CardTitle className="text-base font-georama">Balance</CardTitle>
                <p className="text-[10px] text-muted-foreground mt-0.5">{getFilterDescription(netBalanceFilter)}</p>
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
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
              <LineChart data={netBalanceData} margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? "end" : "middle"}
                  height={isMobile ? 60 : 30}
                />
                <YAxis 
                  label={isMobile ? undefined : { 
                    value: 'Balance', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }
                  }}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 11 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={isMobile ? 45 : 60}
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
      )}

      {/* Spending Trend Chart */}
      {isMobile ? (
        <div className="mt-4 -mx-3">
          <EnhancedSpendingChart accountId={accountId} />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <EnhancedSpendingChart accountId={accountId} />
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <div id="transaction-history">
        <TransactionHistory 
          initialCategoryFilterName={selectedCategoryName}
        />
      </div>
    </div>
  );
};