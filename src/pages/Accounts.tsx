import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Menu, CircleIcon, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateFilter, DateFilterOption } from "@/components/common/DateFilter";
import { getFilterDescription, DateRange } from "@/lib/dateFilterUtils";

const Accounts = () => {
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<DateFilterOption>("1W");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWeekData, setSelectedWeekData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Mock data
  const accounts = [
    {
      id: 1,
      bankName: "Nedbank Bank Cheque Account",
      balance: 103779.00,
      logo: "N",
      paymentProvider: "mastercard"
    }
  ];

  const transactions = [
    {
      id: 1,
      category: "Housing & Utilities",
      categoryColor: "bg-blue-100 text-blue-700",
      name: "Rent",
      date: "27 June 2025",
      amount: -13000.00
    },
    {
      id: 2,
      category: "Savings & Investments",
      categoryColor: "bg-green-100 text-green-700",
      name: "Savings transfer",
      date: "27 June 2025",
      amount: -7000.00
    },
    {
      id: 3,
      category: "Personal & Lifestyle",
      categoryColor: "bg-orange-100 text-orange-700",
      name: "Futbol",
      date: "27 June 2025",
      amount: -85.00
    }
  ];

  // Category colors mapping - consistent with Dashboard
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

  const getChartData = () => {
    const categories = Object.keys(categoryColors);
    
    if (selectedTimeFilter === '1W') {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => {
        const data: any = { day: label };
        let total = 0;
        let topCategory = '';
        categories.forEach(cat => {
          const value = 50 + Math.random() * 100;
          data[cat] = value;
          total += value;
          if (value > 0) topCategory = cat;
        });
        data.total = total;
        data.dateRange = label;
        data.topCategory = topCategory;
        return data;
      });
    }
    if (selectedTimeFilter === '1M') {
      const now = new Date();
      return Array.from({length: 4}, (_, i) => {
        const weekNum = Math.floor((now.getDate() - 7 * (3-i)) / 7) + 1;
        const label = `Week ${i + 1}`;
        const data: any = { week: label };
        let total = 0;
        let topCategory = '';
        categories.forEach(cat => {
          const value = 300 + Math.random() * 200;
          data[cat] = value;
          total += value;
          if (value > 0) topCategory = cat;
        });
        data.total = total;
        data.dateRange = label;
        data.topCategory = topCategory;
        return data;
      });
    }
    if (selectedTimeFilter === '1Y') {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months.map((label) => {
        const data: any = { month: label };
        let total = 0;
        let topCategory = '';
        categories.forEach(cat => {
          const value = 1200 + Math.random() * 800;
          data[cat] = value;
          total += value;
          if (value > 0) topCategory = cat;
        });
        data.total = total;
        data.dateRange = label;
        data.topCategory = topCategory;
        return data;
      });
    }
    // Default 1W data
    return Array.from({length: 4}, (_, i) => {
      const data: any = { week: `Week ${i + 1}` };
      let total = 0;
      let topCategory = '';
      categories.forEach(cat => {
        const value = 300 + Math.random() * 200;
        data[cat] = value;
        total += value;
        if (value > 0) topCategory = cat;
      });
      data.total = total;
      data.topCategory = topCategory;
      return data;
    });
  };

  const chartData = getChartData();

  const categories = Object.keys(categoryColors);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const weekData = data.activePayload[0].payload;
      setSelectedWeekData(weekData);
      setIsModalOpen(true);
    }
  };

  const getCategoryBreakdown = () => {
    if (!selectedWeekData) return [];
    
    const breakdown = categories
      .map(category => ({
        category,
        amount: selectedWeekData[category] || 0,
        color: categoryColors[category as keyof typeof categoryColors],
        percentage: ((selectedWeekData[category] || 0) / selectedWeekData.total * 100).toFixed(0)
      }))
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    
    return breakdown;
  };

  const timeFilters = ["1W", "1M", "3M", "6M", "1Y"];

  const currentAccount = accounts[currentAccountIndex];

  // Filter transactions based on selected category
  const filteredTransactions = selectedCategory 
    ? transactions.filter(t => t.category === selectedCategory)
    : transactions;

  const handleCategoryClick = (category: string) => {
    // Toggle: if same category is clicked, clear the filter
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 pb-20 space-y-6">
        {/* Account Card */}
        <Card className="rounded-3xl border border-border shadow-lg bg-muted/30">
          <CardContent className="p-6">
            {/* Bank Name with Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-9 w-12 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-background font-bold text-lg">{currentAccount.logo}</span>
              </div>
              <h2 className="text-base font-bold text-foreground">{currentAccount.bankName}</h2>
            </div>

            {/* Budget Balance */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Budget Balance</p>
                <p className="text-4xl font-bold text-foreground">
                  R{currentAccount.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Available Balance: R{currentAccount.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Payment Provider Logo */}
              <div className="h-12 w-16 bg-foreground rounded-lg flex items-center justify-center">
                <div className="flex gap-1">
                  <div className="h-8 w-8 rounded-full bg-destructive opacity-80"></div>
                  <div className="h-8 w-8 rounded-full bg-secondary -ml-4"></div>
                </div>
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {accounts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentAccountIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentAccountIndex 
                      ? 'w-6 bg-foreground' 
                      : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Recent transactions</h3>
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-muted-foreground underline"
              >
                Clear filter
              </button>
            )}
          </div>
          
          <div className="space-y-0 border-t border-border">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="py-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge 
                      variant="secondary" 
                      className={`mb-2 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${transaction.categoryColor} ${selectedCategory === transaction.category ? 'ring-2 ring-foreground' : ''}`}
                      onClick={() => handleCategoryClick(transaction.category)}
                    >
                      {transaction.category}
                    </Badge>
                    <p className="font-semibold text-foreground text-base mb-1">
                      {transaction.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.date}
                    </p>
                  </div>
                  <p className="text-destructive font-bold text-base">
                    -R{Math.abs(transaction.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="text-sm text-foreground underline mt-3 font-medium">
            see more
          </button>
        </div>

        {/* Spending Trend Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">Spending Trend</h3>
              <p className="text-xs text-muted-foreground">{getFilterDescription(selectedTimeFilter)}</p>
            </div>
            <DateFilter 
              selectedFilter={selectedTimeFilter}
              onFilterChange={(filter, dateRange) => {
                setSelectedTimeFilter(filter);
                if (dateRange) {
                  setCustomDateRange(dateRange);
                }
              }}
            />
          </div>

          {/* Chart */}
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} onClick={handleBarClick}>
                <XAxis 
                  dataKey={selectedTimeFilter === '1Y' ? "month" : selectedTimeFilter === '1W' ? "day" : "week"}
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
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ 
                    background: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                  formatter={(value: number, name: string) => [`R${Number(value).toFixed(2)}`, name]}
                />
                {Object.keys(categoryColors).map((category, index) => (
                  <Bar 
                    key={category}
                    dataKey={category} 
                    stackId="a" 
                    fill={categoryColors[category as keyof typeof categoryColors]}
                    shape={(props: any) => {
                      const { x, y, width, height, payload } = props;
                      const isTop = payload.topCategory === category;
                      if (!isTop) return <rect x={x} y={y} width={width} height={height} fill={categoryColors[category as keyof typeof categoryColors]} />;
                      const radius = 8;
                      const path = `M ${x},${y + height} L ${x},${y + radius} Q ${x},${y} ${x + radius},${y} L ${x + width - radius},${y} Q ${x + width},${y} ${x + width},${y + radius} L ${x + width},${y + height} Z`;
                      return <path d={path} fill={categoryColors[category as keyof typeof categoryColors]} />;
                    }}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>

      {/* Detailed Breakdown Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Spending Details - {selectedWeekData?.week}
            </DialogTitle>
          </DialogHeader>
          
          {selectedWeekData && (
            <div className="space-y-6">
              {/* Total Amount */}
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">
                  R {selectedWeekData.total.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Date: {selectedWeekData.dateRange}
                </p>
              </div>

              {/* Category Breakdown */}
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
    </div>
  );
};

export default Accounts;
