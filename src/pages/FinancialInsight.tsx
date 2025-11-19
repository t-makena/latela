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
import { getFilterDescription, DateRange } from "@/lib/dateFilterUtils";
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

  // Generate category data based on filter - empty until real data is available
  const getCategoryData = () => {
    return [
      { category: "F&G", amount: 0, color: categoryColors["F&G"] },
      { category: "T/F", amount: 0, color: categoryColors["T/F"] },
      { category: "D&R", amount: 0, color: categoryColors["D&R"] },
      { category: "S&R", amount: 0, color: categoryColors["S&R"] },
      { category: "E&R", amount: 0, color: categoryColors["E&R"] },
      { category: "P&L", amount: 0, color: categoryColors["P&L"] },
      { category: "H&U", amount: 0, color: categoryColors["H&U"] },
      { category: "H&M", amount: 0, color: categoryColors["H&M"] },
      { category: "B&S", amount: 0, color: categoryColors["B&S"] },
      { category: "S&I", amount: 0, color: categoryColors["S&I"] },
      { category: "Misc", amount: 0, color: categoryColors["Misc"] }
    ];
  };

  const categoryData = getCategoryData();

  const handleBarClick = (data: any) => {
    console.log("Bar clicked:", data);
    // Future modal implementation
  };

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
          <div className="pb-2 mb-2 px-3">
            <div className="text-base font-georama">Spending Trend</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">for the past month</p>
          </div>
          <div>
            <EnhancedSpendingChart />
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-georama">Spending Trend</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">for the past month</p>
          </CardHeader>
          <CardContent className="p-3">
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
                <div className="text-base font-georama">Spending By Category</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{getFilterDescription(categoryFilter)}</p>
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
          </div>
          <div>
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
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-georama">Spending By Category</CardTitle>
                <p className="text-[10px] text-muted-foreground mt-0.5">{getFilterDescription(categoryFilter)}</p>
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