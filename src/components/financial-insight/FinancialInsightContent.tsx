import { TrendingUp, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  BarChart,
  Bar,
  ComposedChart,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceDot
} from "recharts";
import { useTransactions } from "@/hooks/useTransactions";
import { useGoals } from "@/hooks/useGoals";
import { useAccounts } from "@/hooks/useAccounts";
import { useBudgetItems } from "@/hooks/useBudgetItems";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { calculateFinancialMetrics } from "@/lib/realData";
import { BudgetBreakdown } from "@/components/financial-insight/BudgetBreakdown";
import { TransactionHistory } from "@/components/financial-insight/TransactionHistory";
import { EnhancedSpendingChart } from "@/components/dashboard/EnhancedSpendingChart";
import { DateFilter, DateFilterOption } from "@/components/common/DateFilter";
import { getFilterDescription, DateRange, getDateRangeForFilter, getLabelsForFilter, get1MDateRange, get1MLabels } from "@/lib/dateFilterUtils";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { categorizeTransaction } from "@/lib/transactionCategories";
import { useLanguage } from "@/hooks/useLanguage";

interface FinancialInsightContentProps {
  accountId?: string;
}

export const FinancialInsightContent = ({ accountId }: FinancialInsightContentProps) => {
  const { transactions: allTransactions, loading } = useTransactions({ currentMonthOnly: false, limit: 2000 });
  const { accounts } = useAccounts();
  const { calculateTotalMonthly } = useBudgetItems();
  const currentDate = new Date();
  const { upcomingEvents } = useCalendarEvents({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  });
  const { goals } = useGoals();
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
  
  const [categoryAllocationFilter, setCategoryAllocationFilter] = useState<DateFilterOption>("1M");
  const [customAllocationRange, setCustomAllocationRange] = useState<DateRange | undefined>();
  const isMobile = useIsMobile();
  const { t } = useLanguage();

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

    // Generate labels based on filter
    const labels = getLabelsForFilter(netBalanceFilter, dateRange);

    // Compute period end dates for each label so we can check goal creation dates
    let periodEndDates: Date[] = [];
    if (netBalanceFilter === '1W') {
      periodEndDates = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
        .map(day => endOfDay(day));
    } else if (netBalanceFilter === '1M') {
      const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 1 });
      periodEndDates = weeks.map((weekStart, i) => {
        const weekEnd = i < weeks.length - 1 ? new Date(weeks[i + 1].getTime() - 1) : endOfDay(dateRange.to);
        return weekEnd;
      });
    } else {
      // 3M, 6M, 1Y - each label is a month
      const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
      periodEndDates = months.map(m => endOfDay(new Date(m.getFullYear(), m.getMonth() + 1, 0))); // end of month
    }

    // Calculate savings for a specific period end date based on goal creation dates
    const getSavingsForDate = (periodEnd: Date) => {
      return goals.reduce((sum, goal) => {
        const created = new Date(goal.createdAt);
        return created <= periodEnd ? sum + goal.amountSaved : sum;
      }, 0);
    };

    // Find the last known balance before the date range for baseline
    const latestBeforeRange = transactions
      .filter(t => new Date(t.transaction_date) < dateRange.from)
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0];
    const baselineBalance = latestBeforeRange?.balance ?? 0;

    if (filteredTransactions.length === 0) {
      return labels.map((label, index) => ({
        month: label,
        netBalance: baselineBalance,
        budgetBalance: getSavingsForDate(periodEndDates[index])
      }));
    }

    // Group transactions by period and get the last balance for each period
    const balanceByPeriod: { [key: string]: number } = {};
    
    if (netBalanceFilter === '1M') {
      // Use calendar-anchored weeks matching Spending Trend format
      const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { weekStartsOn: 1 });
      
      filteredTransactions.forEach(t => {
        const date = new Date(t.transaction_date);
        const matchingIndex = weeks.findIndex((weekStart, i) => {
          const weekEnd = i < weeks.length - 1 ? weeks[i + 1] : dateRange.to;
          return date >= weekStart && date < weekEnd;
        });
        
        if (matchingIndex !== -1 && labels[matchingIndex]) {
          balanceByPeriod[labels[matchingIndex]] = t.balance ?? 0;
        }
      });
    } else if (netBalanceFilter === '1W') {
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      
      filteredTransactions.forEach(t => {
        const date = new Date(t.transaction_date);
        const matchingIndex = days.findIndex(day => format(day, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
        
        if (matchingIndex !== -1 && labels[matchingIndex]) {
          balanceByPeriod[labels[matchingIndex]] = t.balance ?? 0;
        }
      });
    } else {
      // 3M, 6M, 1Y - group by month
      const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
      
      filteredTransactions.forEach(t => {
        const date = new Date(t.transaction_date);
        const matchingIndex = months.findIndex(monthStart => 
          format(monthStart, 'yyyy-MM') === format(date, 'yyyy-MM')
        );
        
        if (matchingIndex !== -1 && labels[matchingIndex]) {
          balanceByPeriod[labels[matchingIndex]] = t.balance ?? 0;
        }
      });
    }

    // Fill in missing periods with previous balance
    let lastBalance = baselineBalance;
    return labels.map((label, index) => {
      if (balanceByPeriod[label] !== undefined) {
        lastBalance = balanceByPeriod[label];
      }
      return {
        month: label,
        netBalance: lastBalance,
        budgetBalance: getSavingsForDate(periodEndDates[index])
      };
    });
  };

  const netBalanceData = getNetBalanceData();

  // Calculate metrics from same sources as Dashboard FinancialSummary
  const availableBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalBudgetExpenses = calculateTotalMonthly();
  const totalUpcomingEvents = upcomingEvents.reduce((sum, event) => sum + event.budgetedAmount, 0);
  const budgetBalance = totalBudgetExpenses + totalUpcomingEvents;
  
  // Spending: sum of negative transactions for current month, fallback to latest month with data
  const currentMonthIdx = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const currentMonthExpenses = transactions
    .filter(t => {
      const d = new Date(t.transaction_date);
      return t.amount < 0 && d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  // Fallback: if no current month spending, use the latest month that has data
  const spending = currentMonthExpenses > 0 ? currentMonthExpenses : (() => {
    const expenseTransactions = transactions.filter(t => t.amount < 0);
    if (expenseTransactions.length === 0) return 0;
    const latest = expenseTransactions.sort((a, b) => 
      new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    )[0];
    const latestDate = new Date(latest.transaction_date);
    return expenseTransactions
      .filter(t => {
        const d = new Date(t.transaction_date);
        return d.getMonth() === latestDate.getMonth() && d.getFullYear() === latestDate.getFullYear();
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  })();

  // Historical comparison data from monthlySpending array
  const fallback = { netBalance: 0, amount: 0, savings: 0, month: '' };
  const previousMonthData = monthlySpending[currentMonthIdx - 1] || fallback;
  const threeMonthsAgoData = monthlySpending[Math.max(0, currentMonthIdx - 3)] || fallback;
  const sixMonthsAgoData = monthlySpending[Math.max(0, currentMonthIdx - 6)] || fallback;
  const oneYearAgoData = monthlySpending[Math.max(0, currentMonthIdx - 12)] || fallback;

  // Category colors and labels for all categories
  const categoryColors: Record<string, string> = {
    "H&U": "#3B82F6",        // Housing & Utilities - blue
    "S&I": "#10B981",        // Savings & Investments - green
    "P&L": "#8B5CF6",        // Personal & Lifestyle - purple
    "F&G": "#84CC16",        // Food & Groceries - lime green
    "T/F": "#F59E0B",        // Transportation & Fuel - amber/orange
    "D&R": "#EC4899",        // Dining & Restaurants - pink
    "S&R": "#A855F7",        // Shopping & Retail - light purple
    "E&R": "#f85f00",        // Entertainment & Recreation - orange
    "H&M": "#ff3132",        // Healthcare & Medical - red
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
    const rangeTo = endOfDay(dateRange.to);
    
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
          <CardTitle className="heading-main">{t('finance.accountInsight')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetBreakdown 
            availableBalance={availableBalance}
            budgetBalance={budgetBalance}
            spending={spending}
            previousMonth={{
              availableBalance: previousMonthData.netBalance,
              budgetBalance: budgetBalance * 0.9,
              spending: previousMonthData.amount || spending * 0.9
            }}
            threeMonthsAgo={{
              availableBalance: threeMonthsAgoData.netBalance,
              budgetBalance: budgetBalance * 0.9,
              spending: threeMonthsAgoData.amount || spending * 0.85
            }}
            sixMonthsAgo={{
              availableBalance: sixMonthsAgoData.netBalance,
              budgetBalance: budgetBalance * 0.9,
              spending: sixMonthsAgoData.amount || spending * 0.8
            }}
            oneYearAgo={{
              availableBalance: oneYearAgoData.netBalance,
              budgetBalance: budgetBalance * 0.9,
              spending: oneYearAgoData.amount || spending * 0.75
            }}
            showOnlyTable={true}
          />
        </CardContent>
      </Card>

      {/* Budget Allocation Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="heading-main">Budget Allocation</CardTitle>
          <Button
            variant={isDetailed ? "default" : "outline"}
            size="sm"
            onClick={() => setIsDetailed(!isDetailed)}
            className="text-xs"
          >
            {isDetailed ? "Simple" : "Detailed"}
          </Button>
        </CardHeader>
        <CardContent className="px-0">
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
            dateFilter={categoryAllocationFilter}
            customDateRange={customAllocationRange}
          />
          <div className="flex justify-center mt-4 px-6">
            <DateFilter 
              selectedFilter={categoryAllocationFilter}
              onFilterChange={(filter, dateRange) => {
                setCategoryAllocationFilter(filter);
                if (dateRange) {
                  setCustomAllocationRange(dateRange);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Net Balance Over Time Chart */}
      {isMobile ? (
        <div className="mt-4 -mx-3">
          <div className="pb-2 mb-2 px-3">
            <div className="flex flex-col gap-1">
              <div>
                <div className="heading-card">Balance</div>
                <p className="text-xs text-muted-foreground mt-0.5">{getFilterDescription(netBalanceFilter)}</p>
              </div>
            </div>
          </div>
          <div>
            {(() => {
              return (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={netBalanceData} margin={{ top: 20, right: 24, left: 24, bottom: 5 }}>
                <defs>
                  <linearGradient id="fillAvailableMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#292929" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#292929" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillSavingsMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#05ff86" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#05ff86" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" hide={true} />
                <YAxis hide={true} domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
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
                  formatter={(value: number, name: string) => {
                    const label = name === 'Available Balance' ? 'Available Balance' : "Saving's Balance";
                    return [`R${Number(value).toFixed(2)}`, label];
                  }}
                />
                {(() => {
                  const maxPoint = netBalanceData.reduce((max, d) => d.netBalance > max.value ? { month: d.month, value: d.netBalance } : max, { month: '', value: 0 });
                  const minPoint = netBalanceData.reduce((min, d) => d.netBalance < min.value ? { month: d.month, value: d.netBalance } : min, { month: netBalanceData[0]?.month ?? '', value: netBalanceData[0]?.netBalance ?? Infinity });
                  return (
                    <>
                      {maxPoint.value > 0 && (
                        <ReferenceDot x={maxPoint.month} y={maxPoint.value} r={0}>
                          <text x={0} y={-8} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 600, fill: 'hsl(var(--foreground))' }}>
                            {`R${maxPoint.value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
                          </text>
                        </ReferenceDot>
                      )}
                      {minPoint.value < Infinity && minPoint.month !== maxPoint.month && (
                        <ReferenceDot x={minPoint.month} y={minPoint.value} r={0}>
                          <text x={0} y={16} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 600, fill: 'hsl(var(--foreground))' }}>
                            {`R${minPoint.value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
                          </text>
                        </ReferenceDot>
                      )}
                    </>
                  );
                })()}
                <Area type="monotone" dataKey="netBalance" fill="url(#fillAvailableMobile)" stroke="none" tooltipType="none" />
                <Area type="monotone" dataKey="budgetBalance" fill="url(#fillSavingsMobile)" stroke="none" tooltipType="none" />
                <Line 
                  type="monotone" 
                  dataKey="netBalance" 
                  name="Available Balance"
                  stroke="#292929" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="budgetBalance" 
                  name="Saving's Balance"
                  stroke="#05ff86" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
              );
            })()}
            <div className="flex justify-center mt-4 px-3">
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
        </div>
      ) : (
        <Card>
          <CardHeader className={isMobile ? "pb-2" : ""}>
            <div>
              <CardTitle className="heading-main">Balance</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{getFilterDescription(netBalanceFilter)}</p>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {(() => {
              return (
            <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
              <ComposedChart data={netBalanceData} margin={{ top: 20, right: 24, left: 24, bottom: 5 }}>
                <defs>
                  <linearGradient id="fillAvailableDesktop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#292929" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#292929" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fillSavingsDesktop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#05ff86" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#05ff86" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" hide={true} />
                <YAxis hide={true} domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
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
                  formatter={(value: number, name: string) => {
                    const label = name === 'Available Balance' ? 'Available Balance' : "Saving's Balance";
                    return [`R${Number(value).toFixed(2)}`, label];
                  }}
                />
                {(() => {
                  const maxPoint = netBalanceData.reduce((max, d) => d.netBalance > max.value ? { month: d.month, value: d.netBalance } : max, { month: '', value: 0 });
                  const minPoint = netBalanceData.reduce((min, d) => d.netBalance < min.value ? { month: d.month, value: d.netBalance } : min, { month: netBalanceData[0]?.month ?? '', value: netBalanceData[0]?.netBalance ?? Infinity });
                  return (
                    <>
                      {maxPoint.value > 0 && (
                        <ReferenceDot x={maxPoint.month} y={maxPoint.value} r={0}>
                          <text x={0} y={-8} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 600, fill: 'hsl(var(--foreground))' }}>
                            {`R${maxPoint.value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
                          </text>
                        </ReferenceDot>
                      )}
                      {minPoint.value < Infinity && minPoint.month !== maxPoint.month && (
                        <ReferenceDot x={minPoint.month} y={minPoint.value} r={0}>
                          <text x={0} y={16} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 600, fill: 'hsl(var(--foreground))' }}>
                            {`R${minPoint.value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
                          </text>
                        </ReferenceDot>
                      )}
                    </>
                  );
                })()}
                <Area type="monotone" dataKey="netBalance" fill="url(#fillAvailableDesktop)" stroke="none" tooltipType="none" />
                <Area type="monotone" dataKey="budgetBalance" fill="url(#fillSavingsDesktop)" stroke="none" tooltipType="none" />
                <Line 
                  type="monotone" 
                  dataKey="netBalance" 
                  name="Available Balance"
                  stroke="#292929" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="budgetBalance" 
                  name="Saving's Balance"
                  stroke="#05ff86" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
              );
            })()}
            <div className="flex justify-center mt-4 px-6">
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="heading-card">
                    {selectedCategoryForGraph 
                      ? `${categoryLabels[selectedCategoryForGraph]} Spending` 
                      : "Spending by Category"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{getFilterDescription(categoryFilter)}</p>
                </div>


              </div>
              {selectedCategoryForGraph && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategoryForGraph(null)}
                  className="text-xs w-fit"
                >
                  Back
                </Button>
              )}
            </div>
          </div>
          <div>
            <ResponsiveContainer width="100%" height={300}>
              {selectedCategoryForGraph ? (
                <LineChart data={categoryLineData} margin={{ top: 20, right: 24, left: 24, bottom: 5 }}>
                  <XAxis dataKey="period" hide={true} />
                  <YAxis hide={true} domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'hsl(var(--foreground))' }}
                    itemStyle={{ fontSize: '14px', padding: '4px 0', color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`R${Number(value).toFixed(2)}`, 'Amount']}
                    cursor={false}
                  />
                  {(() => {
                    const maxPoint = categoryLineData.reduce((max, d) => d.amount > max.value ? { period: d.period, value: d.amount } : max, { period: '', value: 0 });
                    return maxPoint.value > 0 ? (
                      <ReferenceDot x={maxPoint.period} y={maxPoint.value} r={0}>
                        <text x={0} y={-8} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 600, fill: 'hsl(var(--foreground))' }}>
                          {`R${maxPoint.value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
                        </text>
                      </ReferenceDot>
                    ) : null;
                  })()}
                  <Line type="monotone" dataKey="amount" stroke={categoryColors[selectedCategoryForGraph]} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                </LineChart>
              ) : (
                <BarChart data={categoryData} margin={{ top: 5, right: 24, left: 24, bottom: 0 }} onClick={handleBarClick}>
                  <XAxis dataKey="category" hide={true} />
                  <YAxis hide={true} domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'hsl(var(--foreground))' }}
                    itemStyle={{ fontSize: '14px', padding: '4px 0', color: 'hsl(var(--foreground))' }}
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
            <div className="flex justify-center mt-4 px-3">
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
            {!selectedCategoryForGraph && (
              <div className="flex justify-center mt-2">
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
           <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="heading-main">
                {selectedCategoryForGraph 
                  ? `${categoryLabels[selectedCategoryForGraph]} Spending` 
                  : "Spending by Category"}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{getFilterDescription(categoryFilter)}</p>
              {selectedCategoryForGraph && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategoryForGraph(null)}
                  className="text-xs mt-2"
                >
                  Back
                </Button>
              )}
            </div>


          </CardHeader>
          <CardContent className="px-0">
            <ResponsiveContainer width="100%" height={300}>
              {selectedCategoryForGraph ? (
                <LineChart data={categoryLineData} margin={{ top: 20, right: 24, left: 24, bottom: 5 }}>
                  <XAxis dataKey="period" hide={true} />
                  <YAxis hide={true} domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'hsl(var(--foreground))' }}
                    itemStyle={{ fontSize: '14px', padding: '4px 0', color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`R${Number(value).toFixed(2)}`, 'Amount']}
                    cursor={false}
                  />
                  {(() => {
                    const maxPoint = categoryLineData.reduce((max, d) => d.amount > max.value ? { period: d.period, value: d.amount } : max, { period: '', value: 0 });
                    return maxPoint.value > 0 ? (
                      <ReferenceDot x={maxPoint.period} y={maxPoint.value} r={0}>
                        <text x={0} y={-8} textAnchor="middle" style={{ fontSize: '11px', fontWeight: 600, fill: 'hsl(var(--foreground))' }}>
                          {`R${maxPoint.value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
                        </text>
                      </ReferenceDot>
                    ) : null;
                  })()}
                  <Line type="monotone" dataKey="amount" stroke={categoryColors[selectedCategoryForGraph]} strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                </LineChart>
              ) : (
                <BarChart data={categoryData} margin={{ top: 5, right: 24, left: 24, bottom: 0 }} onClick={handleBarClick}>
                  <XAxis dataKey="category" hide={true} />
                  <YAxis hide={true} domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'hsl(var(--foreground))' }}
                    itemStyle={{ fontSize: '14px', padding: '4px 0', color: 'hsl(var(--foreground))' }}
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
            <div className="flex justify-center mt-4 px-6">
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
            {!selectedCategoryForGraph && (
              <div className="flex justify-center mt-2 px-6">
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