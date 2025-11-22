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
  const [legendDialogOpen, setLegendDialogOpen] = useState(false);
  const [selectedCategoryForGraph, setSelectedCategoryForGraph] = useState<string | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickedCategory, setLastClickedCategory] = useState<string | null>(null);
  const isMobile = useIsMobile();

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

  // Category mapping for transaction categorization
  const categoryKeywordMapping: { [key: string]: string } = {
    'woolworths': 'F&G',
    'pick n pay': 'F&G',
    'checkers': 'F&G',
    'groceries': 'F&G',
    'food': 'F&G',
    'supermarket': 'F&G',
    'uber': 'T/F',
    'shell': 'T/F',
    'engen': 'T/F',
    'fuel': 'T/F',
    'petrol': 'T/F',
    'transport': 'T/F',
    'mcdonalds': 'D&R',
    'kfc': 'D&R',
    'nandos': 'D&R',
    'restaurant': 'D&R',
    'dining': 'D&R',
    'takeaway': 'D&R',
    'takealot': 'S&R',
    'mr price': 'S&R',
    'edgars': 'S&R',
    'game': 'S&R',
    'shopping': 'S&R',
    'retail': 'S&R',
    'clothing': 'S&R',
    'netflix': 'B&S',
    'subscription': 'B&S',
    'spotify': 'B&S',
    'insurance': 'B&S',
    'dischem': 'H&M',
    'clicks': 'H&M',
    'pharmacy': 'H&M',
    'medical': 'H&M',
    'doctor': 'H&M',
    'health': 'H&M',
    'rent': 'H&U',
    'utilities': 'H&U',
    'electricity': 'H&U',
    'water': 'H&U',
    'gym': 'E&R',
    'entertainment': 'E&R',
    'movie': 'E&R',
    'savings': 'S&I',
    'investment': 'S&I',
  };

  const categorizeTrans = (description: string): string => {
    const desc = description?.toLowerCase() || '';
    
    for (const [keyword, category] of Object.entries(categoryKeywordMapping)) {
      if (desc.includes(keyword)) {
        return category;
      }
    }
    
    return 'Misc';
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
      const category = categorizeTrans(transaction.description || '');
      const amount = Math.abs(transaction.amount) / 100; // Convert from cents
      categoryTotals[category] += amount;
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
      {/* Two Column Layout: Budget Insight + Budget Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
            showOnlyTable={true}
          />
        </div>
        
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
          />
        </div>
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
          <EnhancedSpendingChart />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <EnhancedSpendingChart />
          </CardContent>
        </Card>
      )}

      {/* Spending By Category Chart */}
      {isMobile ? (
        <div className="mt-4 -mx-3">
          <div className="pb-2 mb-2 px-3">
            <div className="flex flex-col gap-1">
              <div>
                <div className="text-base font-georama">
                  {selectedCategoryForGraph 
                    ? `${categoryLabels[selectedCategoryForGraph as keyof typeof categoryLabels]} Trend`
                    : "Spending By Category"}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{getFilterDescription(categoryFilter)}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedCategoryForGraph && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedCategoryForGraph(null)}
                    className="text-xs h-7"
                  >
                    Back to Categories
                  </Button>
                )}
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
            </div>
          </div>
          <div>
            {selectedCategoryForGraph ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={categoryLineData} margin={{ left: isMobile ? 0 : 20, right: isMobile ? 0 : 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 9 : 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis 
                    label={isMobile ? undefined : { 
                      value: 'Amount Spent', 
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
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    labelStyle={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    itemStyle={{ 
                      fontSize: '14px',
                      padding: '4px 0',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    formatter={(value: number) => [`R${Number(value).toFixed(2)}`, 'Amount']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke={categoryColors[selectedCategoryForGraph as keyof typeof categoryColors]}
                    strokeWidth={2}
                    dot={{ fill: categoryColors[selectedCategoryForGraph as keyof typeof categoryColors], r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} onClick={handleBarClick} margin={{ left: isMobile ? 0 : 20, right: isMobile ? 0 : 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 9 : 11 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                    />
                    <YAxis 
                      label={isMobile ? undefined : { 
                        value: 'Amount Spent', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }
                      }}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 11 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={isMobile ? 45 : 60}
                    />
                    <Tooltip 
                      cursor={false}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        
                        const entry = payload[0];
                        const value = entry.value as number;
                        
                        return (
                          <div style={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            color: 'hsl(var(--popover-foreground))'
                          }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'hsl(var(--popover-foreground))' }}>
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
                
                {/* See Legend Button */}
                <div className="mt-4 flex justify-center">
                  <Dialog open={legendDialogOpen} onOpenChange={setLegendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Info className="h-4 w-4" />
                        See Legend
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Category Legend</DialogTitle>
                      </DialogHeader>
                      <div className={isMobile ? "flex flex-col gap-2" : "grid grid-cols-2 gap-x-8 gap-y-2 text-sm"}>
                        {Object.keys(categoryColors).map((key) => (
                          <div key={key} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoryColors[key as keyof typeof categoryColors] }}
                            />
                            <span style={{ color: categoryColors[key as keyof typeof categoryColors] }}>
                              {categoryLabels[key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-georama">
                  {selectedCategoryForGraph 
                    ? `${categoryLabels[selectedCategoryForGraph as keyof typeof categoryLabels]} Trend`
                    : "Spending By Category"}
                </CardTitle>
                <p className="text-[10px] text-muted-foreground mt-0.5">{getFilterDescription(categoryFilter)}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedCategoryForGraph && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedCategoryForGraph(null)}
                  >
                    Back to Categories
                  </Button>
                )}
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
            </div>
          </CardHeader>
          <CardContent>
            {selectedCategoryForGraph ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={categoryLineData} margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="period" 
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
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    labelStyle={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    itemStyle={{ 
                      fontSize: '14px',
                      padding: '4px 0',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    formatter={(value: number) => [`R${Number(value).toFixed(2)}`, 'Amount']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke={categoryColors[selectedCategoryForGraph as keyof typeof categoryColors]}
                    strokeWidth={2}
                    dot={{ fill: categoryColors[selectedCategoryForGraph as keyof typeof categoryColors], r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} onClick={handleBarClick} margin={{ left: 20, right: 20 }}>
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
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            color: 'hsl(var(--popover-foreground))'
                          }}>
                            <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'hsl(var(--popover-foreground))' }}>
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
                
                {/* See Legend Button */}
                <div className="mt-4 flex justify-center">
                  <Dialog open={legendDialogOpen} onOpenChange={setLegendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Info className="h-4 w-4" />
                        See Legend
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Category Legend</DialogTitle>
                      </DialogHeader>
                      <div className={isMobile ? "flex flex-col gap-2" : "grid grid-cols-2 gap-x-8 gap-y-2 text-sm"}>
                        {Object.keys(categoryColors).map((key) => (
                          <div key={key} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoryColors[key as keyof typeof categoryColors] }}
                            />
                            <span style={{ color: categoryColors[key as keyof typeof categoryColors] }}>
                              {categoryLabels[key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction History Section */}
      <div id="transaction-history">
        <TransactionHistory initialCategoryFilterName={selectedCategoryName} />
      </div>
    </div>
  );
};

export default FinancialInsight;