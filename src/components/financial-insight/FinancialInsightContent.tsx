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
import { getFilterDescription, DateRange, getDateRangeForFilter, getLabelsForFilter } from "@/lib/dateFilterUtils";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfDay } from "date-fns";
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
  const [isDetailed, setIsDetailed] = useState(false);
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

  // Generate net balance data from real transaction data
  const getNetBalanceData = () => {
    const dateRange = customNetBalanceRange || getDateRangeForFilter(netBalanceFilter);
    
    // Filter transactions within the date range
    const filteredTransactions = transactions
      .filter(t => {
        const date = new Date(t.transaction_date);
        return date >= dateRange.from && date <= dateRange.to;
      })
      .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime());

    if (filteredTransactions.length === 0) {
      const labels = netBalanceFilter === '1W' ? 
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : 
        netBalanceFilter === '1M' ? 
          ["Week 1", "Week 2", "Week 3", "Week 4"] :
          netBalanceFilter === '1Y' ?
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] :
            ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return labels.map((label) => ({ month: label, netBalance: 0, budgetBalance: 0 }));
    }

    // Group transactions by period and get the last balance for each period
    const balanceByPeriod: { [key: string]: number } = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.transaction_date);
      let periodKey: string;
      
      if (netBalanceFilter === '1W') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        periodKey = days[date.getDay()];
      } else if (netBalanceFilter === '1M') {
        const weekNum = Math.ceil(date.getDate() / 7);
        periodKey = `Week ${Math.min(weekNum, 4)}`;
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        periodKey = months[date.getMonth()];
      }
      
      // Use the transaction's balance (last one for each period wins)
      balanceByPeriod[periodKey] = t.balance ?? 0;
    });

    // Generate labels based on filter
    const labels = netBalanceFilter === '1W' ? 
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : 
      netBalanceFilter === '1M' ? 
        ["Week 1", "Week 2", "Week 3", "Week 4"] :
        netBalanceFilter === '1Y' ?
          ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] :
          ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Fill in missing periods with previous balance
    let lastBalance = 0;
    return labels.map((label) => {
      if (balanceByPeriod[label] !== undefined) {
        lastBalance = balanceByPeriod[label];
      }
      return {
        month: label,
        netBalance: lastBalance,
        budgetBalance: 0 // Can be calculated from budget items if needed
      };
    });
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

  // Category colors and labels for all categories
  const categoryColors: Record<string, string> = {
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
    "Misc": "#06B6D4",       // Miscellaneous - cyan
    "A/L": "#14B8A6",        // Assistance/Lending - teal
    "Fees": "#64748B",       // Fees - slate
    "Inc": "#22C55E",        // Other Income - green
    "R&R": "#0EA5E9"         // Refunds & Reimbursements - sky blue
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
    "Misc": "Miscellaneous",
    "A/L": "Assistance/Lending",
    "Fees": "Fees",
    "Inc": "Other Income",
    "R&R": "Refunds & Reimbursements"
  };

  // Category short code mapping - use subcategory names as keys
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
    "Miscellaneous": "Misc",
    "Assistance/Lending": "A/L",
    "Assisting/Lending": "A/L",
    "Fees": "Fees",
    "Bank Fees": "Fees",
    "Other Income": "Inc",
    "Refunds & Reimbursements": "R&R",
    "Offertory/Charity": "P&L"
  };

  // Generate category data based on actual transactions and filter using DB categories
  const getCategoryData = () => {
    const dateRange = customCategoryRange || getDateRangeForFilter(categoryFilter);
    
    // Filter transactions by date range and type (expenses only - amount < 0)
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return t.amount < 0 && 
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

    // Aggregate transactions by category - use subcategory first, then parent_category, then fallback to keyword matching
    filteredTransactions.forEach(transaction => {
      // Use subcategory first (e.g., "Healthcare & Medical"), then display_subcategory, then parent_category
      const dbCategory = transaction.display_subcategory_name || 
                         transaction.subcategory_name || 
                         transaction.parent_category_name;
      
      let shortCode = 'Misc';
      if (dbCategory) {
        shortCode = categoryToShortCode[dbCategory] || 'Misc';
      } else {
        // Fallback to keyword matching only if no DB category
        const fullCategory = categorizeTransaction(transaction.description || '');
        shortCode = categoryToShortCode[fullCategory] || 'Misc';
      }
      
      const amount = Math.abs(transaction.amount); // Already in Rands
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

    const dateRange = customCategoryRange || getDateRangeForFilter(categoryFilter);
    const rangeFrom = startOfDay(dateRange.from);
    const rangeTo = startOfDay(dateRange.to);
    
    // Filter transactions by date range, expense type, and selected category
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = startOfDay(new Date(t.transaction_date));
      if (t.amount >= 0) return false; // Only expenses
      if (transactionDate < rangeFrom || transactionDate > rangeTo) return false;
      
      // Match the category short code
      const dbCategory = t.display_subcategory_name || t.subcategory_name || t.parent_category_name;
      let shortCode = 'Misc';
      if (dbCategory) {
        shortCode = categoryToShortCode[dbCategory] || 'Misc';
      } else {
        const fullCategory = categorizeTransaction(t.description || '');
        shortCode = categoryToShortCode[fullCategory] || 'Misc';
      }
      
      return shortCode === selectedCategoryForGraph;
    });

    // Use dynamic labels from dateFilterUtils
    const labels = getLabelsForFilter(categoryFilter, dateRange);

    // Initialize amounts for each period
    const periodAmounts: { [key: string]: number } = {};
    labels.forEach(label => { periodAmounts[label] = 0; });

    // Create date-to-label mapping based on filter type
    if (categoryFilter === '1W' || categoryFilter === 'custom') {
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      
      filteredTransactions.forEach(t => {
        const transactionDate = format(new Date(t.transaction_date), 'yyyy-MM-dd');
        const matchingIndex = days.findIndex(day => format(day, 'yyyy-MM-dd') === transactionDate);
        
        if (matchingIndex !== -1 && labels[matchingIndex]) {
          periodAmounts[labels[matchingIndex]] += Math.abs(t.amount);
        }
      });
    } else if (categoryFilter === '1M') {
      const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 1 });
      
      filteredTransactions.forEach(t => {
        const transactionDate = new Date(t.transaction_date);
        const matchingIndex = weeks.findIndex((weekStart, i) => {
          const weekEnd = i < weeks.length - 1 ? weeks[i + 1] : dateRange.to;
          return transactionDate >= weekStart && transactionDate < weekEnd;
        });
        
        if (matchingIndex !== -1 && labels[matchingIndex]) {
          periodAmounts[labels[matchingIndex]] += Math.abs(t.amount);
        }
      });
    } else {
      // 3M, 6M, 1Y - group by month
      const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
      
      filteredTransactions.forEach(t => {
        const transactionDate = new Date(t.transaction_date);
        const matchingIndex = months.findIndex(monthStart => 
          format(monthStart, 'yyyy-MM') === format(transactionDate, 'yyyy-MM')
        );
        
        if (matchingIndex !== -1 && labels[matchingIndex]) {
          periodAmounts[labels[matchingIndex]] += Math.abs(t.amount);
        }
      });
    }

    return labels.map(label => ({
      period: label,
      amount: periodAmounts[label]
    }));
  };

  const categoryLineData = getCategoryLineData();

  return (
    <div className="space-y-6 relative z-10">
      {/* Budget Insight Card */}
      <Card>
        <CardHeader>
          <CardTitle className={isMobile ? "text-base" : "text-lg"}>Budget Insight</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Budget Allocation Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className={isMobile ? "text-base" : "text-lg"}>Budget Allocation</CardTitle>
          <Button
            variant={isDetailed ? "default" : "outline"}
            size="sm"
            onClick={() => setIsDetailed(!isDetailed)}
            className="text-xs"
          >
            {isDetailed ? "Simple" : "Detailed"}
          </Button>
        </CardHeader>
        <CardContent>
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
            isDetailed={isDetailed}
          />
        </CardContent>
      </Card>

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

      {/* Spending by Category Chart */}
      {isMobile ? (
        <div className="mt-4 -mx-3">
          <div className="pb-2 mb-2 px-3">
            <div className="flex flex-col gap-1">
              <div>
                <div className="text-base font-georama">
                  {selectedCategoryForGraph 
                    ? `${categoryLabels[selectedCategoryForGraph]} Spending` 
                    : "Spending by Category"}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{getFilterDescription(categoryFilter)}</p>
              </div>
              <div className="flex items-center gap-2">
                <DateFilter 
                  selectedFilter={categoryFilter}
                  onFilterChange={(filter, dateRange) => {
                    setCategoryFilter(filter);
                    if (dateRange) {
                      setCustomCategoryRange(dateRange);
                    }
                  }}
                />
                {selectedCategoryForGraph && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategoryForGraph(null)}
                    className="text-xs"
                  >
                    Back
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={300}>
              {selectedCategoryForGraph ? (
                <LineChart data={categoryLineData} margin={{ left: isMobile ? 0 : 20, right: isMobile ? 0 : 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    width={45}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{ 
                      fontSize: '14px',
                      padding: '4px 0',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [`R${Number(value).toFixed(2)}`, 'Amount']}
                    cursor={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke={categoryColors[selectedCategoryForGraph]} 
                    strokeWidth={2}
                    dot={{ fill: categoryColors[selectedCategoryForGraph], r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={categoryData} margin={{ left: isMobile ? 0 : 20, right: isMobile ? 0 : 20 }} onClick={handleBarClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    width={45}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{ 
                      fontSize: '14px',
                      padding: '4px 0',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [`R${Number(value).toFixed(2)}`, 'Amount']}
                    labelFormatter={(label: string) => categoryLabels[label] || label}
                    cursor={false}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
            {!selectedCategoryForGraph && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLegendDialogOpen(true)}
                  className="gap-2"
                >
                  <Info className="h-4 w-4" />
                  See Legend
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-georama">
                  {selectedCategoryForGraph 
                    ? `${categoryLabels[selectedCategoryForGraph]} Spending` 
                    : "Spending by Category"}
                </CardTitle>
                <p className="text-[10px] text-muted-foreground mt-0.5">{getFilterDescription(categoryFilter)}</p>
              </div>
              <div className="flex items-center gap-2">
                <DateFilter 
                  selectedFilter={categoryFilter}
                  onFilterChange={(filter, dateRange) => {
                    setCategoryFilter(filter);
                    if (dateRange) {
                      setCustomCategoryRange(dateRange);
                    }
                  }}
                />
                {selectedCategoryForGraph && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategoryForGraph(null)}
                    className="text-xs"
                  >
                    Back
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {selectedCategoryForGraph ? (
                <LineChart data={categoryLineData} margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Amount (R)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }
                    }}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{ 
                      fontSize: '14px',
                      padding: '4px 0',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [`R${Number(value).toFixed(2)}`, 'Amount']}
                    cursor={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke={categoryColors[selectedCategoryForGraph]} 
                    strokeWidth={2}
                    dot={{ fill: categoryColors[selectedCategoryForGraph], r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={categoryData} margin={{ left: 20, right: 20 }} onClick={handleBarClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Amount (R)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }
                    }}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{ 
                      fontSize: '14px',
                      padding: '4px 0',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [`R${Number(value).toFixed(2)}`, 'Amount']}
                    labelFormatter={(label: string) => categoryLabels[label] || label}
                    cursor={false}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
            {!selectedCategoryForGraph && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setLegendDialogOpen(true)}
                  className="gap-2"
                >
                  <Info className="h-4 w-4" />
                  See Legend
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category Legend Dialog */}
      <Dialog open={legendDialogOpen} onOpenChange={setLegendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Category Legend</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 py-4">
            {Object.entries(categoryColors).map(([key, color]) => (
              <div key={key} className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span style={{ color: color }} className="text-sm font-medium">
                  {categoryLabels[key]}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History */}
      <div id="transaction-history">
        <TransactionHistory 
          initialCategoryFilterName={selectedCategoryName}
        />
      </div>
    </div>
  );
};